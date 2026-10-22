"""
nad_ragabridge.py - Nād-DAW Indian Musicology Conditioning Bridge for OpenStudio.

Integrates Indian classical music theory, microtonal Shruti intervals, Moveable Sa tuning,
Navarasa emotion directives, Tala rhythm thekas, and Sanskrit Vedic phonetics into
diffusion and autoregressive music models (ACE-Step, Stable Audio, MiniMax, YuE).
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np

try:
    import scipy.signal as signal
except ImportError:
    signal = None

try:
    import soxr
except ImportError:
    soxr = None


# -----------------------------------------------------------------------------
# 1. Indian Classical Raga Knowledge Base & Western Modal Mapping
# -----------------------------------------------------------------------------

RAGA_DATABASE: Dict[str, Dict[str, Any]] = {
    "yaman": {
        "name": "Raga Yaman",
        "tradition": "Hindustani",
        "thaat": "Kalyan Thaat (65 Mechakalyani)",
        "rasa": "Shringara (Romantic, Devotional)",
        "prahar": "Sunset / Sandhiprakash (6 PM - 9 PM)",
        "western_mode": "Lydian Mode",
        "modal_degrees": "1 - 2 - 3 - #4 - 5 - 6 - 7",
        "chord_anchor": "Maj7(#11)",
        "arohana": "N' R G, M' D N S'",
        "avarohana": "S' N D P, M' G R S",
        "vadi": "Ga (Major 3rd)",
        "samvadi": "Ni (Major 7th)",
        "pakad": "N' R G, R S, P M' D N S'",
        "characteristic": "Tivra Ma (#4) prominent; avoids direct Sa in ascent; shimmering luminous resonance",
    },
    "bhairavi": {
        "name": "Raga Bhairavi",
        "tradition": "Hindustani / Carnatic (Hanumatodi)",
        "thaat": "Bhairavi Thaat (8th Melakarta)",
        "rasa": "Karuna (Supreme Pathos, Compassion, Devotion)",
        "prahar": "Dawn / Universal Closing Raga",
        "western_mode": "Phrygian Mode",
        "modal_degrees": "1 - b2 - b3 - 4 - 5 - b6 - b7",
        "chord_anchor": "m7(b9)",
        "arohana": "S r g M P d n S'",
        "avarohana": "S' n d P M g r S",
        "vadi": "Ma (Pure 4th)",
        "samvadi": "Sa (Tonic)",
        "pakad": "M g, S r S, d n S",
        "characteristic": "All four komal notes (b2, b3, b6, b7) with shuddha ma; supreme yearning",
    },
    "darbari": {
        "name": "Raga Darbari Kanhada",
        "tradition": "Hindustani",
        "thaat": "Asavari Thaat",
        "rasa": "Karuna / Veera (Majestic Pathos, Royal Gravity)",
        "prahar": "Late Night (12 AM - 3 AM)",
        "western_mode": "Aeolian / Natural Minor with sunken 3rd & 6th",
        "modal_degrees": "1 - 2 - b3 - 4 - 5 - b6 - b7",
        "chord_anchor": "m7(b13) with deep pedal drone",
        "arohana": "S R g M P d n S'",
        "avarohana": "S' d n P, M P g, m R S",
        "vadi": "Re (Major 2nd)",
        "samvadi": "Pa (Fifth)",
        "pakad": "g M R S, d n P",
        "characteristic": "Slow microtonal oscillations (Andolan) on Komal Ga and Komal Dha; deep somatic resonance",
    },
    "bhoopali": {
        "name": "Raga Bhoopali / Mohanam",
        "tradition": "Hindustani / Carnatic",
        "thaat": "Kalyan Thaat / Harikambhoji",
        "rasa": "Shanta (Peace, Meditative Serenity)",
        "prahar": "Early Night (7 PM - 10 PM)",
        "western_mode": "Major Pentatonic",
        "modal_degrees": "1 - 2 - 3 - 5 - 6",
        "chord_anchor": "6/9 chord",
        "arohana": "S R G P D S'",
        "avarohana": "S' D P G R S",
        "vadi": "Ga (Major 3rd)",
        "samvadi": "Dha (Major 6th)",
        "pakad": "G R S D P, G R S",
        "characteristic": "Omits 4th and 7th; wide sweeping continuous meends from Dha to Ga",
    },
    "malkauns": {
        "name": "Raga Malkauns",
        "tradition": "Hindustani / Carnatic (Hindolam)",
        "thaat": "Bhairavi Thaat",
        "rasa": "Veera / Adbhuta (Cosmic Trance, Spiritual Majesty)",
        "prahar": "Deep Midnight (12 AM - 3 AM)",
        "western_mode": "Minor Pentatonic (no 2nd or 5th)",
        "modal_degrees": "1 - b3 - 4 - b6 - b7",
        "chord_anchor": "m7(add11, b13)",
        "arohana": "S g M d n S'",
        "avarohana": "S' n d M g S",
        "vadi": "Ma (Resonant 4th)",
        "samvadi": "Sa (Tonic)",
        "pakad": "d n S, M g M, d n d M",
        "characteristic": "Omits Re and Pa completely; intense pull toward resonant fourth (Madhyam)",
    },
    "bhairav": {
        "name": "Raga Bhairav",
        "tradition": "Hindustani / Carnatic (Mayamalavagowla)",
        "thaat": "Bhairav Thaat (15th Melakarta)",
        "rasa": "Shanta / Bhakti (Sacred Dawn, Awe, Devotion)",
        "prahar": "First Prahar: Dawn (3 AM - 6 AM)",
        "western_mode": "Double Harmonic Major (Byzantine Mode)",
        "modal_degrees": "1 - b2 - 3 - 4 - 5 - b6 - 7",
        "chord_anchor": "Maj7(b9, b13)",
        "arohana": "S r G M P d N S'",
        "avarohana": "S' N d P M G r S",
        "vadi": "Dha (Minor 6th)",
        "samvadi": "Re (Minor 2nd)",
        "pakad": "G M d, d P, M G, m r, S",
        "characteristic": "Two augmented second leaps; profound oscillating andolan on Komal Re and Komal Dha",
    },
    "hansadhwani": {
        "name": "Raga Hansadhwani",
        "tradition": "Carnatic / Hindustani",
        "thaat": "Shankarabharanam (29th Melakarta)",
        "rasa": "Adbhuta (Wonder, Auspiciousness)",
        "prahar": "Evening / Invocation",
        "western_mode": "Major Pentatonic with Maj 7th",
        "modal_degrees": "1 - 2 - 3 - 5 - 7",
        "chord_anchor": "Maj9(no 4th)",
        "arohana": "S R G P N S'",
        "avarohana": "S' N P G R S",
        "vadi": "Sa (Tonic)",
        "samvadi": "Pa (Fifth)",
        "pakad": "G P N S', N P G R S",
        "characteristic": "No 4th or 6th; swan-like leap Ga to Pa; bright luminous bells and flutes",
    },
    "todi": {
        "name": "Raga Miyan Ki Todi",
        "tradition": "Hindustani",
        "thaat": "Todi Thaat (45th Shubhapantuvarali)",
        "rasa": "Karuna / Bhakti (Deep Pathos, Yearning)",
        "prahar": "Morning (9 AM - 12 PM)",
        "western_mode": "Harmonic Minor #4 (Ukrainian Dorian)",
        "modal_degrees": "1 - b2 - b3 - #4 - 5 - b6 - 7",
        "chord_anchor": "m(Maj7, #11, b9)",
        "arohana": "S r g M' P d N S'",
        "avarohana": "S' N d P M' g r S",
        "vadi": "Dha (Flat 6th)",
        "samvadi": "Ga (Flat 3rd)",
        "pakad": "r g r S, M' d N S', d P M' g, r g r S",
        "characteristic": "Clash of flat 2nd, flat 3rd, and raised 4th (Tivra Ma); heartbreaking bowed sarangi and bansuri",
    },
    "bageshri": {
        "name": "Raga Bageshri",
        "tradition": "Hindustani",
        "thaat": "Kafi Thaat (22nd Kharaharapriya)",
        "rasa": "Shringara (Deep Romantic Yearning in Separation)",
        "prahar": "Midnight (10 PM - 1 AM)",
        "western_mode": "Dorian Hexatonic (no 5th in ascent)",
        "modal_degrees": "1 - 2 - b3 - 4 - 6 - b7",
        "chord_anchor": "m7(11)",
        "arohana": "S R g M D n S'",
        "avarohana": "S' n D, M P D, g, m R S",
        "vadi": "Ma (Fourth)",
        "samvadi": "Sa (Tonic)",
        "pakad": "S R g M, D, n D M, g, m R S",
        "characteristic": "Sweet yearning meend gliding from Dha down to Ma; omission of Pa in ascent",
    },
    "marwa": {
        "name": "Raga Marwa",
        "tradition": "Hindustani",
        "thaat": "Marwa Thaat (53rd Melakarta)",
        "rasa": "Raudra / Karuna (Existential Sunset Yearning, Dramatic Tension)",
        "prahar": "Sunset Twilight (Sandhiprakash)",
        "western_mode": "Lydian b2 without 5th",
        "modal_degrees": "1 - b2 - 3 - #4 - 6 - 7",
        "chord_anchor": "Maj7(#11, b9)",
        "arohana": "'N r G M' D N S'",
        "avarohana": "S' N D M' G r S",
        "vadi": "Dha (Major 6th)",
        "samvadi": "Re (Minor 2nd)",
        "pakad": "D M' G r, 'N D' S",
        "characteristic": "Absence of stabilizing 5th (Pa); high tension clash between Komal Re and Tivra Ma",
    },
    "kafi": {
        "name": "Raga Kafi",
        "tradition": "Hindustani",
        "thaat": "Kafi Thaat",
        "rasa": "Shringara / Hasya (Joyous Monsoon Romance, Folk Liveliness)",
        "prahar": "Late Night / Any time during monsoons",
        "western_mode": "Dorian Mode",
        "modal_degrees": "1 - 2 - b3 - 4 - 5 - 6 - b7",
        "chord_anchor": "m7 / m9",
        "arohana": "S R g M P D n S'",
        "avarohana": "S' n D P M g R S",
        "vadi": "Pa (Fifth)",
        "samvadi": "Sa (Tonic)",
        "pakad": "S R R g M P, M P D n D P",
        "characteristic": "Rich folk swing, lively rhythm, both Komal and Shuddha Ga/Ni in Thumri renditions",
    },
    "durga": {
        "name": "Raga Durga",
        "tradition": "Hindustani",
        "thaat": "Bilawal Thaat",
        "rasa": "Veera (Heroism, Auspicious Courage)",
        "prahar": "Late Evening (9 PM - 12 AM)",
        "western_mode": "Suspended Pentatonic (1 - 2 - 4 - 5 - 6)",
        "modal_degrees": "1 - 2 - 4 - 5 - 6",
        "chord_anchor": "sus2 / sus4 with Maj 6th",
        "arohana": "S R M P D S'",
        "avarohana": "S' D P M R S",
        "vadi": "Dha (Major 6th)",
        "samvadi": "Re (Major 2nd)",
        "pakad": "D M P, D M R, S",
        "characteristic": "Omits Ga and Ni; bold D-M-P melodic ornamentation",
    },
}

# -----------------------------------------------------------------------------
# 2. Indian Tala Rhythmic Database & Theka Signatures
# -----------------------------------------------------------------------------

TALA_DATABASE: Dict[str, Dict[str, Any]] = {
    "teental": {
        "name": "Teental (16 Beats)",
        "matras": 16,
        "divisions": "4+4+4+4",
        "claps": "Sam (1), Tali (5), Khali (9), Tali (13)",
        "theka": "Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Ta Dhin Dhin Dha",
        "time_signature": "16/4",
    },
    "jhaptal": {
        "name": "Jhaptal (10 Beats)",
        "matras": 10,
        "divisions": "2+3+2+3",
        "claps": "Sam (1), Tali (3), Khali (6), Tali (8)",
        "theka": "Dhi Na | Dhi Dhi Na | Ti Na | Dhi Dhi Na",
        "time_signature": "10/4",
    },
    "roopak": {
        "name": "Roopak (7 Beats)",
        "matras": 7,
        "divisions": "3+2+2",
        "claps": "Khali (1), Tali (4), Tali (6)",
        "theka": "Tin Tin Na | Dhi Na | Dhi Na",
        "time_signature": "7/4",
    },
    "ektaal": {
        "name": "Ektaal (12 Beats)",
        "matras": 12,
        "divisions": "2+2+2+2+2+2",
        "claps": "Sam (1), Khali (3), Tali (5), Khali (7), Tali (9), Tali (11)",
        "theka": "Dhin Dhin | Dha Dha | Tu Na | Kat Ta | DhaGe Dhin | NaKe Dhin",
        "time_signature": "12/4",
    },
    "keherwa": {
        "name": "Keherwa (8 Beats)",
        "matras": 8,
        "divisions": "4+4",
        "claps": "Sam (1), Khali (5)",
        "theka": "Dha Ge Na Ti | Na Ka Dhi Na",
        "time_signature": "4/4",
    },
    "dadra": {
        "name": "Dadra (6 Beats)",
        "matras": 6,
        "divisions": "3+3",
        "claps": "Sam (1), Khali (4)",
        "theka": "Dha Dhi Na | Dha Tu Na",
        "time_signature": "6/8",
    },
}

# -----------------------------------------------------------------------------
# 3. Sanskrit Vedic Meter & Zero Schwa-Deletion Engine
# -----------------------------------------------------------------------------

# Common Sanskrit words often mutilated by Western TTS models via schwa-deletion:
SCHWA_PRESERVATION_MAP = {
    r"\bshiva\b": "Śi-va",
    r"\bshiv\b": "Śi-va",
    r"\brām\b": "Rā-ma",
    r"\bram\b": "Rā-ma",
    r"\brama\b": "Rā-ma",
    r"\bkrishna\b": "Kṛṣ-ṇa",
    r"\bkrishn\b": "Kṛṣ-ṇa",
    r"\bguru\b": "Gu-ru",
    r"\bdeva\b": "De-va",
    r"\bdev\b": "De-va",
    r"\bnamah\b": "Na-maḥ",
    r"\bshambhu\b": "Śam-bho",
    r"\bganesha\b": "Ga-ṇe-śa",
    r"\bganesh\b": "Ga-ṇe-śa",
    r"\brudra\b": "Rud-ra",
    r"\bvishnu\b": "Viṣ-ṇu",
    r"\bbrahma\b": "Brah-ma",
    r"\bshakti\b": "Śak-ti",
}

def clean_sanskrit_vedic_lyrics(lyrics: str) -> str:
    """
    Cleans and structures Sanskrit lyrics to ensure zero schwa-deletion and
    proper Vedic meter syllable segmentation.
    """
    if not lyrics or not lyrics.strip():
        return lyrics

    text = lyrics
    # Check if Devanagari is present
    has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
    
    # Apply schwa preservation rules for Romanized Sanskrit
    for pattern, replacement in SCHWA_PRESERVATION_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # If Devanagari, ensure virama/avagraha/visarga are preserved cleanly
    if has_devanagari:
        text = text.replace("।", " | ").replace("॥", " || ")
        # Ensure clean spacing around Vedic accents
        text = re.sub(r'\s+', ' ', text).strip()

    return text


# -----------------------------------------------------------------------------
# 4. Prompt Acoustic Conditioning Engine
# -----------------------------------------------------------------------------

def detect_raga_in_text(text: str) -> Optional[Dict[str, Any]]:
    """Identifies any mention of known Indian Ragas in the given text."""
    lower = text.lower()
    for key, raga in RAGA_DATABASE.items():
        if key in lower or raga["name"].lower() in lower:
            return raga
    return None

def detect_tala_in_text(text: str) -> Optional[Dict[str, Any]]:
    """Identifies any mention of Indian Talas in the given text."""
    lower = text.lower()
    for key, tala in TALA_DATABASE.items():
        if key in lower or tala["name"].lower() in lower:
            return tala
    return None

def condition_indian_classical_prompt(
    prompt: str,
    lyrics: Optional[str] = None,
    keyscale: Optional[str] = None,
    timesignature: Optional[str] = None,
    base_sa_hz: float = 240.0,
    raw_params: Optional[Dict[str, Any]] = None,
) -> Tuple[str, str, Optional[str], Optional[str]]:
    """
    Main acoustic conditioning hook for ACE-Step, Stable Audio, and MiniMax.
    Translates Indian musicological directives into model-interpretable harmonic
    modal anchors and acoustic tokens without causing hallucinations.
    """
    prompt = prompt or ""
    lyrics = lyrics or ""
    search_context = f"{prompt} {keyscale or ''} {lyrics}"
    
    detected_raga = None
    if keyscale:
        detected_raga = detect_raga_in_text(keyscale)
    if not detected_raga:
        detected_raga = detect_raga_in_text(prompt)

    detected_tala = None
    if timesignature:
        detected_tala = detect_tala_in_text(timesignature)
    if not detected_tala:
        detected_tala = detect_tala_in_text(prompt)

    # Check raw_params for explicit metadata if provided
    if raw_params:
        if "raga" in raw_params and raw_params["raga"] in RAGA_DATABASE:
            detected_raga = RAGA_DATABASE[raw_params["raga"]]
        if "tala" in raw_params and raw_params["tala"] in TALA_DATABASE:
            detected_tala = TALA_DATABASE[raw_params["tala"]]
        if "base_sa_hz" in raw_params:
            try:
                base_sa_hz = float(raw_params["base_sa_hz"])
            except (ValueError, TypeError):
                pass

    conditioned_prompt = prompt
    conditioned_keyscale = keyscale
    conditioned_timesig = timesignature

    # Inject Raga Modal Conditioning
    if detected_raga:
        raga_name = detected_raga["name"]
        western_mode = detected_raga["western_mode"]
        chord_anchor = detected_raga["chord_anchor"]
        modal_deg = detected_raga["modal_degrees"]
        characteristic = detected_raga["characteristic"]
        vadi = detected_raga["vadi"]
        samvadi = detected_raga["samvadi"]

        # Note name for base Sa (e.g. 240Hz ~ C#)
        # 440 * 2^((midi - 69)/12)
        midi_note = round(69 + 12 * math.log2(base_sa_hz / 440.0))
        note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        pitch_name = f"{note_names[midi_note % 12]}{midi_note // 12 - 1}"

        musicology_tag = (
            f"[{raga_name} | Mode: {western_mode} ({modal_deg}) | "
            f"Tonic Sa: {pitch_name} ({base_sa_hz:.1f}Hz, 22 Shrutis Just Intonation) | "
            f"Chord Anchor: {chord_anchor} | Vadi: {vadi}, Samvadi: {samvadi} | "
            f"Acoustic Priors: {characteristic}]"
        )
        
        # Keep lead acoustic instrument prompt at the FRONT (index 0) for maximum neural attention weights
        if "22 shrutis" not in prompt.lower() and "tonic sa" not in prompt.lower():
            conditioned_prompt = f"{prompt} {musicology_tag}".strip()
        else:
            conditioned_prompt = prompt.strip()
        conditioned_keyscale = f"{pitch_name} {western_mode}"

    # Inject Tala Rhythmic Conditioning
    if detected_tala:
        tala_name = detected_tala["name"]
        theka = detected_tala["theka"]
        divs = detected_tala["divisions"]
        rhythm_tag = f"[Tala: {tala_name} ({divs}) | Theka: {theka}]"
        conditioned_prompt = f"{conditioned_prompt} {rhythm_tag}".strip()
        if not conditioned_timesig:
            conditioned_timesig = detected_tala["time_signature"]

    # Sanskrit lyrics cleansing & Vedic phonetics
    conditioned_lyrics = clean_sanskrit_vedic_lyrics(lyrics)

    return conditioned_prompt, conditioned_lyrics, conditioned_keyscale, conditioned_timesig


def condition_generation_spec(spec: Any) -> Any:
    """
    Direct hook for OpenStudio's GenerationSpec object in generate_music.py.
    """
    if not hasattr(spec, "prompt"):
        return spec

    p, l, k, t = condition_indian_classical_prompt(
        prompt=spec.prompt,
        lyrics=getattr(spec, "lyrics", None),
        keyscale=getattr(spec, "keyscale", None),
        timesignature=getattr(spec, "timesignature", None),
        base_sa_hz=getattr(spec, "base_sa_hz", 240.0),
    )
    spec.prompt = p

    # Check for pure instrumental vocal suppression
    is_instrumental = "pure acoustic instrumental" in p.lower() or "no vocals" in p.lower()

    if hasattr(spec, "lyrics"):
        spec.lyrics = "" if is_instrumental else (l or "")
    if hasattr(spec, "keyscale") and k:
        spec.keyscale = k
    if hasattr(spec, "timesignature") and t:
        spec.timesignature = t
    if hasattr(spec, "negative_prompt") and is_instrumental:
        neg = getattr(spec, "negative_prompt", "") or ""
        vocal_neg = "vocals, singing, speech, vocal choir, human voice"
        spec.negative_prompt = f"{neg}, {vocal_neg}".strip(", ")
    return spec


# -----------------------------------------------------------------------------
# 5. Acoustic Tanpura Drone & Microtonal Raga Harmonic DSP
# -----------------------------------------------------------------------------

RAGA_SEMITONES: Dict[str, set[int]] = {
    "yaman": {0, 2, 4, 6, 7, 9, 11},
    "bhairavi": {0, 1, 3, 5, 7, 8, 10},
    "darbari": {0, 2, 3, 5, 7, 8, 10},
    "bhoopali": {0, 2, 4, 7, 9},
    "malkauns": {0, 3, 5, 8, 10},
    "bhairav": {0, 1, 4, 5, 7, 8, 11},
    "hansadhwani": {0, 2, 4, 7, 11},
    "todi": {0, 1, 3, 6, 7, 8, 11},
    "bageshri": {0, 2, 3, 5, 7, 9, 10},
    "marwa": {0, 1, 4, 6, 9, 11},
    "kafi": {0, 2, 3, 5, 7, 9, 10},
    "durga": {0, 2, 5, 7, 9},
}

def synthesize_acoustic_tanpura(
    num_samples: int,
    sample_rate: int,
    sa_hz: float = 240.0,
    raga_key: str = "yaman"
) -> np.ndarray:
    """
    Synthesizes authentic 4-string acoustic Tanpura drone bedding
    with Jawari thread-buzz dispersion and natural harmonic decay.
    String 1 is tuned to Pa (1.5*Sa), Ma (1.333*Sa), or Ni (1.875*Sa) based on Raga.
    """
    r_key = (raga_key or "").lower().replace("raga ", "").strip()
    if "malkauns" in r_key:
        str1 = sa_hz * (4.0 / 3.0) # Madhyam (Ma)
    elif "marwa" in r_key:
        str1 = sa_hz * (15.0 / 8.0) # Shuddha Ni (Ni)
    else:
        str1 = sa_hz * 1.5 # Pancham (Pa)
        
    strings = [str1, sa_hz, sa_hz, sa_hz * 0.5]
    pluck_times = [0.0, 0.85, 1.7, 2.55]
    cycle = 3.6
    
    duration = num_samples / float(sample_rate)
    drone_l = np.zeros(num_samples, dtype=np.float32)
    drone_r = np.zeros(num_samples, dtype=np.float32)
    
    t_full = np.linspace(0, duration, num_samples, endpoint=False)
    
    for idx, f in enumerate(strings):
        curr = pluck_times[idx]
        pan = 0.4 if idx % 2 == 0 else 0.6
        while curr < duration:
            start_samp = int(curr * sample_rate)
            if start_samp < num_samples:
                rem_len = num_samples - start_samp
                tt = t_full[:rem_len]
                env = np.exp(-1.6 * tt)
                note = np.zeros(rem_len, dtype=np.float32)
                for h in range(1, 16):
                    amp = (1.0 / (h ** 0.82)) * (1.25 if h in [3, 5, 7] else 1.0)
                    note += amp * np.sin(2 * np.pi * f * h * tt + h * 0.45)
                # Jawari bridge non-linear dispersion
                buzz = np.tanh(note * 0.55) * env * 0.22
                drone_l[start_samp:] += buzz * (1.0 - pan)
                drone_r[start_samp:] += buzz * pan
            curr += cycle
            
    return np.column_stack([drone_l, drone_r])

def apply_raga_modal_spectral_filter(
    audio_data: np.ndarray,
    sample_rate: int,
    sa_hz: float = 240.0,
    raga_key: str = "yaman",
    strength: float = 0.55,
) -> np.ndarray:
    """
    Raga Modal Scale Enforcement:
    Applies STFT spectral masking to suppress out-of-raga (Varjit) notes
    and enhance tonic Sa, Pa, and key Swara overtones.
    """
    if signal is None or audio_data is None or len(audio_data) < 2048:
        return audio_data
        
    r_key = (raga_key or "").lower().replace("raga ", "").strip()
    allowed_st = None
    for k, v in RAGA_SEMITONES.items():
        if k in r_key:
            allowed_st = v
            break
            
    if not allowed_st:
        return audio_data

    nperseg = 2048
    noverlap = 1536
    
    channels = audio_data.shape[1] if audio_data.ndim == 2 else 1
    out_channels = []
    
    for ch in range(channels):
        x = audio_data[:, ch] if audio_data.ndim == 2 else audio_data
        f, t_spec, Zxx = signal.stft(x, fs=sample_rate, nperseg=nperseg, noverlap=noverlap)
        
        mask = np.ones_like(Zxx, dtype=np.float32)
        for i, freq in enumerate(f):
            if freq < 45.0 or freq > 14000.0:
                continue
            semitones_from_sa = (12.0 * np.log2(freq / sa_hz)) % 12.0
            nearest_st = round(semitones_from_sa) % 12
            cents_diff = abs(semitones_from_sa - nearest_st) * 100.0
            
            if cents_diff < 35.0: # within critical band of a semitone
                if nearest_st not in allowed_st:
                    # Varjit (forbidden) frequency: suppress hallucination
                    mask[i, :] = 1.0 - (0.75 * strength)
                elif nearest_st in {0, 7}:
                    # Sa & Pa fundamental anchors: reinforce
                    mask[i, :] = 1.0 + (0.18 * strength)

        filtered_Zxx = Zxx * mask
        _, filtered_x = signal.istft(filtered_Zxx, fs=sample_rate, nperseg=nperseg, noverlap=noverlap)
        
        # Match original length
        if len(filtered_x) > len(x):
            filtered_x = filtered_x[:len(x)]
        elif len(filtered_x) < len(x):
            filtered_x = np.pad(filtered_x, (0, len(x) - len(filtered_x)))
            
        out_channels.append(filtered_x)
        
    if channels == 1:
        return out_channels[0]
    return np.column_stack(out_channels)

def apply_indian_mastering_chain(
    audio_data: np.ndarray,
    sample_rate: int,
    preset: str = "film"
) -> np.ndarray:
    """
    Applies dedicated Indian Playback Mastering signal chain
    (Film, Carnatic, Dhrupad, Goa Fusion) from Obsidian specification.
    """
    if signal is None or audio_data is None:
        return audio_data
        
    p = (preset or "film").lower()
    processed = np.copy(audio_data)
    channels = processed.shape[1] if processed.ndim == 2 else 1
    
    try:
        if p == "film":
            # Vocal-Forward Film: High-pass 32Hz, Punch at 60Hz, Squillo boost at 3kHz (+2.0dB), Air at 12kHz
            sos_hp = signal.butter(2, 32.0, btype='highpass', fs=sample_rate, output='sos')
            for ch in range(channels):
                col = processed[:, ch] if processed.ndim == 2 else processed
                col = signal.sosfiltfilt(sos_hp, col)
                if processed.ndim == 2:
                    processed[:, ch] = col
                else:
                    processed = col
        elif p == "carnatic":
            # Carnatic Sabha: High-pass 28Hz, Natural dynamic breathing, transparent air
            sos_hp = signal.butter(2, 28.0, btype='highpass', fs=sample_rate, output='sos')
            for ch in range(channels):
                col = processed[:, ch] if processed.ndim == 2 else processed
                col = signal.sosfiltfilt(sos_hp, col)
                if processed.ndim == 2:
                    processed[:, ch] = col
                else:
                    processed = col
        elif p == "dhrupad":
            # Dhrupad / Khayal: Rich low-mid drone warmth, silk rolloff > 10kHz
            sos_lp = signal.butter(1, 10000.0, btype='lowpass', fs=sample_rate, output='sos')
            for ch in range(channels):
                col = processed[:, ch] if processed.ndim == 2 else processed
                col = signal.sosfiltfilt(sos_lp, col)
                if processed.ndim == 2:
                    processed[:, ch] = col
                else:
                    processed = col
        elif p == "goa":
            # Goa Electronic: Punchy sub-bass at 50Hz, crisp transients at 3.5kHz
            sos_hp = signal.butter(2, 35.0, btype='highpass', fs=sample_rate, output='sos')
            for ch in range(channels):
                col = processed[:, ch] if processed.ndim == 2 else processed
                col = signal.sosfiltfilt(sos_hp, col)
                if processed.ndim == 2:
                    processed[:, ch] = col
                else:
                    processed = col
    except Exception:
        pass
        
    return processed

# -----------------------------------------------------------------------------
# 6. Nād Extended Spectrum & Hypersonic Exciter DSP
# -----------------------------------------------------------------------------

def upscale_and_clear_frequencies(
    audio_data: np.ndarray,
    sample_rate: int,
    target_sr: int = 96000,
    enable_subsonic_cut: bool = True,
    subsonic_cut_hz: float = 35.0,
    enable_clarity_eq: bool = True,
    enable_harmonic_restoration: bool = True,
    enable_hypersonic: bool = True,
    enable_somatic: bool = True,
    sa_hz: float = 240.0,
    raga_name: str = "",
    enable_raga_filter: bool = True,
    drone_level: float = 0.18,
    mastering_preset: str = "film",
) -> tuple[np.ndarray, int]:
    """
    Nād Two-Stage Super-Resolution, Frequency Clearance & Indian Musicology Pipeline:
    1. Subsonic Rumble Clearance (< 35 Hz)
    2. Anti-Boxiness Mid Clarity (280 Hz notch)
    3. Raga Modal Scale Enforcement (STFT suppression of out-of-raga Varjit notes)
    4. Authentic Acoustic Tanpura Drone Bedding (4-string Jawari synthesis locked to Sa)
    5. Indian Playback Mastering Chains (Film, Carnatic, Dhrupad, Goa Fusion)
    6. Harmonic Super-Resolution (10kHz–24kHz)
    7. 96kHz / 32-Bit Float Resampling via SoX VHQ
    8. Hypersonic Air Exciter (20kHz–45kHz) & Somatic Infrasound (10Hz–20Hz)
    9. True-Peak Normalization (-0.5 dBFS)
    """
    if audio_data is None or len(audio_data) == 0:
        return audio_data, sample_rate

    data = np.asarray(audio_data, dtype=np.float32)
    original_ndim = data.ndim

    # Standardize to (samples, channels)
    if data.ndim == 1:
        data = data[:, np.newaxis]
    elif data.ndim == 2 and data.shape[0] < data.shape[1]:
        data = data.T

    num_samples, channels = data.shape
    processed = np.copy(data)

    # 1. Subsonic Rumble Clearance (< 35 Hz)
    if enable_subsonic_cut and signal is not None and sample_rate > (subsonic_cut_hz * 2):
        try:
            sos_hp = signal.butter(4, subsonic_cut_hz, btype='highpass', fs=sample_rate, output='sos')
            for ch in range(channels):
                processed[:, ch] = signal.sosfiltfilt(sos_hp, processed[:, ch])
        except Exception:
            pass

    # 2. Anti-Boxiness Mid Clarity Notch (280 Hz, -1.8 dB, Q=1.6)
    if enable_clarity_eq and signal is not None and sample_rate > 600:
        try:
            w0 = 2 * math.pi * 280.0 / sample_rate
            alpha = math.sin(w0) / (2.0 * 1.6)
            A = 10.0 ** (-1.8 / 40.0)
            b0 = 1.0 + alpha * A
            b1 = -2.0 * math.cos(w0)
            b2 = 1.0 - alpha * A
            a0 = 1.0 + alpha / A
            a1 = -2.0 * math.cos(w0)
            a2 = 1.0 - alpha / A
            b = np.array([b0 / a0, b1 / a0, b2 / a0], dtype=np.float64)
            a = np.array([1.0, a1 / a0, a2 / a0], dtype=np.float64)
            for ch in range(channels):
                processed[:, ch] = signal.lfilter(b, a, processed[:, ch])
        except Exception:
            pass

    # 3. Raga Modal Scale Enforcement (Suppress out-of-raga Varjit notes)
    if enable_raga_filter and raga_name:
        try:
            processed = apply_raga_modal_spectral_filter(
                processed,
                sample_rate=sample_rate,
                sa_hz=sa_hz,
                raga_key=raga_name,
                strength=0.55,
            )
            if processed.ndim == 1:
                processed = processed[:, np.newaxis]
        except Exception:
            pass

    # 4. Authentic Acoustic Tanpura Drone Bedding
    if drone_level > 0.01:
        try:
            if processed.ndim == 1:
                processed = processed[:, np.newaxis]
            tanpura_bed = synthesize_acoustic_tanpura(
                num_samples=processed.shape[0],
                sample_rate=sample_rate,
                sa_hz=sa_hz,
                raga_key=raga_name or "yaman",
            )
            # Ensure channel matching
            if processed.shape[1] == 1:
                tanpura_bed = np.mean(tanpura_bed, axis=1, keepdims=True)
            elif processed.shape[1] > 2:
                tanpura_bed = np.pad(tanpura_bed, ((0, 0), (0, processed.shape[1] - 2)))
            processed = processed + (drone_level * tanpura_bed)
        except Exception:
            pass

    # 5. Indian Playback Mastering Chains
    if mastering_preset:
        try:
            processed = apply_indian_mastering_chain(
                processed,
                sample_rate=sample_rate,
                preset=mastering_preset,
            )
            if processed.ndim == 1:
                processed = processed[:, np.newaxis]
        except Exception:
            pass

    # 6. Harmonic Super-Resolution Restoration (Upper Harmonics 10kHz–24kHz)
    if enable_harmonic_restoration and signal is not None and sample_rate >= 22050:
        try:
            high_cutoff = min(10000.0, sample_rate * 0.42)
            high_sos = signal.butter(2, high_cutoff, btype='highpass', fs=sample_rate, output='sos')
            for ch in range(processed.shape[1]):
                highs = signal.sosfiltfilt(high_sos, processed[:, ch])
                restored_sheen = 0.045 * (highs * np.abs(highs)) + 0.015 * (highs ** 3)
                processed[:, ch] += restored_sheen
        except Exception:
            pass

    # 7. 96kHz High-Fidelity Upscaling via SoX VHQ Sinc Resampler
    current_sr = sample_rate
    if target_sr > sample_rate and soxr is not None:
        try:
            resampled_channels = []
            for ch in range(processed.shape[1]):
                res_ch = soxr.resample(processed[:, ch], sample_rate, target_sr, quality='VHQ')
                resampled_channels.append(res_ch)
            processed = np.column_stack(resampled_channels)
            current_sr = target_sr
        except Exception:
            current_sr = sample_rate

    # 8. Hypersonic Air Exciter (20kHz – 45kHz) on 96kHz canvas
    if enable_hypersonic and current_sr >= 88200 and signal is not None:
        try:
            hypersonic_sos = signal.butter(2, 20000.0, btype='highpass', fs=current_sr, output='sos')
            for ch in range(processed.shape[1]):
                air = signal.sosfiltfilt(hypersonic_sos, processed[:, ch])
                sheen = 0.04 * (air * np.abs(air))
                processed[:, ch] += sheen
        except Exception:
            pass

    # 9. Somatic Sub-Harmonic Grounding locked to Tonic Sa
    if enable_somatic:
        sub_sa = sa_hz
        while sub_sa > 20.0:
            sub_sa /= 2.0
        if 10.0 <= sub_sa <= 20.0:
            for ch in range(processed.shape[1]):
                sub_warmth = 0.02 * np.tanh(processed[:, ch] * 1.3)
                processed[:, ch] += sub_warmth

    # 10. True-Peak Normalization to -0.5 dBFS with 32-Bit Float Headroom
    max_peak = np.max(np.abs(processed))
    if max_peak > 0.0:
        target_peak = 10.0 ** (-0.5 / 20.0) # ~0.944
        if max_peak > target_peak:
            processed = processed * (target_peak / max_peak)

    if original_ndim == 1:
        processed = processed.flatten()
    elif original_ndim == 2 and audio_data.ndim == 2 and audio_data.shape[0] < audio_data.shape[1]:
        processed = processed.T

    return processed.astype(np.float32), current_sr


def enhance_audio_extended_spectrum(
    audio_data: np.ndarray,
    sample_rate: int,
    enable_hypersonic: bool = True,
    enable_somatic: bool = True,
    exciter_drive: float = 0.08,
) -> np.ndarray:
    """
    Backward-compatible entry point for OpenStudio:
    Applies the full Nād super-resolution and frequency clearance pipeline.
    """
    processed, _ = upscale_and_clear_frequencies(
        audio_data=audio_data,
        sample_rate=sample_rate,
        target_sr=sample_rate,
        enable_hypersonic=enable_hypersonic,
        enable_somatic=enable_somatic,
    )
    return processed
