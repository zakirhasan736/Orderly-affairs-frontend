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

const newUploadCore = `      const validationError = validateAiDocumentFile(file);
      if (validationError) {
        setAiError(validationError);
        return;
      }

      setUploadingScope(scope as UploadScope);

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
      }`;

for (const file of targets) {
  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (!content.includes('validateAiDocumentFile')) {
    content = content.replace(
      /import \{ uploadAIDocument \} from '@\/services\/aiDocumentUpload';/,
      `import { uploadAIDocument } from '@/services/aiDocumentUpload';\nimport {\n  type UploadedAIFile,\n  validateAiDocumentFile,\n} from '@/utils/aiDocumentUploadUi';\nimport { useAiDocumentDropZone } from '@/hooks/useAiDocumentDropZone';`,
    );
    changed = true;
  }

  if (!content.includes('useRef')) {
    content = content.replace(
      /import React, \{ useState \} from 'react';/,
      "import React, { useRef, useState } from 'react';",
    );
    content = content.replace(
      /import React, \{([^}]+)\} from 'react';/,
      (match, hooks) =>
        hooks.includes('useRef') ? match : `import React, {${hooks.trim()}, useRef } from 'react';`,
    );
    changed = true;
  }

  if (!content.includes('const latestUploadRef')) {
    content = content.replace(
      /(const \[uploadedFiles, setUploadedFiles\] = useState[\s\S]*?\);\r?\n)/,
      `$1\r\n  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});\r\n`,
    );
    changed = true;
  }

  if (content.includes('return uploadedFiles[') && !content.includes('latestUploadRef.current')) {
    content = content.replace(
      /return uploadedFiles\[([^\]]+)\] \|\| null;/g,
      'return latestUploadRef.current[String($1)] ?? uploadedFiles[$1] ?? null;',
    );
    changed = true;
  }

  if (content.includes('ALLOWED_UPLOAD_TYPES.includes(file.type)')) {
    content = content.replace(
      /if \(!ALLOWED_UPLOAD_TYPES\.includes\(file\.type\)\) \{[\s\S]*?\}\r?\n\r?\n      if \(file\.size > MAX_UPLOAD_SIZE\) \{[\s\S]*?\}\r?\n\r?\n      setUploadingScope\(scope\);\r?\n\r?\n      const uploaded = await uploadAIDocument\(file\);\r?\n\r?\n      setUploadedFiles\(prev => \(\{[\s\S]*?\}\)\);\r?\n\r?\n      setAiNotice\('Document uploaded\. You can now use AI autofill\.'\);/,
      newUploadCore,
    );

    content = content.replace(
      /const handleDocumentUpload = async \(([\s\S]*?)\) => \{/,
      (match, params) => {
        if (params.includes('runAutofill')) return match;
        const trimmed = params.trim();
        return `const handleDocumentUpload = async (${trimmed}${trimmed ? ', ' : ''}runAutofill?: () => void | Promise<void>) => {`;
      },
    );
    changed = true;
  }

  if (content.includes('void handleDocumentUpload(file, scope);')) {
    content = content.replace(
      /void handleDocumentUpload\(file, scope\);/g,
      'void handleDocumentUpload(file, scope, onAutofill);',
    );
    changed = true;
  }

  if (
    content.includes('const isReading = aiLoadingScope === scope;') &&
    !content.includes('useAiDocumentDropZone(')
  ) {
    content = content.replace(
      /const isReading = aiLoadingScope === scope;\r?\n/,
      `const isReading = aiLoadingScope === scope;\r\n    const { isDragging, processFile, dropZoneProps } = useAiDocumentDropZone(\r\n      uploaded => handleDocumentUpload(uploaded, scope, onAutofill),\r\n      isAnyAIActionRunning,\r\n    );\r\n`,
    );

    content = content.replace(
      /<label\r?\n            className=\{\[/,
      '<label\r\n            {...dropZoneProps}\r\n            className={[',
    );

    content = content.replace(
      /isAnyAIActionRunning \? 'pointer-events-none opacity-60' : '',\r?\n            \]\.join\(' '\)\r?\n          \}\)/,
      "isAnyAIActionRunning ? 'pointer-events-none opacity-60' : '',\r\n              isDragging && 'border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-200',\r\n            ].join(' ')\r\n          })}",
    );

    content = content.replace(
      /void handleDocumentUpload\(file, scope, onAutofill\);\r?\n                event\.currentTarget\.value = '';/g,
      "processFile(file);\r\n                event.currentTarget.value = '';",
    );

    content = content.replace(/Click to upload/g, 'Drag and drop or click to upload');
    changed = true;
  }

  if (file === 'Section1VitalInformation.tsx' && !content.includes('normalizeActiveSubsection')) {
    content = content.replace(
      /type NormalizedActiveSubsection = Section1Subsection \| 'contacts' \| null;\r?\n\r?\ninterface Props \{/,
      `type NormalizedActiveSubsection = Section1Subsection | 'contacts' | null;\r\n\r\nconst normalizeActiveSubsection = (\r\n  activeSubsection?: string | null,\r\n): NormalizedActiveSubsection => {\r\n  if (!activeSubsection) return null;\r\n  if (activeSubsection === '1A') return 'vital_info';\r\n  if (activeSubsection === '1B' || activeSubsection === '1C') return 'contacts';\r\n  if (\r\n    activeSubsection === 'vital_info' ||\r\n    activeSubsection === 'next_of_kin' ||\r\n    activeSubsection === 'executor_trustee' ||\r\n    activeSubsection === 'additional_contacts'\r\n  ) {\r\n    return activeSubsection;\r\n  }\r\n  return null;\r\n};\r\n\r\ninterface Props {`,
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Safe patched', file);
  }
}
