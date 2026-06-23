import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');
const files = fs
  .readdirSync(sectionsDir)
  .filter(file => file.startsWith('Section') && file.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(/,, runAutofill/g, ', runAutofill');
  content = content.replace(
    /  \);\s*:\s*\{[\s\S]*?\r?\n  \};\r?\n\r?\n  const /g,
    '  );\n\n  const ',
  );
  content = content.replace(
    /  \};\s*:\s*\{[\s\S]*?\r?\n  \};\r?\n\r?\n  const /g,
    '  };\n\n  const ',
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Cleaned', file);
  }
}
