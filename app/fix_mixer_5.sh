sed -i '' '/busGroups,/c\
  busGroups: ("Vocals" | "Acoustics" | "Percussion" | "Orchestral" | "Cinematic FX")[];' src/components/MasterMixerDrawer.tsx
sed -i '' '/  ragaName,/d' src/components/MasterMixerDrawer.tsx
sed -i '' '/  talaName,/d' src/components/MasterMixerDrawer.tsx
