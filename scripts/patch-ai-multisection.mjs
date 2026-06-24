import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');
const files = fs
  .readdirSync(sectionsDir)
  .filter(file => file.startsWith('Section') && file.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('runAiSectionAutofill')) continue;

  content = content.replace(
    /onMismatch: error =>\s*aiRouting\?\.handleMismatch\(error\.detail, \{[\s\S]*?\}\),\s*/g,
    '',
  );

  content = content.replace(
    /if \(!json\) return;\s*\r?\n\s*aiRouting\?\.clearPendingUpload\(\);/g,
    'if (!json) return;',
  );

  content = content.replace(
    /(file_id: uploadedFile\.file_id,)\s*\r?\n(\s*)(subsection:|uploadScope:)/g,
    '$1\n$2mime_type: uploadedFile.mime_type,\n$2$3',
  );

  if (!content.includes('aiRouting,')) {
    content = content.replace(
      /uploadScope: String\(scope\),\s*\r?\n(\s*)\}\);/g,
      "uploadScope: String(scope),\n$1aiRouting,\n$1});",
    );

    content = content.replace(
      /uploadScope: String\(scope\),\s*\r?\n(\s*)\}\);/g,
      "uploadScope: String(scope),\n$1aiRouting,\n$1});",
    );
  }

  fs.writeFileSync(filePath, content);
  console.log('Updated', file);
}
