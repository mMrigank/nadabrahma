sed -i '' '/<\/div>$/,/^  );/c\
      {isExportModalOpen && (\
        <ExportModal\
          onClose={() => setIsExportModalOpen(false)}\
          ragaName={ragaName || "Yaman"}\
          talaName={talaName || "Teental"}\
          baseSaHz={baseSaHz || 138.59}\
        />\
      )}\
    </div>\
  );\
' src/components/MasterMixerDrawer.tsx
