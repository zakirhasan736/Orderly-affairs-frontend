import fs from 'fs';
import path from 'path';

const targets = [
  'Section1VitalInformation.tsx',
  'Section12BankingFinancialAccounts.tsx',
  'Section15HealthInformation.tsx',
  'Section16CreditCardsDebt.tsx',
  'Section17FamilyTreasuredConnections.tsx',
  'Section19AssetsValuables.tsx',
  'Section20LegalDocumentsRecords.tsx',
];

const sectionsDir = path.join('src', 'components', 'sections');

const uploadHandler = `const handleDocumentUpload = async (
    file?: File | null,
    scope?: string,
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

for (const file of targets) {
  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('validateAiDocumentFile')) {
    content = content.replace(
      /import \{ uploadAIDocument \} from '@\/services\/aiDocumentUpload';/,
      `import { uploadAIDocument } from '@/services/aiDocumentUpload';\nimport {\n  type UploadedAIFile,\n  validateAiDocumentFile,\n} from '@/utils/aiDocumentUploadUi';\nimport { useAiDocumentDropZone } from '@/hooks/useAiDocumentDropZone';`,
    );
  }

  if (!content.includes('useRef')) {
    content = content.replace(
      /import React, \{ useState \} from 'react';/,
      "import React, { useRef, useState } from 'react';",
    );
    content = content.replace(
      /import React,\{([^}]+)\} from 'react';/,
      'import React, {$1, useRef } from \'react\';',
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

  if (!content.includes('const latestUploadRef')) {
    content = content.replace(
      /(const \[uploadedFiles, setUploadedFiles\] = useState[\s\S]*?\);\r?\n)/,
      `$1\r\n  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});\r\n`,
    );
  }

  content = content.replace(
    /return uploadedFiles\[([^\]]+)\] \|\| null;/g,
    'return latestUploadRef.current[String($1)] ?? uploadedFiles[$1] ?? null;',
  );

  if (!content.includes('validateAiDocumentFile(file)')) {
    content = content.replace(
      /const handleDocumentUpload = async \([\s\S]*?\) => \{[\s\S]*?setAiNotice\('Document uploaded\. You can now use AI autofill\.'\);[\s\S]*?\} finally \{\s*setUploadingScope\(null\);\s*\}\s*\};\r?\n/,
      `${uploadHandler}\r\n`,
    );
  }

  content = content.replace(
    /void handleDocumentUpload\(file, scope\);/g,
    'void handleDocumentUpload(file, scope, onAutofill);',
  );

  content = content.replace(
    /Click to upload/g,
    'Drag and drop or click to upload',
  );

  content = content.replace(
    /(const isReading = aiLoadingScope === scope;\r?\n)/g,
    `$1\r\n    const { isDragging, processFile, dropZoneProps } = useAiDocumentDropZone(\r\n      uploaded => handleDocumentUpload(uploaded, scope, onAutofill),\r\n      isAnyAIActionRunning,\r\n    );\r\n`,
  );

  content = content.replace(
    /(<label\r?\n            className=\{\[\r?\n)/,
    '<label\r\n            {...dropZoneProps}\r\n            className={[\r\n',
  );

  content = content.replace(
    /(isAnyAIActionRunning \? 'pointer-events-none opacity-60' : ''),\r?\n            \]\.join\(' '\)\r?\n          \}\)/,
    "$1,\r\n              isDragging && 'border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-200',\r\n            ].join(' ')\r\n          })}",
  );

  content = content.replace(
    /void handleDocumentUpload\(file, scope, onAutofill\);\r?\n                event\.currentTarget\.value = '';/g,
    "processFile(file);\r\n                event.currentTarget.value = '';",
  );

  fs.writeFileSync(filePath, content);
  console.log('Patched', file);
}
