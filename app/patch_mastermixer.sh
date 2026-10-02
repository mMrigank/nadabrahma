# 1. Imports
sed -i '' 's/import type { AmbisonicOrder, PanningMode/import { ExportModal } from ".\/ExportModal";\nimport type { AmbisonicOrder, PanningMode/' src/components/MasterMixerDrawer.tsx

# 2. State
sed -i '' '/const \[admExporting, setAdmExporting\] = useState(false);/a\
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);\
' src/components/MasterMixerDrawer.tsx

# 3. handleExport replacement
sed -i '' '/const handleExport = (/,/};/c\
  const handleExport = () => { setIsExportModalOpen(true); };\
' src/components/MasterMixerDrawer.tsx

# 4. handleExportAdm replacement (delete it completely as it is unused, wait it might be used! But we replaced it).
# I will just replace onClick calls.
sed -i '' "s/onClick={() => handleExport('.*')}/onClick={() => setIsExportModalOpen(true)}/g" src/components/MasterMixerDrawer.tsx
sed -i '' "s/onClick={handleExportAdm}/onClick={() => setIsExportModalOpen(true)}/g" src/components/MasterMixerDrawer.tsx

