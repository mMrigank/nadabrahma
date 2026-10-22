#!/usr/bin/env python3
"""
OpenStudio ACE-Step Diffusers generation helper.

The native app talks to this script in two modes:
1. one-shot CLI generation for probes/debugging
2. a persistent localhost worker so the ACE-Step Diffusers pipeline stays warm
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Auto-redirect to OpenStudio managed stem-runtime if current interpreter lacks torch
_managed_python = Path.home() / "Library/Application Support/OpenStudio/stem-runtime/bin/python3"
if _managed_python.is_file() and sys.executable != str(_managed_python):
    try:
        import torch
    except ImportError:
        os.execv(str(_managed_python), [str(_managed_python)] + sys.argv)

import argparse
import hashlib
import json
import shutil
import socket
import struct
import subprocess
import sys
import threading
import time
import traceback
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import numpy as np
import soundfile as sf

from ai_runtime_probe import (
    DEFAULT_MUSIC_GEN_MODEL,
    DEFAULT_MUSIC_GEN_MODEL_REPO,
    resolve_music_gen_checkpoint_root,
    resolve_music_gen_snapshot,
)


DEFAULT_UI_MODEL_ID = DEFAULT_MUSIC_GEN_MODEL
DEFAULT_DIFFUSERS_MODEL_ID = DEFAULT_MUSIC_GEN_MODEL_REPO
DEFAULT_SAMPLE_RATE = 48_000
DEFAULT_DURATION_SECONDS = 30.0
DEFAULT_STEPS = 14
DEFAULT_SHIFT = 3.0
DEFAULT_LANGUAGE = "en"
DEFAULT_TIMESIGNATURE = "4/4"
DEFAULT_KEYSCALE = "C major"
DEFAULT_BPM = 120
HEARTBEAT_INTERVAL_SEC = 5.0
WORKER_PROTOCOL_VERSION = 2
MAX_FRAMED_PAYLOAD_BYTES = 8 * 1024 * 1024
SOURCE_WORKFLOWS = {"variation", "inpaint-selection", "continue-clip"}
SCRIPT_PATH = Path(__file__).resolve()
from ai_execution_policy import worker_version
SCRIPT_VERSION = worker_version(SCRIPT_PATH)
ORIGINAL_STDOUT = sys.stdout
ORIGINAL_STDERR = sys.stderr


ProgressCallback = Callable[[str, float, str], None]


def ffmpeg_binary_name() -> str:
    return "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg"


def _candidate_ffmpeg_path(path: Path, binary_name: str) -> Path:
    return path / binary_name if path.is_dir() else path


def resolve_ffmpeg_executable() -> tuple[str | None, list[str]]:
    binary_name = ffmpeg_binary_name()
    searched: list[str] = []

    env_path = os.environ.get("OPENSTUDIO_FFMPEG_PATH", "").strip()
    if env_path:
        candidate = _candidate_ffmpeg_path(Path(env_path).expanduser(), binary_name)
        searched.append(str(candidate))
        if candidate.is_file():
            return str(candidate), searched

    path_match = shutil.which("ffmpeg")
    searched.append("PATH:ffmpeg")
    if path_match:
        return path_match, searched

    candidate_dirs = [
        SCRIPT_PATH.parent / "ffmpeg-runtime",
        SCRIPT_PATH.parent.parent,
        SCRIPT_PATH.parent.parent / "tools" / "ffmpeg-runtime",
        Path.cwd(),
        Path.cwd() / "tools" / "ffmpeg-runtime",
    ]
    seen: set[str] = set()
    for directory in candidate_dirs:
        candidate = directory / binary_name
        key = str(candidate.resolve(strict=False))
        if key in seen:
            continue
        seen.add(key)
        searched.append(str(candidate))
        if candidate.is_file():
            return str(candidate), searched

    return None, searched


class GenerationFailure(RuntimeError):
    def __init__(self, message: str, *, progress: float = 0.0, **payload: Any) -> None:
        super().__init__(message)
        self.message = message
        self.progress = progress
        self.payload = payload


class StructuredStderrMirror:
    def __init__(self, downstream: Any) -> None:
        self._downstream = downstream
        self._buffer = ""
        self._lock = threading.Lock()

    def write(self, data: str) -> int:
        written = self._downstream.write(data)
        self._downstream.flush()
        if not data:
            return written

        lines: list[str] = []
        with self._lock:
            self._buffer += data
            while True:
                newline_pos = self._buffer.find("\n")
                carriage_pos = self._buffer.find("\r")
                candidates = [pos for pos in (newline_pos, carriage_pos) if pos >= 0]
                if not candidates:
                    break
                split_pos = min(candidates)
                line = self._buffer[:split_pos].strip()
                self._buffer = self._buffer[split_pos + 1 :]
                if line:
                    lines.append(line)

        for line in lines:
            emit_payload(
                {
                    "event": "stderr",
                    "phase": "stderr",
                    "message": line,
                    "line": line,
                    "pid": os.getpid(),
                }
            )
        return written

    def flush(self) -> None:
        self._downstream.flush()

    def isatty(self) -> bool:
        return bool(getattr(self._downstream, "isatty", lambda: False)())


def install_stream_mirrors() -> None:
    sys.stderr = StructuredStderrMirror(ORIGINAL_STDERR)


def emit_payload(payload: dict[str, Any]) -> None:
    normalized = dict(payload)
    if "progress" in normalized:
        normalized["progress"] = round(float(normalized.get("progress", 0.0)), 4)
    ORIGINAL_STDOUT.write(json.dumps(normalized, ensure_ascii=True) + "\n")
    ORIGINAL_STDOUT.flush()


def emit(state: str, progress: float, **kwargs: Any) -> None:
    payload = {"state": state, "progress": progress}
    payload.update(kwargs)
    emit_payload(payload)


def normalize_text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def normalize_int(value: Any, default: int) -> int:
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def normalize_optional_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        parsed = int(float(value))
    except (TypeError, ValueError):
        return None
    return parsed


def normalize_float(value: Any, default: float) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def format_sample_rate_label(sample_rate: int) -> str:
    if sample_rate % 1000 == 0:
        return f"{sample_rate // 1000} kHz"
    label = f"{sample_rate / 1000.0:.1f}".rstrip("0").rstrip(".")
    return f"{label} kHz"


def normalize_bool(value: Any, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"1", "true", "yes", "on"}:
            return True
        if lowered in {"0", "false", "no", "off"}:
            return False
    if isinstance(value, (int, float)):
        return bool(value)
    return default


def normalize_timesignature(value: Any) -> str:
    text = normalize_text(value, DEFAULT_TIMESIGNATURE)
    if "/" in text:
        return text
    parsed = normalize_int(text, 4)
    return f"{max(1, parsed)}/4"


def normalize_seed(value: Any) -> tuple[int | None, int | None]:
    if value is None or value == "":
        return None, None
    requested = normalize_int(value, -1)
    if requested < 0:
        return requested, None
    return requested, min(requested, (2**31) - 1)


def get_openstudio_log_root() -> Path:
    override = os.environ.get("OPENSTUDIO_AI_TRACE_ROOT", "").strip()
    if override:
        return Path(override).expanduser().resolve()

    if sys.platform == "win32":
        local_app_data = os.environ.get("LOCALAPPDATA", "").strip()
        if local_app_data:
            return Path(local_app_data).expanduser().resolve() / "OpenStudio" / "logs"
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "OpenStudio" / "logs"

    xdg_state_home = os.environ.get("XDG_STATE_HOME", "").strip()
    if xdg_state_home:
        return Path(xdg_state_home).expanduser().resolve() / "OpenStudio" / "logs"
    return Path.home() / ".local" / "state" / "OpenStudio" / "logs"


def get_ai_trace_root() -> Path:
    root = get_openstudio_log_root() / "ai" / "music-generation"
    root.mkdir(parents=True, exist_ok=True)
    return root


def trace_safe_request_id(request_id: str) -> str:
    normalized = normalize_text(request_id, "unknown-request")
    return "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in normalized)[:96]


class AITraceSession:
    def __init__(self, *, request_id: str, workflow: str, session_mode: str, model_id: str) -> None:
        self.request_id = trace_safe_request_id(request_id)
        self.path = get_ai_trace_root() / f"{int(time.time())}_{self.request_id}.jsonl"
        self._lock = threading.Lock()
        self.log_event(
            "session_started",
            workflow=workflow,
            sessionMode=session_mode,
            modelId=model_id,
            scriptVersion=SCRIPT_VERSION,
        )

    def trace_path(self) -> str:
        return str(self.path)

    def log_event(self, event: str, **payload: Any) -> None:
        record = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event": event,
            "requestId": self.request_id,
            **payload,
        }
        try:
            with self._lock:
                with self.path.open("a", encoding="utf-8") as handle:
                    handle.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
        except Exception:
            pass

    def finalize(self) -> None:
        self.log_event("session_finished")


class ProgressReporter:
    def __init__(
        self,
        *,
        model_id: str,
        diffusers_model_id: str,
        cache_root: Path,
        request_id: str,
        session_mode: str,
        trace_path: str = "",
        backend: str = "unknown",
        run_mode: str = "cold",
    ) -> None:
        self.model_id = model_id
        self.diffusers_model_id = diffusers_model_id
        self.cache_root = cache_root
        self.request_id = request_id
        self.session_mode = session_mode
        self.backend = backend
        self.run_mode = run_mode
        self.trace_path = trace_path
        self.started_at = time.monotonic()
        self._lock = threading.Lock()
        self._stop_heartbeat = threading.Event()
        self._heartbeat_thread: threading.Thread | None = None
        self._payload: dict[str, Any] = {
            "state": "idle",
            "progress": 0.0,
            "phase": "idle",
            "message": "",
            "backend": backend,
            "backendFamily": "ace_diffusers",
            "modelId": model_id,
            "musicGenerationModelId": model_id,
            "musicGenerationModelRepoId": diffusers_model_id,
            "musicGenerationCheckpointRoot": str(cache_root),
            "runMode": run_mode,
            "sessionMode": session_mode,
            "runtimeProfile": "ace-diffusers",
            "lmModel": "",
            "protocolVersion": WORKER_PROTOCOL_VERSION,
            "scriptVersion": SCRIPT_VERSION,
            "requestId": request_id,
            "tracePath": trace_path or None,
        }

    def _elapsed_ms(self) -> int:
        return int((time.monotonic() - self.started_at) * 1000)

    def _timestamp_ms(self) -> int:
        return int(time.time() * 1000)

    def _emit_locked(self, *, heartbeat: bool = False) -> None:
        payload = {key: value for key, value in self._payload.items() if value is not None}
        payload["elapsedMs"] = self._elapsed_ms()
        payload["heartbeatTs"] = self._timestamp_ms()
        if heartbeat:
            payload["heartbeat"] = True
        emit_payload(payload)

    def start_heartbeat(self) -> None:
        if self._heartbeat_thread is not None:
            return

        def loop() -> None:
            while not self._stop_heartbeat.wait(HEARTBEAT_INTERVAL_SEC):
                with self._lock:
                    state = str(self._payload.get("state", "idle"))
                    if state not in {"done", "error", "cancelled"}:
                        self._emit_locked(heartbeat=True)

        self._heartbeat_thread = threading.Thread(
            target=loop,
            name="OpenStudioAceDiffusersHeartbeat",
            daemon=True,
        )
        self._heartbeat_thread.start()

    def stop_heartbeat(self) -> None:
        self._stop_heartbeat.set()
        if self._heartbeat_thread is not None:
            self._heartbeat_thread.join(timeout=2.0)
            self._heartbeat_thread = None

    def set_backend(self, backend: str) -> None:
        with self._lock:
            self.backend = backend
            self._payload["backend"] = backend

    def update(self, state: str, progress: float, *, phase: str, message: str, **extra: Any) -> None:
        with self._lock:
            self._payload.update(
                {
                    "state": state,
                    "progress": progress,
                    "phaseProgress": extra.get("phaseProgress", -1),
                    "phase": phase,
                    "message": message,
                    "backend": self.backend,
                    "runMode": self.run_mode,
                    **extra,
                }
            )
            self._emit_locked()

    def progress(self, phase: str, progress: float, message: str) -> None:
        self.update("generating", progress, phase=phase, message=message)

    def fail(self, message: str, *, progress: float = 0.0, **extra: Any) -> None:
        self.update(
            "error",
            progress,
            phase="error",
            message=message,
            error=message,
            **extra,
        )

    def done(self, output_file: str) -> None:
        self.update(
            "done",
            1.0,
            phase="done",
            message="Music generation completed.",
            outputFile=output_file,
        )


@dataclass
class SourceRequest:
    path: Path
    source_duration: float
    extension_duration: float = 0.0


@dataclass
class GenerationSpec:
    workflow: str
    prompt: str
    lyrics: str
    vocal_language: str
    duration: float
    requested_seed: int | None
    seed: int | None
    steps: int
    shift: float
    bpm: int | None
    keyscale: str | None
    timesignature: str | None
    mode: str = "text_to_audio"
    audio_task: str | None = None
    repainting_start: float | None = None
    repainting_end: float | None = None
    audio_cover_strength: float = 1.0
    continuation_tail_duration: float = 0.0
    raga: str | None = None
    sa_hz: float = 240.0
    drone_level: float = 0.20
    mastering_preset: str = "film"


def prepare_source_segment(
    *,
    raw_params: dict[str, Any],
    output_path: Path,
    request_id: str,
) -> SourceRequest:
    source = raw_params.get("source")
    if not isinstance(source, dict):
        raise GenerationFailure("Source-audio workflow requires a source clip payload.")

    source_file = Path(normalize_text(source.get("filePath"))).expanduser()
    if not source_file.exists():
        raise GenerationFailure(f"Source audio file does not exist: {source_file}")

    clip_offset = max(0.0, normalize_float(source.get("clipOffset"), 0.0))
    source_info = sf.info(str(source_file))
    fallback_duration = max(0.01, float(source_info.frames) / max(1, source_info.samplerate) - clip_offset)
    clip_duration = max(0.01, normalize_float(source.get("clipDuration"), fallback_duration))
    start_frame = int(round(clip_offset * source_info.samplerate))
    frame_count = int(round(clip_duration * source_info.samplerate))
    data, samplerate = sf.read(
        str(source_file),
        start=start_frame,
        frames=frame_count,
        always_2d=True,
    )
    if data.size == 0:
        raise GenerationFailure("Source clip segment is empty after applying clip offset and duration.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    segment_path = output_path.parent / f"{trace_safe_request_id(request_id)}_source_segment.wav"
    sf.write(str(segment_path), data, samplerate)
    extension_duration = max(
        0.01,
        normalize_float(raw_params.get("extension_duration", source.get("extensionDuration")), 20.0),
    )
    return SourceRequest(
        path=segment_path,
        source_duration=clip_duration,
        extension_duration=extension_duration,
    )


def build_generation_spec(
    workflow: str,
    raw_params: dict[str, Any],
    *,
    source_request: SourceRequest | None = None,
) -> GenerationSpec:
    prompt = normalize_text(raw_params.get("prompt"))
    if not prompt:
        raise GenerationFailure("ACE-Step generation requires a prompt.", progress=0.05)

    requested_seed, resolved_seed = normalize_seed(raw_params.get("seed"))
    steps_val = raw_params.get("inferenceSteps", raw_params.get("steps"))
    parsed_steps = normalize_int(steps_val, DEFAULT_STEPS) if steps_val is not None else DEFAULT_STEPS
    if parsed_steps == 8:
        parsed_steps = 14
    steps = int(clamp(parsed_steps, 1, 60))
    shift = clamp(normalize_float(raw_params.get("shift"), DEFAULT_SHIFT), 1.0, 10.0)
    duration = clamp(normalize_float(raw_params.get("duration"), DEFAULT_DURATION_SECONDS), 10.0, 600.0)
    bpm = normalize_optional_int(raw_params.get("bpm"))
    if bpm is not None:
        bpm = int(clamp(bpm, 20, 300))

    spec = GenerationSpec(
        workflow=workflow,
        prompt=prompt,
        lyrics=normalize_text(raw_params.get("lyrics")),
        vocal_language=normalize_text(raw_params.get("language", raw_params.get("vocal_language")), DEFAULT_LANGUAGE),
        duration=duration,
        requested_seed=requested_seed,
        seed=resolved_seed,
        steps=steps,
        shift=shift,
        bpm=bpm,
        keyscale=normalize_text(raw_params.get("keyscale")) or None,
        timesignature=normalize_timesignature(raw_params.get("timesignature")) or None,
        raga=str(raw_params.get("raga") or "").replace("Raga ", "").strip() or None,
        sa_hz=normalize_float(raw_params.get("sa_hz"), 240.0),
        drone_level=normalize_float(raw_params.get("drone_level"), 0.20),
        mastering_preset=str(raw_params.get("mastering_preset") or "film"),
    )

    try:
        from nad_ragabridge import condition_generation_spec
        spec = condition_generation_spec(spec)
    except Exception:
        pass

    if workflow == "variation":
        if source_request is None:
            raise GenerationFailure("Variation requires a source clip.")
        spec.mode = "audio_to_audio"
        spec.audio_task = "cover"
        spec.duration = source_request.source_duration
        spec.audio_cover_strength = clamp(
            normalize_float(raw_params.get("audio_cover_strength"), 0.85),
            0.0,
            1.0,
        )
    elif workflow == "inpaint-selection":
        if source_request is None:
            raise GenerationFailure("Inpaint requires a source clip.")
        inpaint_range = {}
        source = raw_params.get("source")
        if isinstance(source, dict) and isinstance(source.get("inpaintRange"), dict):
            inpaint_range = source["inpaintRange"]
        start = normalize_float(
            raw_params.get("repainting_start", raw_params.get("inpaint_start", inpaint_range.get("start"))),
            0.0,
        )
        end = normalize_float(
            raw_params.get("repainting_end", raw_params.get("inpaint_end", inpaint_range.get("end"))),
            source_request.source_duration,
        )
        start = clamp(start, 0.0, source_request.source_duration)
        end = clamp(end, start + 0.01, source_request.source_duration)
        spec.mode = "audio_to_audio"
        spec.audio_task = "repaint"
        spec.duration = source_request.source_duration
        spec.repainting_start = start
        spec.repainting_end = end
    elif workflow == "continue-clip":
        if source_request is None:
            raise GenerationFailure("Continue requires a source clip.")
        extension_duration = max(0.01, source_request.extension_duration)
        spec.mode = "audio_to_audio"
        spec.audio_task = "repaint"
        spec.duration = source_request.source_duration + extension_duration
        spec.repainting_start = source_request.source_duration
        spec.repainting_end = source_request.source_duration + extension_duration
        spec.continuation_tail_duration = extension_duration

    return spec


def convert_to_wav(input_path: Path, output_path: Path, sample_rate: int = DEFAULT_SAMPLE_RATE) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg, searched_locations = resolve_ffmpeg_executable()
    if ffmpeg:
        command = [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(input_path),
            "-ac",
            "2",
            "-ar",
            str(sample_rate),
            "-f",
            "wav",
            str(output_path),
        ]
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        if result.returncode != 0:
            detail = result.stderr.strip() or "FFmpeg failed to convert the source audio."
            raise GenerationFailure(detail, progress=0.22, failureKind="source_audio_conversion_failed")
        return output_path

    data, sr = sf.read(str(input_path), dtype="float32", always_2d=True)
    if sr != sample_rate:
        searched = "\n".join(f"  - {location}" for location in searched_locations)
        raise GenerationFailure(
            "FFmpeg is required to resample source audio for ACE-Step. "
            f"Searched locations:\n{searched}",
            progress=0.22,
            failureKind="source_audio_conversion_failed",
        )
    sf.write(str(output_path), normalize_audio_array(data), sample_rate)
    return output_path


def normalize_audio_array(data: np.ndarray) -> np.ndarray:
    if data.ndim == 1:
        data = np.stack([data, data], axis=-1)
    if data.ndim != 2:
        raise ValueError("Audio must be mono or stereo.")
    if data.shape[1] == 1:
        data = np.repeat(data, 2, axis=1)
    elif data.shape[1] > 2:
        data = data[:, :2]
    return np.clip(data.astype(np.float32, copy=False), -1.0, 1.0)


def load_audio_tensor(path: Path, sample_rate: int = DEFAULT_SAMPLE_RATE):
    import torch

    data, sr = sf.read(str(path), dtype="float32", always_2d=True)
    if sr != sample_rate:
        raise GenerationFailure(f"Expected {sample_rate} Hz source audio, got {sr} Hz.", progress=0.22)
    data = normalize_audio_array(data)
    return torch.from_numpy(data.T.copy()).float()


def pad_audio_tensor(audio_tensor: Any, *, target_duration: float, sample_rate: int):
    target_frames = max(1, int(round(target_duration * sample_rate)))
    current_frames = int(audio_tensor.shape[-1])
    if current_frames >= target_frames:
        return audio_tensor[..., :target_frames]

    import torch

    pad_frames = target_frames - current_frames
    padding = torch.zeros(
        (*audio_tensor.shape[:-1], pad_frames),
        dtype=audio_tensor.dtype,
        device=audio_tensor.device,
    )
    return torch.cat([audio_tensor, padding], dim=-1)


def output_to_soundfile_array(audio: Any) -> np.ndarray:
    if hasattr(audio, "detach"):
        audio = audio.detach().cpu().float().numpy()
    data = np.asarray(audio, dtype=np.float32)
    if data.size == 0 or not np.isfinite(data).all():
        raise GenerationFailure("ACE-Step returned empty or non-finite audio; no clip was published.",
                                failureKind="invalid_audio_output")
    if data.ndim == 3:
        data = data[0]
    if data.ndim == 2 and data.shape[0] <= 8 and data.shape[1] > data.shape[0]:
        data = data.T
    elif data.ndim == 1:
        data = np.stack([data, data], axis=-1)
    return normalize_audio_array(data)


def write_wav(
    audio: Any,
    output_path: Path,
    sample_rate: int = DEFAULT_SAMPLE_RATE,
    spec: GenerationSpec | None = None,
) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    audio_arr = output_to_soundfile_array(audio)
    out_sr = sample_rate
    try:
        from nad_ragabridge import upscale_and_clear_frequencies
        r_name = (spec.raga or "") if spec else ""
        s_hz = float(spec.sa_hz) if spec else 240.0
        d_lvl = float(spec.drone_level) if spec else 0.20
        m_preset = (spec.mastering_preset or "film") if spec else "film"
        audio_arr, out_sr = upscale_and_clear_frequencies(
            audio_arr,
            sample_rate=sample_rate,
            target_sr=96000,
            enable_subsonic_cut=True,
            subsonic_cut_hz=35.0,
            enable_clarity_eq=True,
            enable_harmonic_restoration=True,
            enable_hypersonic=True,
            enable_somatic=True,
            sa_hz=s_hz,
            raga_name=r_name,
            enable_raga_filter=bool(r_name),
            drone_level=d_lvl,
            mastering_preset=m_preset,
        )
    except Exception:
        try:
            from nad_ragabridge import enhance_audio_extended_spectrum
            audio_arr = enhance_audio_extended_spectrum(audio_arr, sample_rate)
        except Exception:
            pass
    sf.write(str(output_path), audio_arr, out_sr, subtype="FLOAT")
    return output_path


def normalize_audio_headroom(data: np.ndarray, *, headroom: float = 0.98) -> np.ndarray:
    if data.size == 0:
        return data
    peak = float(np.max(np.abs(data)))
    if peak > headroom and peak > 1.0e-9:
        data = data * (headroom / peak)
    return np.clip(data, -headroom, headroom)


def read_audio_segment(path: Path) -> tuple[np.ndarray, int]:
    data, samplerate = sf.read(str(path), dtype="float32", always_2d=True)
    return normalize_audio_array(data), samplerate


def mono_mix(data: np.ndarray) -> np.ndarray:
    normalized = normalize_audio_array(data)
    return np.mean(normalized, axis=1, dtype=np.float32)


def detect_first_active_frame(
    data: np.ndarray,
    samplerate: int,
    *,
    threshold_ratio: float = 0.08,
    minimum_threshold: float = 1.0e-5,
) -> int:
    mono = mono_mix(data)
    if mono.size == 0:
        return 0
    peak = float(np.max(np.abs(mono)))
    if peak <= minimum_threshold:
        return 0

    threshold = max(minimum_threshold, peak * threshold_ratio)
    frame_size = max(1, int(round(samplerate * 0.02)))
    hop_size = max(1, int(round(samplerate * 0.005)))
    last_start = max(0, mono.size - frame_size)
    for start in range(0, last_start + 1, hop_size):
        frame = mono[start : start + frame_size]
        if frame.size == 0:
            continue
        rms = float(np.sqrt(np.mean(np.square(frame, dtype=np.float64))))
        if rms >= threshold:
            active_indices = np.flatnonzero(np.abs(frame) >= threshold)
            if active_indices.size > 0:
                return start + int(active_indices[0])
            return start
    return 0


def active_rms(data: np.ndarray) -> float:
    mono = mono_mix(data)
    if mono.size == 0:
        return 0.0
    peak = float(np.max(np.abs(mono)))
    if peak <= 1.0e-9:
        return 0.0
    threshold = max(1.0e-5, peak * 0.05)
    active = np.abs(mono) >= threshold
    if int(np.count_nonzero(active)) < max(1, mono.size // 200):
        active = np.abs(mono) > 1.0e-7
    if not np.any(active):
        return 0.0
    return float(np.sqrt(np.mean(np.square(mono[active], dtype=np.float64))))


def fit_audio_length(data: np.ndarray, target_frames: int) -> np.ndarray:
    target = max(1, int(target_frames))
    if data.shape[0] == target:
        return data
    if data.shape[0] > target:
        return data[:target]
    pad = np.zeros((target - data.shape[0], data.shape[1]), dtype=data.dtype)
    return np.vstack([data, pad])


def align_generated_onset_to_source(
    generated: np.ndarray,
    source: np.ndarray,
    samplerate: int,
    *,
    tolerance_seconds: float = 0.02,
) -> np.ndarray:
    target_frames = generated.shape[0]
    source_onset = detect_first_active_frame(source, samplerate)
    generated_onset = detect_first_active_frame(generated, samplerate)
    delta = int(source_onset - generated_onset)
    tolerance_frames = int(round(tolerance_seconds * samplerate))
    if abs(delta) <= tolerance_frames:
        return generated
    if delta > 0:
        pad = np.zeros((delta, generated.shape[1]), dtype=generated.dtype)
        return fit_audio_length(np.vstack([pad, generated]), target_frames)
    return fit_audio_length(generated[-delta:], target_frames)


def match_generated_loudness_to_source(
    generated: np.ndarray,
    source: np.ndarray,
    *,
    headroom: float = 10.0 ** (-1.0 / 20.0),
    max_upward_gain: float = 1.25,
) -> np.ndarray:
    source_level = active_rms(source)
    generated_level = active_rms(generated)
    if source_level <= 1.0e-9 or generated_level <= 1.0e-9:
        return normalize_audio_headroom(generated, headroom=headroom)

    gain = source_level / generated_level
    gain = min(gain, max_upward_gain)
    peak = float(np.max(np.abs(generated)))
    if peak > 1.0e-9:
        gain = min(gain, headroom / peak)
    return normalize_audio_headroom(generated * gain, headroom=headroom)


def postprocess_variation_audio(
    generated: np.ndarray,
    source_path: Path,
    *,
    target_duration: float,
    samplerate: int,
) -> np.ndarray:
    source, source_samplerate = read_audio_segment(source_path)
    if source_samplerate != samplerate:
        converted_path = source_path.with_name(source_path.stem + "_postprocess_48k.wav")
        convert_to_wav(source_path, converted_path, samplerate)
        source, _source_samplerate = read_audio_segment(converted_path)

    target_frames = max(1, int(round(target_duration * samplerate)))
    generated = fit_audio_length(normalize_audio_array(generated), target_frames)
    source = fit_audio_length(source, target_frames)
    generated = align_generated_onset_to_source(generated, source, samplerate)
    return match_generated_loudness_to_source(generated, source)


def crop_continuation_tail(
    *,
    generated_path: Path,
    output_path: Path,
    source_duration: float,
    extension_duration: float,
) -> None:
    info = sf.info(str(generated_path))
    start_frame = max(0, int(round(source_duration * info.samplerate)))
    frame_count = max(1, int(round(extension_duration * info.samplerate)))
    data, samplerate = sf.read(
        str(generated_path),
        start=start_frame,
        frames=frame_count,
        always_2d=True,
    )
    if data.size == 0:
        raise GenerationFailure(
            "ACE-Step continuation completed, but no generated tail was available to import.",
            progress=0.97,
        )
    sf.write(str(output_path), normalize_audio_headroom(data), samplerate)


def build_diffusers_kwargs(
    spec: GenerationSpec,
    *,
    generator: Any = None,
    src_audio: Any = None,
    reference_audio: Any = None,
    source_duration: float | None = None,
) -> dict[str, Any]:
    audio_duration = spec.duration
    if spec.audio_task == "repaint" and source_duration and spec.workflow != "continue-clip":
        audio_duration = source_duration

    kwargs: dict[str, Any] = {
        "prompt": spec.prompt.strip(),
        "lyrics": spec.lyrics or "",
        "audio_duration": float(audio_duration),
        "vocal_language": spec.vocal_language.strip() or DEFAULT_LANGUAGE,
        "num_inference_steps": spec.steps,
        "guidance_scale": 1.0,
        "shift": spec.shift,
        "generator": generator,
        "output_type": "pt",
        "return_dict": True,
        "task_type": "text2music",
    }
    if spec.bpm is not None:
        kwargs["bpm"] = spec.bpm
    if spec.keyscale:
        kwargs["keyscale"] = spec.keyscale
    if spec.timesignature:
        kwargs["timesignature"] = spec.timesignature

    if spec.mode == "audio_to_audio" and spec.audio_task == "repaint":
        kwargs.update(
            {
                "task_type": "repaint",
                "src_audio": src_audio,
                "reference_audio": reference_audio,
                "repainting_start": spec.repainting_start,
                "repainting_end": spec.repainting_end,
            }
        )
    elif spec.mode == "audio_to_audio" and spec.audio_task == "cover":
        kwargs.update(
            {
                "task_type": "cover",
                "reference_audio": reference_audio,
                "audio_cover_strength": spec.audio_cover_strength,
            }
        )
        if src_audio is not None:
            kwargs["src_audio"] = src_audio
    return kwargs


class DiffusersAcePipelineManager:
    def __init__(self, *, model_id: str, cache_root: Path, enable_group_offload: bool,
                 requested_device: str | None = None, attention: str = "native", quantization: str = "none",
                 placement: str = "auto") -> None:
        self.model_id = model_id
        self.cache_root = cache_root
        self.enable_group_offload = enable_group_offload
        self.pipe = None
        self.sample_rate = DEFAULT_SAMPLE_RATE
        self.backend = "unknown"
        self.requested_device = requested_device
        self.attention = attention
        self.quantization = quantization
        if placement not in {"auto", "resident", "model-offload", "group-offload"}:
            raise ValueError(f"Unsupported ACE-Step placement: {placement}")
        self.placement = placement
        if quantization != "none" and placement != "resident":
            raise ValueError("Quantization evaluation requires explicit resident placement; offload combinations are unqualified.")
        self.device = "cuda"
        self.attention_details = {}
        self._load_lock = threading.Lock()
        self._placement = None
        self.conservative = False
        self.execution_details = {}
        self._streaming = False
        self._low_cpu_memory = False

    def load(self, reporter: ProgressReporter | None = None):
        if self.pipe is not None:
            return self.pipe

        with self._load_lock:
            if self.pipe is not None:
                return self.pipe

            if reporter:
                reporter.update("loading", 0.05, phase="loading_model", message="Checking available compute devices.")
            import torch
            from ai_execution_policy import select_device, activate_device
            selected = select_device(torch, self.requested_device)
            activate_device(torch, selected)
            self.device = selected.device
            self.physical_device = selected.name
            self.backend = selected.family
            if reporter:
                reporter.set_backend(self.backend)
                reporter.update("loading", 0.08, phase="loading_model", message="Loading ACE-Step Diffusers pipeline.")

            self.cache_root.mkdir(parents=True, exist_ok=True)
            os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

            from diffusers import AceStepPipeline
            from ai_execution_policy import quantization_kwargs
            from ai_model_variants import MARKER, validate_variant, require_int8_device
            saved_int8 = (Path(self.model_id) / MARKER).is_file()
            if saved_int8:
                validate_variant(Path(self.model_id), DEFAULT_UI_MODEL_ID)
                require_int8_device(torch)
                self.quantization, self.placement = "int8", "resident"
            dtype = torch.bfloat16 if ((self.device.startswith("cuda") and torch.cuda.is_bf16_supported()) or self.device.startswith("mps")) else torch.float32
            local_snapshot = Path(self.model_id) if Path(self.model_id).is_dir() else resolve_music_gen_snapshot(self.cache_root, self.model_id)
            if local_snapshot is None:
                raise ValueError("ACE-Step model files are missing or incomplete. Run Audio Generation setup.")
            if dtype == torch.float32:
                from ai_execution_policy import check_host_capacity
                check_host_capacity(local_snapshot, float_bytes=4)
            pipe = AceStepPipeline.from_pretrained(
                str(local_snapshot),
                torch_dtype=dtype,
                cache_dir=str(self.cache_root),
                local_files_only=True,
                **({} if saved_int8 else quantization_kwargs(self.quantization, modular=False)),
            )

            if reporter:
                reporter.update("loading", 0.14, phase="loading_model", message="Optimizing ACE-Step VAE for high-fidelity audio.")
            # Audio VAEs operate along a 1D temporal dimension. Enabling VAE tiling causes
            # boundary crossfade smearing and severe phase cancellation ("mushy" audio).
            # We explicitly disable tiling and promote the VAE to float32 on MPS for pristine clarity.
            if hasattr(pipe, "disable_vae_tiling"):
                pipe.disable_vae_tiling()
            elif hasattr(pipe, "vae") and hasattr(pipe.vae, "disable_tiling"):
                pipe.vae.disable_tiling()
            if hasattr(pipe, "vae") and pipe.vae is not None:
                if self.device.startswith("mps"):
                    pipe.vae.to(dtype=torch.float32)
                orig_decode = pipe.vae.decode
                def _safe_vae_decode(z, *args, **kwargs):
                    target_dtype = getattr(pipe.vae, "dtype", torch.float32)
                    if hasattr(z, "dtype") and z.dtype != target_dtype:
                        z = z.to(dtype=target_dtype)
                    return orig_decode(z, *args, **kwargs)
                pipe.vae.decode = _safe_vae_decode

            self.pipe = pipe
            from ai_attention_policy import configure_attention
            self.attention_details = configure_attention(pipe.components, self.backend, self.attention)
            self.sample_rate = int(getattr(pipe, "sample_rate", DEFAULT_SAMPLE_RATE))
            if reporter:
                reporter.update("loading", 0.24, phase="loading_model", message="ACE-Step Diffusers pipeline is ready.")
            return pipe

    def configure_memory(self, duration: float, reporter) -> None:
        from diffusers_audio_pipeline import plan_audio_memory, module_weight_bytes, available_host_memory, GIB
        import torch
        from ai_execution_policy import device_budget
        components = list(self.pipe.components.values())
        weights = module_weight_bytes(components)
        largest = max((module_weight_bytes([component]) for component in components), default=0)
        device = getattr(self, "device", "cuda")
        accelerated = device.split(":")[0] in {"cuda", "xpu", "mps"}
        budget = device_budget(torch, device, include_allocated=True)
        mode = (plan_audio_memory(budget, weights, largest, duration, self.conservative)
                if accelerated else "resident")
        if not self.enable_group_offload and not self.conservative:
            mode = "resident"
        if self.placement != "auto" and not self.conservative:
            if not accelerated and self.placement != "resident":
                raise ValueError(f"ACE-Step {device} currently supports resident placement only.")
            mode = self.placement
        free, ram = budget, available_host_memory()
        stream = (mode == "group-offload" and not self.conservative
                  and free is not None and free >= 8 * GIB and ram is not None and ram >= 3 * GIB)
        # Full-model pre-pinning can exhaust host RAM under WDDM even when
        # parameter bytes appear to fit: driver/staging storage also consumes
        # the host budget. Keep pinning bounded to each on-demand transfer.
        low_cpu_memory = stream
        if self._placement is not None and (mode != self._placement
                or stream != self._streaming or low_cpu_memory != self._low_cpu_memory):
            del components
            self.unload()
            self.load(reporter)
        if mode != self._placement:
            self.pipe.remove_all_hooks()
            self.pipe.to("cpu")
            if mode == "resident":
                self.pipe.to(device)
            elif mode == "model-offload":
                self.pipe.enable_model_cpu_offload(device=device)
            else:
                # ACE reads condition tensors outside forward(); keep those
                # resident and group-offload only the transformer.
                self.pipe.transformer.enable_group_offload(
                    onload_device=torch.device(device), offload_device=torch.device("cpu"),
                    offload_type="leaf_level", use_stream=stream,
                    low_cpu_mem_usage=low_cpu_memory)
                for name, component in self.pipe.components.items():
                    if name != "transformer" and hasattr(component, "to"):
                        component.to(device)
            if device.startswith("mps") and hasattr(self.pipe, "vae") and self.pipe.vae is not None:
                self.pipe.vae.to(dtype=torch.float32)
            self._placement = mode
            self._streaming, self._low_cpu_memory = stream, low_cpu_memory
        physical = getattr(self, "physical_device", self.backend)
        self.execution_details = {"physicalDevice": physical, "executionDevice": device,
            "device": self.backend, "offload": mode, "weightsBytes": weights,
            "precision": str(self.pipe.transformer.dtype), "attentionPolicy": "automatic SDPA",
            "streaming": stream, "lowCpuMemory": low_cpu_memory,
            "attention": self.attention_details, "quantization": self.quantization,
            "modelVariant": "int8" if self.quantization == "int8" else "original"}
        from ai_execution_policy import model_execution_capabilities
        self.execution_details["capabilities"] = model_execution_capabilities("ace-step-v15-xl-turbo", self.backend)
        precision_note = " / INT8 diffusion transformer" if self.quantization == "int8" else ""
        reporter.update("generating", 0, phase="preparing_audio", phaseProgress=-1,
            message="Preparing ACE-Step audio.",
            statusNote=f"{physical} · {self.pipe.transformer.dtype} · {mode} · {self.attention} attention",
            generationDetails={"execution": self.execution_details})

    def unload(self):
        import gc
        self.pipe = None
        self._placement = None
        gc.collect()
        if "torch" in sys.modules:
            from ai_execution_policy import accelerator_api
            kind = self.device.split(":")[0]
            api = accelerator_api(sys.modules["torch"], self.device)
            if kind in {"cuda", "xpu", "mps"}:
                api.empty_cache()

    def generate(
        self,
        *,
        spec: GenerationSpec,
        source_request: SourceRequest | None,
        output_path: Path,
        reporter: ProgressReporter,
    ) -> Path:
        self.load(reporter)
        self.configure_memory(spec.duration, reporter)
        pipe = self.pipe
        sample_rate = int(getattr(pipe, "sample_rate", self.sample_rate))
        source_duration: float | None = None
        src_audio = None
        reference_audio = None
        source_structure_conditioning: bool | None = None
        source_pattern_warning = ""

        if spec.mode == "audio_to_audio":
            if source_request is None:
                raise GenerationFailure("ACE-Step source workflow requires source audio.", progress=0.2)
            reporter.update(
                "generating",
                0.22,
                phase="preprocessing_audio",
                message=f"Converting source audio to {format_sample_rate_label(sample_rate)} stereo.",
            )
            wav_path = output_path.parent / f"{trace_safe_request_id(reporter.request_id)}_{sample_rate}hz_stereo.wav"
            convert_to_wav(source_request.path, wav_path, sample_rate)
            audio_tensor = load_audio_tensor(wav_path, sample_rate)
            source_audio_tensor = audio_tensor
            if spec.workflow == "continue-clip":
                audio_tensor = pad_audio_tensor(
                    audio_tensor,
                    target_duration=spec.duration,
                    sample_rate=sample_rate,
                )
            source_duration = float(audio_tensor.shape[-1]) / sample_rate

            if spec.audio_task == "repaint":
                if spec.repainting_start is None or spec.repainting_end is None:
                    raise GenerationFailure("Repaint start and end are required.", progress=0.22)
                if spec.repainting_end > source_duration + 0.001:
                    raise GenerationFailure(
                        f"Repaint end ({spec.repainting_end:.2f}s) exceeds source duration ({source_duration:.2f}s).",
                        progress=0.22,
                    )
                src_audio = audio_tensor
                reference_audio = source_audio_tensor
            elif spec.audio_task == "cover":
                reference_audio = source_audio_tensor
                if self._supports_source_audio_cover(pipe):
                    src_audio = source_audio_tensor
                    source_structure_conditioning = True
                else:
                    source_structure_conditioning = False
                    source_pattern_warning = (
                        "ACE-Step Diffusers source-audio cover conditioning is unavailable because this runtime "
                        "does not include audio tokenizer/detokenizer weights. The generated clip will be loudness- "
                        "and onset-aligned, but source-pattern preservation is diagnostic_only."
                    )

        generator = self._generator(spec.seed)
        kwargs = build_diffusers_kwargs(
            spec,
            generator=generator,
            src_audio=src_audio,
            reference_audio=reference_audio,
            source_duration=source_duration,
        )
        kwargs["callback_on_step_end"] = self._step_callback(spec.steps, reporter)
        kwargs["callback_on_step_end_tensor_inputs"] = ["latents"]

        reporter.update(
            "generating",
            0.28,
            phase="denoising",
            message=f"Starting ACE-Step denoising with {spec.steps} step(s).",
            requestedSeed=spec.requested_seed,
            resolvedSeed=spec.seed,
            backendFamily="ace_diffusers",
            diffusersRequestSummary=summarize_diffusers_kwargs(kwargs),
            sourceStructureConditioning=source_structure_conditioning,
            sourcePatternWarning=source_pattern_warning or None,
        )

        import torch

        from diffusers_audio_pipeline import memory_snapshot, observe_generation
        # Preserve random state even for the random-seed UI option on recovery.
        if kwargs["generator"] is None:
            from ai_execution_policy import generator_device
            kwargs["generator"] = torch.Generator(device=generator_device(self.device))
            kwargs["generator"].seed()
        initial_rng = kwargs["generator"].get_state()
        from ai_execution_policy import accelerator_api
        device_api = accelerator_api(torch, self.device)
        if self.device.split(":")[0] in {"cuda", "xpu"}:
            device_api.reset_peak_memory_stats()
        for attempt in range(2):
            try:
                def phase_update(phase, message, fraction):
                    reporter.update("generating", max(0, fraction), phase=phase,
                                    message=message, phaseProgress=fraction)
                with observe_generation(pipe, "ace-step", spec.duration, spec.steps, phase_update) as (_, timings):
                    with torch.inference_mode():
                        result = pipe(**kwargs)
                break
            except torch.OutOfMemoryError as exc:
                if attempt or self.conservative or self.quantization != "none":
                    raise GenerationFailure("Not enough memory for ACE-Step after reduced-memory retry.", failureKind="out_of_memory") from exc
                exc.__traceback__ = None
                pipe = None
                self.unload()
                self.conservative = True
                reporter.update("loading", 0, phase="loading_model", phaseProgress=-1,
                                message="Reloading ACE-Step with reduced-memory offloading.")
                pipe = self.load(reporter)
                self.configure_memory(spec.duration, reporter)
                kwargs["generator"].set_state(initial_rng)
        self.execution_details.update(memory_snapshot(self.device))
        self.execution_details["phaseSeconds"] = timings


        reporter.update("generating", 0.94, phase="saving", phaseProgress=-1, message="Saving generated WAV.", generationDetails={"execution": self.execution_details})
        if spec.workflow == "continue-clip":
            full_output_path = output_path.parent / f"{trace_safe_request_id(reporter.request_id)}_full.wav"
            write_wav(result.audios, full_output_path, sample_rate, spec=spec)
            crop_continuation_tail(
                generated_path=full_output_path,
                output_path=output_path,
                source_duration=source_request.source_duration if source_request else 0.0,
                extension_duration=spec.continuation_tail_duration,
            )
        elif spec.workflow == "variation" and source_request is not None:
            generated = output_to_soundfile_array(result.audios)
            processed = postprocess_variation_audio(
                generated,
                source_request.path,
                target_duration=source_request.source_duration,
                samplerate=sample_rate,
            )
            write_wav(processed, output_path, sample_rate, spec=spec)
        else:
            write_wav(result.audios, output_path, sample_rate, spec=spec)
        return output_path

    def _generator(self, seed: int | None):
        if seed is None:
            return None
        import torch

        from ai_execution_policy import generator_device
        return torch.Generator(device=generator_device(self.device)).manual_seed(seed)

    @staticmethod
    def _supports_source_audio_cover(pipe: Any) -> bool:
        return (
            getattr(pipe, "audio_tokenizer", None) is not None
            and getattr(pipe, "audio_token_detokenizer", None) is not None
        )

    @staticmethod
    def _step_callback(total_steps: int, reporter: ProgressReporter):
        total = max(1, int(total_steps))

        def callback(_pipe: Any, step_index: int, _timestep: Any, callback_kwargs: dict[str, Any]) -> dict[str, Any]:
            done = min(total, int(step_index) + 1)
            fraction = 0.3 + (done / total) * 0.6
            reporter.update(
                "generating",
                fraction,
                phase="denoising",
                message=f"Denoising step {done}/{total}.",
                phaseProgress=done / total,
            )
            return callback_kwargs

        return callback


def summarize_diffusers_kwargs(kwargs: dict[str, Any]) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for key, value in kwargs.items():
        if key.startswith("callback"):
            continue
        if key in {"src_audio", "reference_audio"} and value is not None:
            summary[key] = {
                "type": type(value).__name__,
                "shape": list(getattr(value, "shape", [])),
                "dtype": str(getattr(value, "dtype", "")),
            }
        elif key == "generator":
            summary[key] = value is not None
        else:
            summary[key] = value
    return summary


class WorkerSession:
    def __init__(self, *, ui_model_id: str, diffusers_model_id: str, cache_root: Path, enable_group_offload: bool) -> None:
        self.ui_model_id = ui_model_id
        self.diffusers_model_id = diffusers_model_id
        self.cache_root = cache_root
        self.manager = DiffusersAcePipelineManager(
            model_id=diffusers_model_id,
            cache_root=cache_root,
            enable_group_offload=enable_group_offload,
        )
        self._busy = False

    def _generate_via_audiocpp(
        self,
        *,
        target_model: str,
        raw_params: dict[str, Any],
        output_path: Path,
        reporter: ProgressReporter,
        trace_session: AITraceSession,
    ) -> bool:
        model_family_map = {
            "yue2": ("yue2", Path("/Users/mrigank/.nad/models/yue2")),
            "yue-2": ("yue2", Path("/Users/mrigank/.nad/models/yue2")),
            "yue-2-3b": ("yue2", Path("/Users/mrigank/.nad/models/yue2")),
            "yeu2": ("yue2", Path("/Users/mrigank/.nad/models/yue2")),
            "yeu 2": ("yue2", Path("/Users/mrigank/.nad/models/yue2")),
            "minimax_music3": ("minimax_music3", Path("/Users/mrigank/.nad/models/minimax3")),
            "minimax3": ("minimax_music3", Path("/Users/mrigank/.nad/models/minimax3")),
            "minimax-music-3": ("minimax_music3", Path("/Users/mrigank/.nad/models/minimax3")),
            "music 3": ("minimax_music3", Path("/Users/mrigank/.nad/models/minimax3")),
            "stable_audio": ("stable_audio", Path("/Users/mrigank/.nad/models/stable-audio-3")),
            "stable_audio3": ("stable_audio", Path("/Users/mrigank/.nad/models/stable-audio-3")),
            "stable-audio-3": ("stable_audio", Path("/Users/mrigank/.nad/models/stable-audio-3")),
            "stable-audio-3-medium": ("stable_audio", Path("/Users/mrigank/.nad/models/stable-audio-3")),
            "ace_step": ("ace_step", Path("/Users/mrigank/.nad/models/ace-step")),
            "ace_step_xl_turbo": ("ace_step", Path("/Users/mrigank/.nad/models/ace-step")),
            "ace-step-v15-xl-turbo": ("ace_step", Path("/Users/mrigank/.nad/models/ace-step")),
            "ace-step": ("ace_step", Path("/Users/mrigank/.nad/models/ace-step")),
        }
        family, model_dir = model_family_map.get(target_model, ("yue2", Path("/Users/mrigank/.nad/models/yue2")))
        cli_path = Path("/Users/mrigank/.nad/bin/audiocpp_cli")
        spec_dir = Path("/Users/mrigank/.nad/model_specs")
        if not cli_path.exists():
            raise GenerationFailure(f"audiocpp_cli binary not found at {cli_path}")

        prompt = str(raw_params.get("prompt") or "").strip()
        lyrics = str(raw_params.get("lyrics") or "").strip()
        if not lyrics:
            lyrics = "[Instrumental]"
        duration = float(raw_params.get("duration") or 30.0)
        
        # Ensure fresh cryptographically randomized seed on every generation unless explicit
        seed = int(raw_params.get("seed") or 0)
        if seed <= 0:
            import random
            seed = random.randint(1, 2147483647)
        temp_out = output_path.parent / f"audiocpp_raw_{uuid.uuid4().hex[:8]}.wav"

        # Detect primary instrument, Indian classical context & physical acoustic timbres
        INSTRUMENT_TIMBRES = {
            "sitar": "buzzing jawari bridge, steel and bronze sympathetic strings, heavy meend microtonal pitch bends, sparkling chikari drone strokes",
            "bansuri": "transverse bamboo flute, breathy airy embouchure, warm woody resonance, vocal microtonal meend, pure acoustic overtones",
            "sarod": "fretless steel fingerboard, coconut shell plectrum (java), punchy metallic staccato attack, rapid taans, deep sympathetic resonance",
            "shehnai": "piercing double-reed acoustic horn, bright festive nasal timbre, celebratory auspicious microtonal trills",
            "sarangi": "bowed gut strings, hollow box resonator, singing human-voice expressive weeping microtones, 35 sympathetic steel strings",
            "santoor": "hammered trapezoidal dulcimer, walnut wood mallet strikes, shimmering metallic cascade, crystalline acoustic chime",
            "rudra veena": "ancient tubular stick zither, twin large dried gourd resonators, deep rumbling bass resonance, slow majestic alap strokes",
            "saraswati veena": "fretted lute, jackwood acoustic bowl, rich sustained overtone resonance, fluid gamakas",
            "surbahar": "bass sitar, massive deep jawari buzzing rumble, profound low-octave meditative meend glides",
            "harmonium": "hand-pumped reed organ, rich warm acoustic drone, steady continuous melodic sustain",
            "dilruba": "bowed fretted neck, singing resonant skin belly, delicate romantic ornaments",
            "esraj": "bowed skin-soundboard lute, warm lyrical bowed timbre, rich sympathetic shimmer",
            "flute": "warm acoustic woodwind, soft breathy attack, lyrical phrasing",
            "violin": "fretless acoustic violin, south-indian gamaka slides, singing microtones",
            "tabla": "pitched dayun hand drum with black syahi spot, resonant wooden rim, deep bass bayan pressure modulation, crisp rhythmic tihais",
            "pakhawaj": "ancient two-headed barrel drum, deep booming bass wheat-paste resonance, forceful solemn bol strokes",
            "mridangam": "carnatic barrel drum, bright metallic capapu rim timbre, deep booming resonant bass thombai"
        }

        explicit_lead = str(raw_params.get("lead_instrument") or "").strip().lower()
        prompt_lower = prompt.lower()
        if explicit_lead and explicit_lead in INSTRUMENT_TIMBRES:
            lead_inst = explicit_lead
        else:
            lead_inst = "sitar"
            for k in INSTRUMENT_TIMBRES:
                if k in prompt_lower:
                    lead_inst = k
                    break
        lead_timbre = INSTRUMENT_TIMBRES.get(lead_inst, "authentic acoustic resonance")

        raga_name = str(raw_params.get("raga") or "Bhairav").replace("Raga ", "").strip()
        sa_pitch = str(raw_params.get("sa_pitch") or "C#4").strip()
        is_instrumental = "pure acoustic instrumental" in prompt_lower or "no vocals" in prompt_lower

        # Resolve Western modal equivalent from RAGA_DATABASE
        western_mode = str(raw_params.get("western_mode") or "").strip()
        if not western_mode:
            try:
                from nad_ragabridge import RAGA_DATABASE
                for k, v in RAGA_DATABASE.items():
                    if k in raga_name.lower():
                        western_mode = v.get("western_mode", "")
                        break
            except Exception:
                pass
        if not western_mode:
            western_mode = "Modal Scale"
        keyscale = f"{sa_pitch} {western_mode}"

        cmd = [
            str(cli_path),
            "--task", "gen",
            "--family", family,
            "--model", str(model_dir),
            "--model-spec-override", str(spec_dir),
            "--backend", "best",
            "--out", str(temp_out),
            "--seed", str(seed),
            "--log",
        ]

        # Navarasa emotional archetypes: dynamics, tempo, attack and emotional character
        NAVARASA_ARCHETYPES = {
            "raudra": {
                "style": "ferocious, intense, aggressive, frantic, dramatic tension, explosive climax, forte dynamics",
                "tempo_tag": "fast driving tempo",
                "bpm": 138,
                "rhythm": "aggressive staccato rhythmic attack, fiery rapid taans, thundering tihais"
            },
            "karuna": {
                "style": "deeply sorrowful, mournful, heartfelt pathos, poignant weeping microtones, delicate pianissimo",
                "tempo_tag": "slow mournful tempo",
                "bpm": 62,
                "rhythm": "slow lingering meend glides, expressive pauses, tender weeping phrasing"
            },
            "veera": {
                "style": "majestic heroic grandeur, bold commanding strokes, royal sovereign presence, victorious crescendo",
                "tempo_tag": "driving tempo",
                "bpm": 126,
                "rhythm": "bold authoritative strokes, rhythmic power, triumphant leaps"
            },
            "shringara": {
                "style": "tender romantic warmth, lyrical grace, delicate ornaments, sweet meend, sensuous beauty",
                "tempo_tag": "medium tempo",
                "bpm": 88,
                "rhythm": "gentle flowing murki flourishes, sweet lyrical phrasing, soft playful dynamics"
            },
            "hasya": {
                "style": "playful, joyous, cheerful dancing rhythm, bright agile tihais, festive bounce, whimsical agility",
                "tempo_tag": "upbeat lively tempo",
                "bpm": 118,
                "rhythm": "syncopated skipping rhythm, light staccato flourishes, joyous dancing tihais"
            },
            "shanta": {
                "style": "tranquil, deeply peaceful, serene stillness, meditative calm, spacious contemplation, motionless silence",
                "tempo_tag": "very slow meditative tempo",
                "bpm": 52,
                "rhythm": "unbroken sustained drone, spacious contemplative pauses, deep meditative breaths"
            },
            "adbhuta": {
                "style": "mystical awe, celestial wonder, magical shimmering overtones, soaring melodies, ethereal shimmer",
                "tempo_tag": "floating fluid tempo",
                "bpm": 74,
                "rhythm": "fluid cascading arpeggios, shimmering harmonics, floating rubato pulse"
            },
            "bhayanaka": {
                "style": "haunting dark mystery, suspenseful tension, eerie low bass drones, ominous foreboding shadows",
                "tempo_tag": "slow suspenseful tempo",
                "bpm": 58,
                "rhythm": "dark low-register sustained notes, sudden startling accents, eerie lingering dissonance"
            },
            "bibhatsa": {
                "style": "raw abrasive friction, harsh metallic overtones, stark dissonant clashes, unconventional angularity",
                "tempo_tag": "angular tempo",
                "bpm": 104,
                "rhythm": "jarring angular rhythms, abrupt percussive stops, harsh scraping attacks"
            }
        }

        raw_rasa = str(raw_params.get("rasa") or "").strip().lower()
        matched_rasa = "shanta"
        for r_key in NAVARASA_ARCHETYPES:
            if r_key in raw_rasa or r_key in prompt_lower:
                matched_rasa = r_key
                break
        rasa_info = NAVARASA_ARCHETYPES[matched_rasa]
        bpm = int(raw_params.get("bpm") or rasa_info["bpm"])

        # Accompaniment assembly
        accomp_parts = []
        drone_lvl = float(raw_params.get("drone_level") or 0.20)
        if drone_lvl > 0.05 or "tanpura" in prompt_lower or "drone" in prompt_lower:
            accomp_parts.append("resonant acoustic tanpura drone")
        secondary = raw_params.get("secondary_instruments")
        if isinstance(secondary, list) and secondary:
            accomp_parts.append(f"accompaniment with {', '.join(secondary)}")
        elif any(r in prompt_lower for r in ["tabla", "pakhawaj", "mridangam"]):
            rhythm_name = "tabla rhythm" if "tabla" in prompt_lower else ("pakhawaj" if "pakhawaj" in prompt_lower else "mridangam")
            accomp_parts.append(f"acoustic {rhythm_name}")
        accomp_str = f", accompanied by {', '.join(accomp_parts)}" if accomp_parts else ""

        if family == "yue2":
            tag_parts = [
                f"solo {lead_inst}",
                lead_timbre,
                "indian classical",
                f"raga {raga_name.lower()}",
                f"{western_mode.lower()} scale",
                rasa_info["style"],
                rasa_info["tempo_tag"],
                f"{bpm} bpm"
            ]
            if accomp_parts:
                tag_parts.extend(accomp_parts)
            tag_parts.append("acoustic instrumental" if is_instrumental else "classical vocalise")
            yue_style = ", ".join(tag_parts)

            cmd.extend([
                "--request-option", f"style={yue_style}",
                "--lyrics", lyrics,
                "--target-duration-seconds", str(duration),
            ])
        elif family == "minimax_music3":
            mm_prompt = f"[Indian Classical | {keyscale} scale | {bpm} BPM | Solo {lead_inst.title()} | {matched_rasa.title()}: {rasa_info['style']}]{accomp_str}"
            cmd.extend([
                "--text", mm_prompt,
                "--lyrics", lyrics,
                "--request-option", f"duration_sec={duration}",
                "--request-option", "num_inference_steps=8",
                "--request-option", "flow_uncond_interval=2",
                "--request-option", "flow_chunk_hop_frames=150",
            ])
        elif family == "stable_audio":
            sa_prompt = f"Studio master recording of solo {lead_inst} ({lead_timbre}), Indian Classical {raga_name}, {keyscale} scale, {rasa_info['style']}, {bpm} BPM{accomp_str}"
            cmd.extend([
                "--text", sa_prompt,
                "--target-duration-seconds", str(duration),
            ])
        elif family == "ace_step":
            ace_prompt = f"Indian Classical {raga_name}, solo {lead_inst} ({lead_timbre}), {rasa_info['style']}, {rasa_info['rhythm']}, {keyscale} scale, {bpm} BPM{accomp_str}"
            cmd.extend([
                "--text", ace_prompt,
                "--duration-seconds", str(duration),
                "--request-option", f"keyscale={keyscale}",
                "--request-option", f"bpm={bpm}",
            ])

        reporter.update(
            "generating",
            0.08,
            phase="loading_weights",
            message=f"Loading {family} GGUF weights into Apple Metal unified memory...",
            phaseProgress=0.08,
        )

        trace_session.log_event("audiocpp_launch", command=cmd, family=family)
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        start_time = time.monotonic()
        estimated_duration = max(10.0, duration * 0.8)
        for line in iter(proc.stdout.readline, ""):
            line_str = line.strip()
            if not line_str:
                continue
            elapsed = time.monotonic() - start_time
            sim_progress = min(0.85, 0.12 + (elapsed / estimated_duration) * 0.72)
            if "ar.generate" in line_str or "flow.sampling" in line_str or "denoising" in line_str:
                reporter.update(
                    "generating",
                    sim_progress,
                    phase="denoising",
                    message=f"Synthesizing {family} audio tokens on Metal...",
                    phaseProgress=sim_progress,
                )
            elif "condition.total_ms" in line_str or "prefill" in line_str:
                reporter.update(
                    "generating",
                    0.20,
                    phase="conditioning",
                    message="Conditioning Indian musicology style & lyrics...",
                    phaseProgress=0.20,
                )

        proc.stdout.close()
        return_code = proc.wait()
        if return_code != 0 or not temp_out.exists() or temp_out.stat().st_size == 0:
            err_msg = f"Native generation ({family}) failed with exit code {return_code}"
            trace_session.log_event("audiocpp_error", error=err_msg)
            reporter.fail(err_msg, progress=0.0)
            return False

        reporter.update(
            "generating",
            0.90,
            phase="mastering",
            message="Mastering 96kHz / 32-bit float extended spectrum & clearing frequencies...",
            phaseProgress=0.90,
        )

        import soundfile as sf
        raw_audio, in_sr = sf.read(str(temp_out), dtype="float32")
        out_sr = in_sr
        try:
            from nad_ragabridge import upscale_and_clear_frequencies
            raw_audio, out_sr = upscale_and_clear_frequencies(
                raw_audio,
                sample_rate=in_sr,
                target_sr=96000,
                enable_subsonic_cut=raw_params.get("subsonic_cut", True),
                subsonic_cut_hz=float(raw_params.get("subsonic_cut_hz", 35.0)),
                enable_clarity_eq=raw_params.get("mid_clarity", True),
                enable_harmonic_restoration=True,
                enable_hypersonic=True,
                enable_somatic=True,
                sa_hz=float(raw_params.get("sa_hz", 240.0)),
                raga_name=raga_name,
                enable_raga_filter=True,
                drone_level=float(raw_params.get("drone_level", 0.20)),
                mastering_preset=str(raw_params.get("mastering_preset", "film")),
            )
        except Exception as e:
            trace_session.log_event("mastering_error", error=str(e))

        output_path.parent.mkdir(parents=True, exist_ok=True)
        sf.write(str(output_path), raw_audio, out_sr, subtype="FLOAT")

        try:
            temp_out.unlink(missing_ok=True)
        except Exception:
            pass

        reporter.done(str(output_path))
        trace_session.log_event("generation_complete", output_path=str(output_path), sample_rate=out_sr)
        return True

    def generate(
        self,
        *,
        workflow: str,
        raw_params_json: str,
        output_path: Path,
        session_mode: str,
        request_id: str,
        request_model_id: str = "",
    ) -> bool:
        if self._busy:
            emit(
                "error",
                0.0,
                phase="busy",
                message="Another generation is already active in the worker.",
                error="Another generation is already active in the worker.",
                requestId=request_id,
                protocolVersion=WORKER_PROTOCOL_VERSION,
                scriptVersion=SCRIPT_VERSION,
            )
            return False

        self._busy = True
        trace_session = AITraceSession(
            request_id=request_id,
            workflow=workflow,
            session_mode=session_mode,
            model_id=request_model_id or self.ui_model_id,
        )
        reporter = ProgressReporter(
            model_id=request_model_id or self.ui_model_id,
            diffusers_model_id=self.diffusers_model_id,
            cache_root=self.cache_root,
            request_id=request_id,
            session_mode=session_mode,
            trace_path=trace_session.trace_path(),
            backend=self.manager.backend,
            run_mode="warm" if self.manager.pipe is not None else "cold",
        )
        reporter.start_heartbeat()
        completed = False
        try:
            try:
                raw_params = json.loads(raw_params_json)
                if not isinstance(raw_params, dict):
                    raise ValueError("params JSON must decode to an object")
            except Exception as exc:
                raise GenerationFailure(f"Invalid params JSON: {exc}", progress=0.03) from exc

            target_model = str(raw_params.get("model") or raw_params.get("model_id") or "").strip().lower()
            if target_model in {
                "yue2", "yue-2", "yue-2-3b", "yeu2", "yeu 2",
                "minimax_music3", "minimax3", "minimax-music-3", "music 3",
                "stable_audio", "stable_audio3", "stable-audio-3", "stable-audio-3-medium",
                "ace_step", "ace_step_xl_turbo", "ace-step-v15-xl-turbo", "ace-step"
            }:
                if self.manager.pipe is not None:
                    self.manager.unload()
                success = self._generate_via_audiocpp(
                    target_model=target_model,
                    raw_params=raw_params,
                    output_path=output_path,
                    reporter=reporter,
                    trace_session=trace_session,
                )
                completed = success
                return success

            from ai_model_variants import requested_variant, variant_root, validate_variant
            variant = requested_variant(raw_params)
            selected_model = self.diffusers_model_id
            if variant == "int8":
                root = variant_root(self.ui_model_id)
                validate_variant(root, self.ui_model_id)
                selected_model = str(root)
            if self.manager.model_id != selected_model:
                self.manager.unload()
                self.manager = DiffusersAcePipelineManager(model_id=selected_model,
                    cache_root=self.cache_root, enable_group_offload=True)

            reporter.update(
                "loading",
                0.04,
                phase="validating_request",
                message="Validating ACE-Step Diffusers request.",
            )
            output_path.parent.mkdir(parents=True, exist_ok=True)
            source_request = (
                prepare_source_segment(
                    raw_params=raw_params,
                    output_path=output_path,
                    request_id=request_id,
                )
                if workflow in SOURCE_WORKFLOWS
                else None
            )
            spec = build_generation_spec(workflow, raw_params, source_request=source_request)
            trace_session.log_event(
                "request_contract",
                rawParams=raw_params,
                normalizedSpec={
                    "workflow": spec.workflow,
                    "duration": spec.duration,
                    "steps": spec.steps,
                    "shift": spec.shift,
                    "requestedSeed": spec.requested_seed,
                    "resolvedSeed": spec.seed,
                    "mode": spec.mode,
                    "audioTask": spec.audio_task,
                    "bpm": spec.bpm,
                    "keyscale": spec.keyscale,
                    "timesignature": spec.timesignature,
                    "vocalLanguage": spec.vocal_language,
                },
                backendFamily="ace_diffusers",
                diffusersModelId=self.diffusers_model_id,
                cacheRoot=str(self.cache_root),
            )
            final_output = self.manager.generate(
                spec=spec,
                source_request=source_request,
                output_path=output_path,
                reporter=reporter,
            )
            reporter.done(str(final_output))
            completed = True
            return True
        except GenerationFailure as failure:
            trace_session.log_event(
                "generation_failed",
                error=failure.message,
                payload=failure.payload,
            )
            reporter.fail(failure.message, progress=failure.progress, **failure.payload)
            return False
        except Exception as exc:
            detail = f"{type(exc).__name__}: {exc}"
            trace_session.log_event(
                "generation_exception",
                error=detail,
                traceback="".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
            )
            reporter.fail(
                f"ACE-Step Diffusers generation failed: {detail}",
                progress=0.0,
                failureKind="ace_diffusers_failure",
                failureDetail=detail,
            )
            return False
        finally:
            reporter.stop_heartbeat()
            if not completed:
                self.manager.unload()
            trace_session.finalize()
            self._busy = False


def recv_exact(connection: socket.socket, byte_count: int) -> bytes:
    chunks: list[bytes] = []
    remaining = byte_count
    while remaining > 0:
        data = connection.recv(remaining)
        if not data:
            raise ConnectionError("Socket closed before the framed payload was fully received.")
        chunks.append(data)
        remaining -= len(data)
    return b"".join(chunks)


def recv_framed_json(connection: socket.socket) -> dict[str, Any]:
    header = recv_exact(connection, 4)
    payload_length = struct.unpack(">I", header)[0]
    if payload_length <= 0 or payload_length > MAX_FRAMED_PAYLOAD_BYTES:
        raise ValueError(f"Invalid framed payload length: {payload_length}")
    payload = recv_exact(connection, payload_length)
    parsed = json.loads(payload.decode("utf-8", errors="replace"))
    if not isinstance(parsed, dict):
        raise ValueError("Framed payload must decode to a JSON object.")
    parsed["_framedPayloadLength"] = payload_length
    return parsed


def send_framed_json(connection: socket.socket, payload: dict[str, Any]) -> int:
    payload_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    if len(payload_bytes) > MAX_FRAMED_PAYLOAD_BYTES:
        raise ValueError(f"Framed payload exceeds the maximum allowed size: {len(payload_bytes)} bytes")
    connection.sendall(struct.pack(">I", len(payload_bytes)) + payload_bytes)
    return len(payload_bytes)


def run_worker_server(
    *,
    ui_model_id: str,
    diffusers_model_id: str,
    cache_root: Path,
    enable_group_offload: bool,
) -> None:
    session = WorkerSession(
        ui_model_id=ui_model_id,
        diffusers_model_id=diffusers_model_id,
        cache_root=cache_root,
        enable_group_offload=enable_group_offload,
    )
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("127.0.0.1", 0))
    server.listen(1)
    server.settimeout(1.0)
    last_request_finished = time.monotonic()
    port = server.getsockname()[1]

    emit(
        "idle",
        0.0,
        event="ready",
        phase="worker_ready",
        message="ACE-Step Diffusers worker is ready.",
        port=port,
        backend=session.manager.backend,
        backendFamily="ace_diffusers",
        sessionMode="persistent",
        protocolVersion=WORKER_PROTOCOL_VERSION,
        scriptVersion=SCRIPT_VERSION,
        pid=os.getpid(),
        scriptPath=str(SCRIPT_PATH),
        modelId=ui_model_id,
        musicGenerationModelId=ui_model_id,
        musicGenerationModelRepoId=diffusers_model_id,
        musicGenerationCheckpointRoot=str(cache_root),
        availableProfiles=["ace-diffusers"],
        warmSessionCapable=True,
    )

    try:
        while True:
            try:
                connection, _address = server.accept()
            except socket.timeout:
                from ai_execution_policy import release_idle_weights, host_available
                if session.manager.pipe is not None and release_idle_weights(
                        time.monotonic() - last_request_finished, host_available()):
                    session.manager.unload()
                    session.manager.conservative = False
                continue
            with connection:
                try:
                    request = recv_framed_json(connection)
                except Exception as exc:
                    send_framed_json(
                        connection,
                        {
                            "accepted": False,
                            "error": f"Invalid worker request frame: {exc}",
                            "failureKind": "worker_protocol",
                            "protocolVersion": WORKER_PROTOCOL_VERSION,
                            "scriptVersion": SCRIPT_VERSION,
                            "pid": os.getpid(),
                        },
                    )
                    continue

                command = normalize_text(request.get("command"))
                request_id = normalize_text(request.get("requestId"), str(uuid.uuid4()))
                request_protocol_version = normalize_int(request.get("protocolVersion"), WORKER_PROTOCOL_VERSION)
                request_script_version = normalize_text(request.get("scriptVersion"))
                if command == "shutdown":
                    send_framed_json(
                        connection,
                        {
                            "accepted": True,
                            "requestId": request_id,
                            "protocolVersion": WORKER_PROTOCOL_VERSION,
                            "scriptVersion": SCRIPT_VERSION,
                            "pid": os.getpid(),
                        },
                    )
                    break

                if request_protocol_version != WORKER_PROTOCOL_VERSION:
                    send_framed_json(
                        connection,
                        {
                            "accepted": False,
                            "requestId": request_id,
                            "error": (
                                "Worker protocol mismatch: "
                                f"app={request_protocol_version}, worker={WORKER_PROTOCOL_VERSION}"
                            ),
                            "failureKind": "worker_protocol",
                            "protocolVersion": WORKER_PROTOCOL_VERSION,
                            "scriptVersion": SCRIPT_VERSION,
                            "pid": os.getpid(),
                        },
                    )
                    continue

                if request_script_version and request_script_version != SCRIPT_VERSION:
                    send_framed_json(
                        connection,
                        {
                            "accepted": False,
                            "requestId": request_id,
                            "error": (
                                "Worker script version mismatch: "
                                f"app={request_script_version}, worker={SCRIPT_VERSION}"
                            ),
                            "failureKind": "worker_protocol",
                            "protocolVersion": WORKER_PROTOCOL_VERSION,
                            "scriptVersion": SCRIPT_VERSION,
                            "pid": os.getpid(),
                        },
                    )
                    continue

                if command != "generate":
                    send_framed_json(
                        connection,
                        {
                            "accepted": False,
                            "requestId": request_id,
                            "error": f"Unsupported worker command: {command}",
                            "failureKind": "worker_protocol",
                            "protocolVersion": WORKER_PROTOCOL_VERSION,
                            "scriptVersion": SCRIPT_VERSION,
                            "pid": os.getpid(),
                        },
                    )
                    continue

                workflow = normalize_text(request.get("workflow"), "text-to-music")
                raw_params_json = request.get("params")
                output = normalize_text(request.get("output"))
                request_model_id = normalize_text(request.get("modelId"), ui_model_id)
                if not isinstance(raw_params_json, str) or not output:
                    send_framed_json(
                        connection,
                        {
                            "accepted": False,
                            "error": "Generate requests require params JSON and output path.",
                            "requestId": request_id,
                            "failureKind": "worker_protocol",
                            "protocolVersion": WORKER_PROTOCOL_VERSION,
                            "scriptVersion": SCRIPT_VERSION,
                            "pid": os.getpid(),
                        },
                    )
                    continue

                send_framed_json(
                    connection,
                    {
                        "accepted": True,
                        "requestId": request_id,
                        "protocolVersion": WORKER_PROTOCOL_VERSION,
                        "scriptVersion": SCRIPT_VERSION,
                        "pid": os.getpid(),
                        "framedPayloadLength": int(request.get("_framedPayloadLength", 0)),
                    },
                )
                session.generate(
                    workflow=workflow,
                    raw_params_json=raw_params_json,
                    output_path=Path(output).expanduser().resolve(),
                    session_mode="persistent",
                    request_id=request_id,
                    request_model_id=request_model_id,
                )
                last_request_finished = time.monotonic()
    finally:
        server.close()


def resolve_one_shot_params_json(args: argparse.Namespace) -> str:
    sources = [
        bool(getattr(args, "params", "")),
        bool(getattr(args, "params_file", "")),
        bool(getattr(args, "params_stdin", False)),
    ]
    if sum(1 for source in sources if source) != 1:
        raise SystemExit("Exactly one of --params, --params-file, or --params-stdin is required unless --worker is used.")
    if args.params:
        return str(args.params)
    if args.params_file:
        return Path(args.params_file).expanduser().resolve().read_text(encoding="utf-8-sig")
    return sys.stdin.read()


def run_one_shot(args: argparse.Namespace) -> int:
    if not args.workflow or not args.output:
        raise SystemExit("--workflow and --output are required unless --worker is used.")
    raw_params_json = resolve_one_shot_params_json(args)
    cache_root = resolve_cache_root(args)
    session = WorkerSession(
        ui_model_id=args.music_gen_model,
        diffusers_model_id=args.model_id,
        cache_root=cache_root,
        enable_group_offload=(
            not args.disable_group_offload
            and normalize_bool(os.environ.get("OPENSTUDIO_ACE_ENABLE_GROUP_OFFLOAD"), True)
        ),
    )
    success = session.generate(
        workflow=args.workflow,
        raw_params_json=raw_params_json,
        output_path=Path(args.output).expanduser().resolve(),
        session_mode=normalize_text(args.session_mode, "oneshot"),
        request_id=normalize_text(args.request_id, str(uuid.uuid4())),
        request_model_id=args.music_gen_model,
    )
    return 0 if success else 1


def resolve_cache_root(args: argparse.Namespace) -> Path:
    explicit_cache_root = normalize_text(getattr(args, "cache_root", ""))
    if explicit_cache_root:
        return Path(explicit_cache_root).expanduser().resolve()
    checkpoint_root = normalize_text(getattr(args, "checkpoint_root", ""))
    return resolve_music_gen_checkpoint_root(checkpoint_root)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate music with ACE-Step Diffusers")
    parser.add_argument("--worker", action="store_true", help="Run as a persistent worker")
    parser.add_argument("--workflow", help="Workflow id to execute")
    parser.add_argument("--params", help="Workflow parameters JSON")
    parser.add_argument("--params-file", help="Path to workflow parameters JSON")
    parser.add_argument("--params-stdin", action="store_true", help="Read workflow parameters JSON from stdin")
    parser.add_argument("--output", help="Output WAV file path")
    parser.add_argument("--request-id", help="Request identifier for diagnostics")
    parser.add_argument("--checkpoint-root", default="", help="Compatibility alias for --cache-root")
    parser.add_argument("--cache-root", default="", help="Hugging Face cache root for ACE-Step Diffusers")
    parser.add_argument("--music-gen-model", default=DEFAULT_UI_MODEL_ID, help="OpenStudio UI model id")
    parser.add_argument("--model-id", default=DEFAULT_DIFFUSERS_MODEL_ID, help="Diffusers ACE-Step model repo id")
    parser.add_argument("--session-mode", default="oneshot", help="Session mode label to include in progress payloads")
    parser.add_argument("--disable-group-offload", action="store_true", help="Disable Diffusers transformer group offload")
    return parser.parse_args()


def main() -> None:
    install_stream_mirrors()
    args = parse_args()
    cache_root = resolve_cache_root(args)
    enable_group_offload = (
        not args.disable_group_offload
        and normalize_bool(os.environ.get("OPENSTUDIO_ACE_ENABLE_GROUP_OFFLOAD"), True)
    )
    if args.worker:
        run_worker_server(
            ui_model_id=args.music_gen_model,
            diffusers_model_id=args.model_id,
            cache_root=cache_root,
            enable_group_offload=enable_group_offload,
        )
        return
    raise SystemExit(run_one_shot(args))


if __name__ == "__main__":
    main()
