sed -i '' '/const handleExport = () => { setIsExportModalOpen(true); };/i\
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);\
' src/components/MasterMixerDrawer.tsx
