// ============================================================================
// admBw64Engine.ts — ADM Broadcast Wave (BW64) renderer  [Milestone 25]
// ----------------------------------------------------------------------------
// Renders the spatial scene to a BW64 container carrying an Audio Definition
// Model description (ITU-R BS.2076) so the mix can be delivered to — and
// re-opened by — an Atmos / ADM-aware DAW rather than a plain stereo WAV.
//
// What makes the file "ADM" rather than just "broadcast WAV" is two extra
// chunks alongside the ones StemForge already writes:
//
//   RIFF/BW64
//     ds64  64-bit sizes (BW64 replaces WAVE's 32-bit size fields)
//     axml  the ADM XML — programme → content → object → trackUID → formats
//     chna  per-channel → audioTrackUID map, so channel N of the PCM data
//           can be tied back to a described object
//     fmt   32-bit float PCM
//     bext  broadcast extension, incl. EBU R128 loudness fields
//     iXML  the musicology payload (raga / tala / Sa)
//     data  interleaved float32
//
// The XML is generated from the *actual* spatial state: speaker azimuths and
// elevations come from `SPEAKER_BEDS`, so the described bed always matches the
// bed the renderer panned into.
//
// Two conventions are worth stating outright, because getting either wrong
// produces a file that imports without complaint and images incorrectly:
//
//   • ADM azimuth is positive to the LEFT; this engine's is positive to the
//     RIGHT. Every position is negated on the way out (see `toAdmPosition`).
//   • ADM `audioTrackUID` elements are keyed by a `UID` attribute, not an
//     `audioTrackUID` one, and the UID string is 12 characters — which is
//     exactly the `ATU_00000001` form used here.
// ============================================================================

import { stemForgeEngine, type BroadcastWavMetadata } from './stemForgeEngine';
import { calculateLoudnessTelemetry, type AudioLoudness } from './webAudioEngine';
import {
  spatialAudioEngine,
  SPEAKER_BEDS,
  encodeAmbisonic,
  decodeAmbisonicToBed,
  vbapGains,
  type AmbisonicOrder,
  type PanningMode,
  type SphericalPosition,
  type SpeakerBedId,
  type SpeakerDef
} from './spatialAudioEngine';

const ADM_NAMESPACE = 'http://www.itu.int/BS.2076-0';
const ADM_NAMESPACE_XSI = 'http://www.w3.org/2001/XMLSchema-instance';

/**
 * Channel format IDs. The four- and six-channel beds use the registered EBU
 * Tech 3364 Common Definitions IDs, so a decoder can interpret them without
 * reading our format definitions. The height layer of a 7.1.4 bed has no
 * common ID, so those are locally allocated under `AC_000110xx` and carry an
 * explicit `<position>` block instead.
 */
const CHANNEL_FORMAT_IDS: Record<string, string> = {
  L: 'AC_00010001',
  R: 'AC_00010002',
  C: 'AC_00010003',
  LFE: 'AC_00010004',
  Ls: 'AC_00010005',
  Rs: 'AC_00010006',
  Lss: 'AC_00011001',
  Rss: 'AC_00011002',
  Lrs: 'AC_00011003',
  Rrs: 'AC_00011004',
  Ltf: 'AC_00011005',
  Rtf: 'AC_00011006',
  Ltr: 'AC_00011007',
  Rtr: 'AC_00011008'
};

/** Pack format IDs: registered where one exists, locally allocated otherwise. */
const PACK_FORMAT_IDS: Record<SpeakerBedId, string> = {
  stereo: 'AP_00010002',
  '5.1': 'AP_00010003',
  quad: 'AP_00011001',
  '7.1.4': 'AP_00011002'
};

// Program-level ADM identifiers. These are file-local, so the `10xx` range is
// free for our use.
const PROGRAMME_ID = 'APR_1001';
const CONTENT_ID = 'ACO_1001';
const OBJECT_ID = 'AO_1001';
const STREAM_FORMAT_ID = 'AS_00010001';

/** ADM track UIDs are exactly 12 characters, which `ATU_` + 8 digits fits. */
export function trackUidFor(channelIndex: number): string {
  return `ATU_${String(channelIndex + 1).padStart(8, '0')}`;
}

export function trackFormatIdFor(channelIndex: number): string {
  return `AT_00011001_${String(channelIndex + 1).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

// Built by concatenation rather than written as literals: an XML escaper that
// has been entity-decoded is a silent no-op, and silence here means a raga name
// containing "&" produces a malformed axml chunk that only fails on import.
const XML_ESCAPES: Record<string, string> = {
  '&': '&' + 'amp;',
  '<': '&' + 'lt;',
  '>': '&' + 'gt;',
  '"': '&' + 'quot;',
  "'": '&' + 'apos;'
};

export function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

/**
 * Converts an engine position to ADM's convention: azimuth negated (ADM is
 * positive-to-the-left), elevation and distance unchanged.
 */
export function toAdmPosition(speaker: Pick<SpeakerDef, 'azimuth' | 'elevation'>): {
  azimuth: number;
  elevation: number;
} {
  return { azimuth: -speaker.azimuth, elevation: speaker.elevation };
}

function channelFormatXml(speaker: SpeakerDef, fallbackIndex: number): string {
  const id = CHANNEL_FORMAT_IDS[speaker.id] ?? `AC_000120${String(fallbackIndex).padStart(2, '0')}`;
  const pos = toAdmPosition(speaker);
  const az = Math.round(pos.azimuth * 1000) / 1000;
  const el = Math.round(pos.elevation * 1000) / 1000;

  // LFE carries no direction, so it is described by bandwidth instead of by a
  // position — emitting an azimuth for it would be a lie the decoder believes.
  const positionBlock = speaker.isLfe
    ? `      <frequency>
        <lowPass>120</lowPass>
      </frequency>`
    : `      <position>
        <azimuth>${az}</azimuth>
        <elevation>${el}</elevation>
      </position>`;

  return `  <audioChannelFormat audioChannelFormatID="${id}" type="DirectSpeakers">
    <audioChannelFormatName>${xmlEscape(speaker.label)}</audioChannelFormatName>
    <typeLabel language="en">0001</typeLabel>
    <audioChannelFormatChannel channel="1">
      <label>${xmlEscape(speaker.id)}</label>
${positionBlock}
    </audioChannelFormatChannel>
  </audioChannelFormat>`;
}

export interface AdmMetadata extends BroadcastWavMetadata {
  /** Overrides the derived programme name. */
  programmeName?: string;
  contentName?: string;
  objectName?: string;
}

/**
 * Builds the ADM XML. Structure follows BS.2076:
 *
 *   audioProgramme → audioContent → audioObject → audioTrackUID
 *                                        ↓                ↓
 *                                  audioPackFormat  audioTrackFormat
 *                                        ↓                ↓
 *                                  audioChannelFormat  audioStreamFormat
 *
 * One audioTrackUID is emitted per PCM channel, which is what lets the `chna`
 * chunk map track *n* to a described object.
 */
export function buildAdmXml(
  bedId: SpeakerBedId,
  metadata: AdmMetadata,
  sampleRate: number
): string {
  const bed = SPEAKER_BEDS[bedId];
  const packId = PACK_FORMAT_IDS[bedId];

  const channelFormats = bed.speakers.map((s, i) => channelFormatXml(s, i)).join('\n');

  const packChannelRefs = bed.speakers
    .map((s, i) => {
      const id = CHANNEL_FORMAT_IDS[s.id] ?? `AC_000120${String(i).padStart(2, '0')}`;
      return `    <audioChannelFormatIDRef>${id}</audioChannelFormatIDRef>`;
    })
    .join('\n');

  const trackUids = bed.speakers
    .map((s, i) => {
      const id = CHANNEL_FORMAT_IDS[s.id] ?? `AC_000120${String(i).padStart(2, '0')}`;
      return `  <audioTrackUID UID="${trackUidFor(i)}">
    <audioChannelFormatIDRef>${id}</audioChannelFormatIDRef>
    <audioPackFormatIDRef>${packId}</audioPackFormatIDRef>
    <audioTrackFormatIDRef>${trackFormatIdFor(i)}</audioTrackFormatIDRef>
  </audioTrackUID>`;
    })
    .join('\n');

  const trackFormats = bed.speakers
    .map(
      (_s, i) => `  <audioTrackFormat audioTrackFormatID="${trackFormatIdFor(i)}" type="PCM">
    <audioTrackFormatName>PCM</audioTrackFormatName>
    <formatLabel>0001</formatLabel>
    <audioStreamFormatIDRef>${STREAM_FORMAT_ID}</audioStreamFormatIDRef>
  </audioTrackFormat>`
    )
    .join('\n');

  const trackUidRefs = bed.speakers
    .map((_s, i) => `    <audioTrackUIDReference UID="${trackUidFor(i)}"/>`)
    .join('\n');

  // Musicology travels as ADM labels so it survives a round trip through a
  // renderer that knows nothing about ragas.
  const labels: string[] = [];
  if (metadata.ragaName) labels.push(`    <label language="en">Raga: ${xmlEscape(metadata.ragaName)}</label>`);
  if (metadata.talaName) labels.push(`    <label language="en">Tala: ${xmlEscape(metadata.talaName)}</label>`);
  if (metadata.moveableSaHz !== undefined) {
    labels.push(`    <label language="en">Sa: ${metadata.moveableSaHz.toFixed(2)} Hz</label>`);
  }
  if (metadata.vedicChhanda) {
    labels.push(`    <label language="en">Chhandas: ${xmlEscape(metadata.vedicChhanda)}</label>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<adm:ADM xmlns:adm="${ADM_NAMESPACE}" xmlns:xsi="${ADM_NAMESPACE_XSI}">
  <audioProgramme audioProgrammeID="${PROGRAMME_ID}">
    <audioProgrammeName>${xmlEscape(metadata.programmeName ?? 'Nādabrahma Mix')}</audioProgrammeName>
${labels.join('\n')}
    <audioContentIDRef>${CONTENT_ID}</audioContentIDRef>
  </audioProgramme>

  <audioContent audioContentID="${CONTENT_ID}">
    <audioContentName>${xmlEscape(metadata.contentName ?? 'Nādabrahma Content')}</audioContentName>
    <audioObjectIDRef>${OBJECT_ID}</audioObjectIDRef>
  </audioContent>

  <audioObject audioObjectID="${OBJECT_ID}">
    <audioObjectName>${xmlEscape(metadata.objectName ?? `Nādabrahma ${bed.label} Bed`)}</audioObjectName>
    <audioPackFormatIDRef>${packId}</audioPackFormatIDRef>
${trackUidRefs}
  </audioObject>

  <audioPackFormat audioPackFormatID="${packId}" type="DirectSpeakers">
    <audioPackFormatName>${xmlEscape(bed.label)}</audioPackFormatName>
    <typeLabel language="en">0001</typeLabel>
    <audioChannelFormatIDRefs>
${packChannelRefs}
    </audioChannelFormatIDRefs>
  </audioPackFormat>

  <audioStreamFormat audioStreamFormatID="${STREAM_FORMAT_ID}" type="PCM">
    <audioStreamFormatName>PCM</audioStreamFormatName>
    <formatLabel>0001</formatLabel>
    <audioChannelFormatIDRef>${CHANNEL_FORMAT_IDS[bed.speakers[0].id] ?? 'AC_00012000'}</audioChannelFormatIDRef>
    <audioTrackFormatIDRef>${trackFormatIdFor(0)}</audioTrackFormatIDRef>
  </audioStreamFormat>

${channelFormats}

${trackFormats}

${trackUids}
</adm:ADM>`;
}

// ---------------------------------------------------------------------------
// Binary writers
// ---------------------------------------------------------------------------

const ASCII = (s: string): Uint8Array => {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
};

const UTF8 = (s: string): Uint8Array => new TextEncoder().encode(s);

/** RIFF chunks are padded to an even byte count; the pad is not counted. */
const paddedLength = (n: number): number => (n % 2 === 0 ? n : n + 1);

/**
 * The 602-byte fixed `bext` payload (EBU Tech 3285 v2). Field offsets are
 * written explicitly rather than sequentially: the reserved run before the
 * coding history is 180 bytes, and a sequential writer that loses track of it
 * silently produces a bext that every reader disagrees about.
 */
function buildBext(
  description: string,
  originator: string,
  sampleRate: number,
  bitDepth: number,
  channelCount: number,
  codingHistory: string,
  loudness?: AudioLoudness
): Uint8Array {
  const FIXED = 602;
  const coding = ASCII(codingHistory);
  const bytes = new Uint8Array(FIXED + coding.length);
  const view = new DataView(bytes.buffer);

  const putAscii = (value: string, offset: number, max: number) => {
    const b = ASCII(value.slice(0, max));
    bytes.set(b, offset);
  };

  const now = new Date();
  const pad2 = (n: number) => String(n).padStart(2, '0');

  putAscii(description, 0, 256);
  putAscii(originator, 256, 32);
  putAscii('', 288, 32);
  putAscii(
    `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}-${pad2(now.getUTCDate())}`,
    320,
    10
  );
  putAscii(
    `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())}`,
    330,
    8
  );

  // TimeReference (338) — sample count since midnight, left at zero.
  view.setUint32(338, 0, true);
  view.setUint32(342, 0, true);
  // Version (346) = 2: this bext carries the R128 loudness fields.
  view.setUint16(346, 2, true);
  // UMID (348..412) left zeroed.

  // Loudness fields, all int16 in units of 0.01.
  if (loudness) {
    const setLoudnessField = (offset: number, value: number) => {
      if (!Number.isFinite(value)) return;
      const scaled = Math.round(value * 100);
      view.setInt16(offset, Math.max(-32768, Math.min(32767, scaled)), true);
    };
    setLoudnessField(412, loudness.integratedLufs);      // LoudnessValue
    setLoudnessField(414, loudness.dynamicRangeLu);      // LoudnessRange
    setLoudnessField(416, loudness.truePeakDbtp);        // MaxTruePeakLevel
    setLoudnessField(418, loudness.momentaryLufs);       // MaxMomentaryLoudness
    setLoudnessField(420, loudness.shortTermLufs);       // MaxShortTermLoudness
  }

  bytes.set(coding, FIXED);
  return bytes;
}

/**
 * The `chna` chunk: for each PCM channel, which audioTrackUID it carries.
 *
 *   uint16 numTracks
 *   uint16 numUids                       — total AudioId records that follow
 *   repeat numUids:
 *     uint16 trackIndex                  — 1-based, must not be zero
 *     char[12] uid
 *     char[14] trackRef                  — non-standard track format ref
 *     char[11] packRef                   — non-standard pack format ref
 *     char[1]  padding
 */
export function buildChna(bedId: SpeakerBedId): Uint8Array {
  const bed = SPEAKER_BEDS[bedId];
  const RECORD = 40;
  const numTracks = bed.speakers.length;
  const numUids = numTracks;

  const bytes = new Uint8Array(4 + numUids * RECORD);
  const view = new DataView(bytes.buffer);

  view.setUint16(0, numTracks, true);
  view.setUint16(2, numUids, true);

  for (let i = 0; i < numUids; i++) {
    const base = 4 + i * RECORD;
    view.setUint16(base, i + 1, true); // 1-based track index
    bytes.set(ASCII(trackUidFor(i)), base + 2);
    // trackRef / packRef stay zero: these beds are described in full inside the
    // axml, so no external non-standard format reference is being made.
    bytes[base + RECORD - 1] = 0x20; // padding byte
  }

  return bytes;
}

export interface AdmRenderOptions {
  /** Bed to describe. Defaults to whatever the spatial engine currently has. */
  bedId?: SpeakerBedId;
  metadata?: AdmMetadata;
  /** Loudness telemetry written into the bext R128 fields. */
  loudness?: AudioLoudness;
  /** Emit the axml/chna chunks. Off produces a plain (but still BW64) master. */
  includeAdm?: boolean;
}

export interface AdmRenderResult {
  blob: Blob;
  bedId: SpeakerBedId;
  channels: number;
  trackUids: string[];
  xml: string;
}

// ---------------------------------------------------------------------------
// Offline bed render
// ---------------------------------------------------------------------------

export interface AdmRenderSource {
  id: string;
  label: string;
  position: SphericalPosition;
  /** Linear gain, matching SpatialSource.gain. */
  gain: number;
  freqHz: number;
  /**
   * Panning law for this source. Mirrors SpatialSource.mode so the offline
   * render spreads energy the same way the live graph does — an ambisonic
   * object legitimately lights many speakers, a VBAP one only its neighbours.
   */
  mode?: PanningMode;
  muted?: boolean;
  soloed?: boolean;
}

export interface OfflineBedRenderOptions {
  bedId?: SpeakerBedId;
  durationSec?: number;
  sampleRate?: number;
  /** Ambisonic encode order; the bed decode follows it. */
  order?: AmbisonicOrder;
  maxRe?: boolean;
}

/**
 * Renders sources into the real speaker bed offline.
 *
 * Each source is synthesised once and then fed to every bed channel through the
 * gain the panner computed for it, so the resulting N-channel buffer *is* the
 * spatialisation — the ADM description written alongside it then describes, one
 * for one, the channels that actually carry signal.
 *
 * The same gains the live graph uses come from `vbapGains` /
 * `decodeAmbisonicToBed`, so an offline render matches what is heard.
 */
export async function renderBedOffline(
  sources: AdmRenderSource[],
  options: OfflineBedRenderOptions = {}
): Promise<{ buffer: AudioBuffer; bedId: SpeakerBedId }> {
  const bedId = options.bedId ?? spatialAudioEngine.bedId;
  const bed = SPEAKER_BEDS[bedId];
  const sampleRate = options.sampleRate ?? 96000;
  const durationSec = options.durationSec ?? 4;
  const order = options.order ?? 1;
  const maxRe = options.maxRe ?? true;

  const channels = bed.speakers.length;
  const frames = Math.max(1, Math.round(durationSec * sampleRate));

  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  const ctx = new OfflineCtx(channels, frames, sampleRate);

  const merger = ctx.createChannelMerger(channels);
  merger.connect(ctx.destination);

  // Soloing anywhere mutes everything not soloed — same rule as the live graph.
  const anySolo = sources.some((s) => s.soloed);

  for (const src of sources) {
    if (src.muted) continue;
    if (anySolo && !src.soloed) continue;

    // Dispatch on the source's own panning mode, mirroring the live graph's
    // computeBedGains() so an offline delivery matches the monitored mix.
    const mode = src.mode ?? 'hrtf';
    const gains =
      mode === 'ambisonic'
        ? decodeAmbisonicToBed(encodeAmbisonic(order, src.position), order, bed, maxRe)
        : vbapGains(src.position, bed);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(src.freqHz, 0);

    const env = ctx.createGain();
    // Short fades so the render does not begin or end on a discontinuity.
    const attack = Math.min(0.05, durationSec * 0.1);
    const release = Math.min(0.25, durationSec * 0.25);
    env.gain.setValueAtTime(0.0001, 0);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, src.gain), attack);
    env.gain.setValueAtTime(Math.max(0.0001, src.gain), Math.max(attack, durationSec - release));
    env.gain.exponentialRampToValueAtTime(0.0001, durationSec);

    osc.connect(env);

    for (let c = 0; c < channels; c++) {
      const g = gains[c];
      if (!g || g < 1e-4) continue;
      const chGain = ctx.createGain();
      chGain.gain.setValueAtTime(g, 0);
      env.connect(chGain);
      chGain.connect(merger, 0, c);
    }

    osc.start(0);
    osc.stop(durationSec);
  }

  const buffer = await ctx.startRendering();
  return { buffer, bedId };
}

/** Convenience: render whatever the spatial engine currently holds. */
export async function renderSpatialSceneOffline(
  options: OfflineBedRenderOptions = {}
): Promise<{ buffer: AudioBuffer; bedId: SpeakerBedId }> {
  const sources: AdmRenderSource[] = spatialAudioEngine.listSources().map((s, i) => ({
    id: s.id,
    label: s.label,
    position: s.position,
    gain: s.gain,
    mode: s.mode,
    // Sources carry no timbre of their own in the engine; the audition pitch is
    // stepped across the scene so distinct objects stay distinguishable.
    freqHz: 220 * Math.pow(2, i / 12),
    muted: s.muted,
    soloed: s.soloed
  }));

  return renderBedOffline(sources, options);
}

export class AdmBw64Engine {
  /**
   * Writes a 32-bit float BW64 file, with ADM description when `includeAdm` is
   * set. Shares the RIFF/`bext`/`iXML` conventions with StemForge's
   * `createBroadcastWavBuffer`, but the container is BW64 (`ds64`) because a
   * 96 kHz float render of a long session does not fit WAVE's 32-bit sizes.
   */
  public createAdmBw64Buffer(
    audio: AudioBuffer,
    options: AdmRenderOptions = {}
  ): AdmRenderResult {
    const bedId = options.bedId ?? spatialAudioEngine.bedId;
    const metadata = options.metadata ?? {};
    const includeAdm = options.includeAdm ?? true;

    const numChannels = audio.numberOfChannels;
    const sampleRate = audio.sampleRate;
    const frames = audio.length;
    const bitDepth = 32;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataBytes = frames * blockAlign;

    // Interleave planar → packed float32.
    const interleaved = new Float32Array(frames * numChannels);
    for (let ch = 0; ch < numChannels; ch++) {
      const data = audio.getChannelData(ch);
      for (let i = 0; i < frames; i++) interleaved[i * numChannels + ch] = data[i];
    }

    const xml = includeAdm ? buildAdmXml(bedId, metadata, sampleRate) : '';
    const xmlBytes = UTF8(xml);
    const chnaBytes = includeAdm ? buildChna(bedId) : new Uint8Array(0);

    // ── iXML: the musicology payload, unchanged from StemForge's master ──
    const ix = metadata;
    const ixmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<BWFXML>
  <PROJECT>Nadabrahma</PROJECT>
  <NOTE>${sampleRate / 1000}kHz 32-bit float master</NOTE>
  <RAGA>${xmlEscape(ix.ragaName ?? '')}</RAGA>
  <THAAT>${xmlEscape(ix.thaat ?? '')}</THAAT>
  <VADI>${xmlEscape(ix.vadi ?? '')}</VADI>
  <SAMVADI>${xmlEscape(ix.samvadi ?? '')}</SAMVADI>
  <WESTERNMODE>${xmlEscape(ix.westernMode ?? '')}</WESTERNMODE>
  <ADHARA_SHADJA_HZ>${ix.moveableSaHz?.toFixed(2) ?? ''}</ADHARA_SHADJA_HZ>
  <TUNING>${xmlEscape(ix.shrutiTuning ?? '22 Shrutis Just Intonation')}</TUNING>
  <TALA>${xmlEscape(ix.talaName ?? '')}</TALA>
  <MATRAS>${ix.matras ?? ''}</MATRAS>
  <CHHANDAS>${xmlEscape(ix.vedicChhanda ?? '')}</CHHANDAS>
  <DSP_HYPERSONIC_AIR>${ix.hypersonicAir ? 'ON' : 'OFF'}</DSP_HYPERSONIC_AIR>
  <DSP_SOMATIC_SUB>${ix.somaticSub ? 'ON' : 'OFF'}</DSP_SOMATIC_SUB>
</BWFXML>`;
    const ixmlBytes = UTF8(ixmlBody);

    const bextBytes = buildBext(
      'Nadabrahma ADM Master',
      ix.originator ?? 'Nadabrahma Universal Audio Workshop',
      sampleRate,
      bitDepth,
      numChannels,
      `A=PCM,F=${sampleRate},W=${bitDepth},M=${numChannels === 1 ? 'mono' : numChannels === 2 ? 'stereo' : `${numChannels}ch`},T=IEEE_FLOAT`,
      options.loudness
    );

    // ── Chunk sizes (each includes its own 8-byte header) ──
    const DS64_FIXED = 28; // riffSize(8) + dataSize(8) + sampleCount(8) + tableLength(4)
    const ds64Payload = DS64_FIXED + 12; // one table entry for 'data'
    const fmtPayload = 16;
    const axmlPayload = paddedLength(xmlBytes.length);
    const ixmlPayload = paddedLength(ixmlBytes.length);
    const bextPayload = paddedLength(bextBytes.length);
    const dataPayload = paddedLength(dataBytes);

    const bodySize =
      4 + // 'BW64' form type
      (8 + ds64Payload) +
      (includeAdm ? 8 + axmlPayload + 8 + chnaBytes.length : 0) +
      (8 + fmtPayload) +
      (8 + bextPayload) +
      (8 + ixmlPayload) +
      (8 + dataPayload);

    const totalSize = 8 + bodySize; // 'RIFF' + size field + body

    const out = new Uint8Array(totalSize);
    const view = new DataView(out.buffer);
    let offset = 0;

    const writeTag = (tag: string) => {
      out.set(ASCII(tag), offset);
      offset += 4;
    };
    const writeU32 = (v: number) => {
      view.setUint32(offset, v, true);
      offset += 4;
    };
    const writeU16 = (v: number) => {
      view.setUint16(offset, v, true);
      offset += 2;
    };
    const writeU64 = (v: bigint) => {
      view.setBigUint64(offset, v, true);
      offset += 8;
    };
    /** Writes a payload and its even-byte pad. */
    const writePayload = (bytes: Uint8Array, payloadLength: number) => {
      out.set(bytes, offset);
      offset += bytes.length;
      if (payloadLength > bytes.length) {
        out[offset] = 0;
        offset += payloadLength - bytes.length;
      }
    };
    /** A chunk whose declared size may be overridden (the RF64-size trick). */
    const writeChunkHeader = (tag: string, declaredSize: number) => {
      writeTag(tag);
      writeU32(declaredSize);
    };

    writeTag('RIFF');
    writeU32(bodySize);
    writeTag('BW64');

    // ── ds64 ──
    writeChunkHeader('ds64', ds64Payload);
    writeU64(BigInt(totalSize - 8)); // riffSize
    writeU64(BigInt(dataBytes));     // dataSize
    writeU64(BigInt(frames));        // sampleCount
    writeU32(1);                     // tableLength
    writeTag('data');
    writeU64(BigInt(dataBytes));

    // ── axml ──
    if (includeAdm) {
      writeChunkHeader('axml', axmlPayload);
      writePayload(xmlBytes, axmlPayload);

      // ── chna ──
      writeChunkHeader('chna', chnaBytes.length);
      writePayload(chnaBytes, chnaBytes.length);
    }

    // ── fmt ──
    writeChunkHeader('fmt ', fmtPayload);
    writeU16(3);                        // IEEE float
    writeU16(numChannels);
    writeU32(sampleRate);
    writeU32(sampleRate * blockAlign);  // byte rate
    writeU16(blockAlign);
    writeU16(bitDepth);

    // ── bext ──
    writeChunkHeader('bext', bextPayload);
    writePayload(bextBytes, bextPayload);

    // ── iXML ──
    writeChunkHeader('iXML', ixmlPayload);
    writePayload(ixmlBytes, ixmlPayload);

    // ── data ──
    const dataDeclared =
      dataBytes <= 0xffffffff ? dataBytes : 0xffffffff;
    writeChunkHeader('data', dataDeclared);
    for (let i = 0; i < interleaved.length; i++) {
      view.setFloat32(offset, interleaved[i], true);
      offset += 4;
    }
    if (dataPayload > dataBytes) {
      out[offset] = 0;
      offset += dataPayload - dataBytes;
    }

    return {
      blob: new Blob([out], { type: 'audio/x-bw64' }),
      bedId,
      channels: numChannels,
      trackUids: includeAdm
        ? SPEAKER_BEDS[bedId].speakers.map((_s, i) => trackUidFor(i))
        : [],
      xml
    };
  }

  /** Renders and downloads. Returns the filename used. */
  public exportAdmBw64(
    audio: AudioBuffer,
    filename: string,
    options: AdmRenderOptions = {}
  ): { filename: string; result: AdmRenderResult } {
    const result = this.createAdmBw64Buffer(audio, options);
    const name = filename.endsWith('.bw64') ? filename : `${filename}.bw64`;
    stemForgeEngine.downloadBlob(result.blob, name);
    return { filename: name, result };
  }

  /**
   * Full delivery path: render the live spatial scene into the current bed,
   * then write it out as an ADM BW64.
   */
  public async exportSceneAsAdm(
    filename: string,
    render: OfflineBedRenderOptions = {},
    metadata: AdmMetadata = {}
  ): Promise<{ filename: string; result: AdmRenderResult; bedId: SpeakerBedId }> {
    const { buffer, bedId } = await renderSpatialSceneOffline(render);
    const loudness = calculateLoudnessTelemetry(buffer);
    const { filename: name, result } = this.exportAdmBw64(buffer, filename, {
      bedId,
      metadata,
      loudness
    });
    return { filename: name, result, bedId };
  }
}

export const admBw64Engine = new AdmBw64Engine();
