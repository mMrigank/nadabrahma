sed -i '' '/const \[spatialElevation, setSpatialElevation\] = useState(15);/a\
  const [isBinauralPreview, setIsBinauralPreview] = useState(true);\
' src/components/MasterMixerDrawer.tsx
