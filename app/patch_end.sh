sed -i '' '818i\
      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} ragaName={ragaName || "Yaman"} talaName={talaName || "Teental"} baseSaHz={baseSaHz || 138.59} />}\
' src/components/MasterMixerDrawer.tsx
