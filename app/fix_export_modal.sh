sed -i '' '/programmeName:/d' src/components/ExportModal.tsx
sed -i '' 's/, -14); // Target -14 LUFS for Apple/);/g' src/components/ExportModal.tsx
sed -i '' 's/, -14);//g' src/components/ExportModal.tsx
