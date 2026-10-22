sed -i '' 's/busGroups,/busGroups: ('"'"'Vocals'"'"' | '"'"'Acoustics'"'"' | '"'"'Percussion'"'"' | '"'"'Orchestral'"'"' | '"'"'Cinematic FX'"'"')[];/' src/components/MasterMixerDrawer.tsx
sed -i '' '/ragaName,/d' src/components/MasterMixerDrawer.tsx
sed -i '' '/talaName,/d' src/components/MasterMixerDrawer.tsx
sed -i '' '/baseSaHz: .*/d' src/components/MasterMixerDrawer.tsx
# Import ExportModal
sed -i '' '/import { audioEngine } from "\.\.\/lib\/webAudioEngine";/a\
import { ExportModal } from "./ExportModal";\
import { spatialAudioEngine, SpeakerBedId, AmbisonicOrder, PanningMode } from "../lib/spatialAudioEngine";
' src/components/MasterMixerDrawer.tsx
