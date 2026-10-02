sed -i '' "s/onClick={() => handleExport('.*')}/onClick={() => setIsExportModalOpen(true)}/g" src/components/MasterMixerDrawer.tsx
sed -i '' "s/onClick={handleExportAdm}/onClick={() => setIsExportModalOpen(true)}/g" src/components/MasterMixerDrawer.tsx
