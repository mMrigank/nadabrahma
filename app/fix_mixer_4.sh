sed -i '' 's/busGroups: (.*)\[\];/busGroups,/' src/components/MasterMixerDrawer.tsx
sed -i '' '/busGroups,/a\
  ragaName,\
  talaName,' src/components/MasterMixerDrawer.tsx
