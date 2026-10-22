import { vbapGains, SPEAKER_BEDS } from './src/lib/spatialAudioEngine';

const pos = { azimuth: 0, elevation: 0, distance: 1 };
const bed = SPEAKER_BEDS["7.1.4"];
console.log(vbapGains(pos, bed));
