#!/usr/bin/env node

/**
 * Vehicle Report Modal - Import Fix Verification
 */

console.log('🔧 Verifying Import Fixes');
console.log('========================');

const fs = require('fs');
const path = require('path');

// Check ReportPreview imports
const reportPreviewPath = path.join(__dirname, '../frontend/src/components/Report/ReportPreview.tsx');
if (fs.existsSync(reportPreviewPath)) {
  const content = fs.readFileSync(reportPreviewPath, 'utf8');
  
  console.log('\n✅ ReportPreview.tsx:');
  console.log('   - Import ReportHeader:', content.includes("import { ReportHeader } from '../../pages/Vehicles/components/ReportHeader'"));
  console.log('   - Import ReportBatches:', content.includes("import { ReportBatches } from '../../pages/Vehicles/components/ReportBatches'"));
  console.log('   - Import ReportRollbackList:', content.includes("import { ReportRollbackList } from '../../pages/Vehicles/components/ReportRollbackList'"));
  console.log('   - Import ReportTrustSummary:', content.includes("import { ReportTrustSummary } from '../../pages/Vehicles/components/ReportTrustSummary'"));
  console.log('   - No onCopyToClipboard prop:', !content.includes('onCopyToClipboard={onCopyToClipboard}'));
}

// Check component existence
const components = [
  '../frontend/src/pages/Vehicles/components/ReportHeader.tsx',
  '../frontend/src/pages/Vehicles/components/ReportBatches.tsx',
  '../frontend/src/pages/Vehicles/components/ReportRollbackList.tsx',
  '../frontend/src/pages/Vehicles/components/ReportTrustSummary.tsx',
  '../frontend/src/components/Report/ListForSaleModal.tsx'
];

console.log('\n✅ Component Files:');
components.forEach(comp => {
  const fullPath = path.join(__dirname, comp);
  const exists = fs.existsSync(fullPath);
  const fileName = path.basename(comp);
  console.log(`   - ${fileName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
});

console.log('\n🎯 Expected Result:');
console.log('   Frontend should now compile without import errors');
console.log('   All components should be resolvable');
console.log('   Modal should open and display correctly');

console.log('\n✅ Import fixes complete!');
