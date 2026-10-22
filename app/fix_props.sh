sed -i '' '/busGroups:/a\
  /** Carried into the ADM labels and iXML chunk on export. */\
  ragaName?: string;\
  talaName?: string;\
  baseSaHz?: number;\
' src/components/MasterMixerDrawer.tsx
sed -i '' 's/  busGroups/  busGroups,\n  ragaName,\n  talaName,\n  baseSaHz/' src/components/MasterMixerDrawer.tsx
