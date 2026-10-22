sed -i '' 's/const handleExport = (format.*/const handleExport = () => { setIsExportModalOpen(true); };/g' src/components/MasterMixerDrawer.tsx
sed -i '' '/alert(\`Exporting Master/d' src/components/MasterMixerDrawer.tsx
