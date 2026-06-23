import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');
const uploadHandlerBody = `    try {
      if (!file || !scope) return;

      setAiError('');
      setAiNotice('');

      const validationError = validateAiDocumentFile(file);
      if (validationError) {
        setAiError(validationError);
        return;
      }

      setUploadingScope(scope);

      const uploaded = await uploadAIDocument(file);

      const uploadedRecord: UploadedAIFile = {
        file_id: uploaded.file_id,
        mime_type: uploaded.mime_type,
        expires_at: uploaded.expires_at,
      };

      latestUploadRef.current[String(scope)] = uploadedRecord;
      setUploadedFiles(prev => ({
        ...prev,
        [scope]: uploadedRecord,
      }));

      setUploadingScope(null);
      setAiNotice('Document uploaded. Running AI autofill…');

      if (runAutofill) {
        await runAutofill();
      }
    } catch (err: any) {
      setAiError(err?.message || 'Document upload failed');
    } finally {
      setUploadingScope(null);
    }`;

const files = fs
  .readdirSync(sectionsDir)
  .filter(file => file.startsWith('Section') && file.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  while (content.includes(');: {')) {
    const start = content.indexOf(');: {');
    const searchFrom = start + 5;
    const endMarker = '\n  };\n';
    const end = content.indexOf(endMarker, searchFrom);
    if (end === -1) break;
    content =
      content.slice(0, start + 3) + content.slice(end + endMarker.length - 1);
    changed = true;
  }

  if (
    content.includes('ALLOWED_UPLOAD_TYPES') &&
    content.includes('handleDocumentUpload')
  ) {
    content = content.replace(
      /const handleDocumentUpload = async \([\s\S]*?\) => \{[\s\S]*?finally \{\s*setUploadingScope\(null\);\s*\}\s*\};\n/,
      match => {
        if (match.includes('validateAiDocumentFile')) return match;
        const params = match.match(/async \(([\s\S]*?)\) =>/)[1].trim();
        const signature = params.includes('runAutofill')
          ? params
          : `${params}${params ? ', ' : ''}runAutofill?: () => void | Promise<void>`;
        return `const handleDocumentUpload = async (${signature}) => {\n${uploadHandlerBody}\n  };\n`;
      },
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
}
