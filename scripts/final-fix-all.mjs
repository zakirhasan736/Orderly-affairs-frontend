import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');

const uploadHandler = `const handleDocumentUpload = async (
    file?: File | null,
    scope?: UploadScope,
    runAutofill?: () => void | Promise<void>,
  ) => {
    try {
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
    }
  };`;

function replaceFunction(content, name, replacement) {
  const marker = `const ${name} =`;
  const start = content.indexOf(marker);
  if (start === -1) return content;

  let depth = 0;
  let index = start;
  let started = false;
  while (index < content.length) {
    const char = content[index];
    if (char === '{') {
      depth += 1;
      started = true;
    } else if (char === '}') {
      depth -= 1;
      if (started && depth === 0) {
        index += 1;
        if (content[index] === ';') index += 1;
        break;
      }
    }
    index += 1;
  }

  return content.slice(0, start) + replacement + content.slice(index);
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('renderUploader')) return false;

  const original = content;

  if (!content.includes('SectionAiDocumentUploader')) {
    content = content.replace(
      /import \{ uploadAIDocument \} from '@\/services\/aiDocumentUpload';/,
      `import { uploadAIDocument } from '@/services/aiDocumentUpload';\nimport { SectionAiDocumentUploader } from '@/components/ai/SectionAiDocumentUploader';\nimport {\n  type UploadedAIFile,\n  validateAiDocumentFile,\n} from '@/utils/aiDocumentUploadUi';`,
    );
  }

  if (!content.includes('useRef')) {
    content = content.replace(
      /import React, \{ useState \} from 'react';/,
      "import React, { useRef, useState } from 'react';",
    );
    content = content.replace(
      /import React,\{ useState \} from 'react';/,
      "import React, { useRef, useState } from 'react';",
    );
    content = content.replace(
      /import React, \{([^}]+)\} from 'react';/,
      (match, hooks) =>
        hooks.includes('useRef') ? match : `import React, {${hooks.trim()}, useRef } from 'react';`,
    );
  }

  content = content.replace(/\r?\ntype UploadedAIFile = \{[\s\S]*?\};\r?\n/g, '\n');
  content = content.replace(
    /\r?\nconst ALLOWED_UPLOAD_TYPES = \[[\s\S]*?\];\r?\n\r?\nconst MAX_UPLOAD_SIZE = [\s\S]*?;\r?\n\r?\nconst getReadableFileType = [\s\S]*?\};\r?\n/g,
    '\n',
  );

  if (
    content.includes('latestUploadRef.current') &&
    !content.includes('const latestUploadRef')
  ) {
    content = content.replace(
      /(const \[uploadedFiles, setUploadedFiles\] = useState[\s\S]*?\);\r?\n)/,
      `$1\r\n  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});\r\n`,
    );
  }

  if (
    content.includes('getUploadedFileForScope') &&
    content.includes('uploadedFiles[') &&
    !content.includes('latestUploadRef.current[String')
  ) {
    content = content.replace(
      /const getUploadedFileForScope = \(([^)]*)\) => \{\s*return uploadedFiles\[([^\]]+)\] \|\| null;\s*\};/,
      'const getUploadedFileForScope = ($1) => {\n    return latestUploadRef.current[String($2)] ?? uploadedFiles[$2] ?? null;\n  };',
    );
  }

  if (
    content.includes('handleDocumentUpload') &&
    !content.includes('validateAiDocumentFile')
  ) {
    content = replaceFunction(content, 'handleDocumentUpload', uploadHandler);
  }

  content = content.replace(
    /  \);\s*:\s*\{[\s\S]*?\r?\n  \};\r?\n\r?\n  const /g,
    '  );\n\n  const ',
  );
  content = content.replace(
    /  \};\s*:\s*\{[\s\S]*?\r?\n  \};\r?\n\r?\n  const /g,
    '  };\n\n  const ',
  );
  content = content.replace(
    /  \};\s*:\s*\{[\s\S]*?\r?\n  \};\r?\n\r?\n  return \(/g,
    '  };\n\n  return (',
  );

  content = content.replace(/,, runAutofill/g, ', runAutofill');

  if (content.includes('subsection,')) {
    content = content.replace(
      /scope: UploadScope;\r?\n    title: string;\r?\n    description: string;/,
      'subsection?: SubsectionId;\n    scope: UploadScope;\n    title: string;\n    description: string;',
    );
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

for (const file of fs.readdirSync(sectionsDir)) {
  if (!file.startsWith('Section') || !file.endsWith('.tsx')) continue;
  if (fixFile(path.join(sectionsDir, file))) {
    console.log('Fixed', file);
  }
}
