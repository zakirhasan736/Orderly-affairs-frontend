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

const configs = {
  'Section12BankingFinancialAccounts.tsx': `  const renderUploader = ({
    subsection,
    scope,
    title,
    description,
    buttonLabel = 'Auto-fill',
    uploadLabel,
    compact = false,
    onAutofill,
  }: {
    subsection: SubsectionId;
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    uploadLabel?: string;
    compact?: boolean;
    onAutofill: () => void | Promise<void>;
  }) => {
    const isBank = subsection === '12A';
    const tone = isBank
      ? {
          wrapper:
            'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50 hover:border-emerald-300',
          glowOne: 'bg-emerald-100/70',
          glowTwo: 'bg-cyan-100/70',
          icon: 'text-emerald-600',
          uploadBox: 'hover:border-emerald-300 hover:bg-emerald-50/50',
        }
      : {
          wrapper:
            'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 hover:border-blue-300',
          glowOne: 'bg-blue-100/70',
          glowTwo: 'bg-indigo-100/70',
          icon: 'text-blue-600',
          uploadBox: 'hover:border-blue-300 hover:bg-blue-50/50',
        };

    return (
      <SectionAiDocumentUploader
        title={title}
        description={description}
        buttonLabel={buttonLabel}
        uploadLabel={
          uploadLabel ??
          'Drag and drop or click to upload financial document'
        }
        compact={compact}
        tone={tone}
        disabled={isAnyAIActionRunning}
        isUploading={uploadingScope === scope}
        isReading={aiLoadingScope === scope}
        uploadedMimeType={getUploadedFileForScope(scope)?.mime_type}
        onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
        onAutofill={onAutofill}
      />
    );
  };`,
  'Section15HealthInformation.tsx': `  const renderUploader = ({
    scope,
    title,
    description,
    buttonLabel,
    uploadLabel,
    compact = false,
    variant = 'health',
    onAutofill,
  }: {
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel: string;
    uploadLabel?: string;
    compact?: boolean;
    variant?: 'health' | 'provider';
    onAutofill: () => void | Promise<void>;
  }) => {
    const isHealth = variant === 'health';
    const tone = isHealth
      ? {
          wrapper:
            'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-red-50/50 hover:border-red-300',
          glowOne: 'bg-red-100/70',
          glowTwo: 'bg-rose-100/70',
          icon: 'text-red-600',
          uploadBox: 'hover:border-red-300 hover:bg-red-50/50',
        }
      : {
          wrapper:
            'border-slate-300 bg-gradient-to-br from-slate-50 via-white to-cyan-50/50 hover:border-cyan-300',
          glowOne: 'bg-cyan-100/70',
          glowTwo: 'bg-sky-100/70',
          icon: 'text-cyan-600',
          uploadBox: 'hover:border-cyan-300 hover:bg-cyan-50/50',
        };

    return (
      <SectionAiDocumentUploader
        title={title}
        description={description}
        buttonLabel={buttonLabel}
        uploadLabel={
          uploadLabel ?? 'Drag and drop or click to upload health document'
        }
        compact={compact}
        tone={tone}
        disabled={isAnyAIActionRunning}
        isUploading={uploadingScope === scope}
        isReading={aiLoadingScope === scope}
        uploadedMimeType={getUploadedFileForScope(scope)?.mime_type}
        onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
        onAutofill={onAutofill}
      />
    );
  };`,
  'Section19AssetsValuables.tsx': `  const renderUploader = ({
    subsection,
    scope,
    title,
    description,
    buttonLabel = 'Auto-fill',
    uploadLabel,
    compact = false,
    onAutofill,
  }: {
    subsection: SubsectionId;
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    uploadLabel?: string;
    compact?: boolean;
    onAutofill: () => void | Promise<void>;
  }) => (
    <SectionAiDocumentUploader
      title={title}
      description={description}
      buttonLabel={buttonLabel}
      uploadLabel={
        uploadLabel ?? 'Drag and drop or click to upload asset document'
      }
      compact={compact}
      disabled={isAnyAIActionRunning}
      isUploading={uploadingScope === scope}
      isReading={aiLoadingScope === scope}
      uploadedMimeType={getUploadedFileForScope(scope)?.mime_type}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );`,
};

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

function ensureBase(content) {
  if (!content.includes("SectionAiDocumentUploader")) {
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
  }

  content = content.replace(
    /\ntype UploadedAIFile = \{[\s\S]*?\};\n/g,
    '\n',
  );
  content = content.replace(
    /\nconst ALLOWED_UPLOAD_TYPES = \[[\s\S]*?\];\n\nconst MAX_UPLOAD_SIZE = [\s\S]*?;\n\nconst getReadableFileType = [\s\S]*?\};\n/g,
    '\n',
  );

  if (
    content.includes('latestUploadRef.current') &&
    !content.includes('const latestUploadRef')
  ) {
    content = content.replace(
      /(const \[uploadedFiles, setUploadedFiles\] = useState[\s\S]*?\);\n)/,
      `$1\n  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});\n`,
    );
  }

  content = content.replace(
    /const getUploadedFileForScope = \(([^)]*)\) => \{\s*return uploadedFiles\[([^\]]+)\] \|\| null;\s*\};/,
    'const getUploadedFileForScope = ($1) => {\n    return latestUploadRef.current[String($2)] ?? uploadedFiles[$2] ?? null;\n  };',
  );

  if (!content.includes('validateAiDocumentFile')) {
    content = replaceFunction(content, 'handleDocumentUpload', uploadHandler);
  }

  return content;
}

for (const [file, renderUploader] of Object.entries(configs)) {
  const filePath = path.join(sectionsDir, file);
  let content = ensureBase(fs.readFileSync(filePath, 'utf8'));
  content = replaceFunction(content, 'renderUploader', renderUploader);
  fs.writeFileSync(filePath, content);
  console.log('Patched', file);
}

// Generic patch for remaining old-ui files
const genericFiles = [
  'Section16CreditCardsDebt.tsx',
  'Section17FamilyTreasuredConnections.tsx',
  'Section18EmploymentBusiness.tsx',
  'Section20LegalDocumentsRecords.tsx',
];

const genericRenderUploader = `  const renderUploader = ({
    scope,
    title,
    description,
    buttonLabel = 'Auto-fill',
    uploadLabel,
    onAutofill,
    compact = false,
    tone,
  }: {
    scope: UploadScope;
    title: string;
    description: string;
    buttonLabel?: string;
    uploadLabel?: string;
    onAutofill: () => void | Promise<void>;
    compact?: boolean;
    tone?: import('@/components/ai/SectionAiDocumentUploader').SectionAiUploaderTone;
  }) => (
    <SectionAiDocumentUploader
      title={title}
      description={description}
      buttonLabel={buttonLabel}
      uploadLabel={uploadLabel ?? 'Drag and drop or click to upload document'}
      compact={compact}
      tone={tone}
      disabled={isAnyAIActionRunning}
      isUploading={uploadingScope === scope}
      isReading={aiLoadingScope === scope}
      uploadedMimeType={getUploadedFileForScope(scope)?.mime_type}
      onUpload={file => handleDocumentUpload(file, scope, onAutofill)}
      onAutofill={onAutofill}
    />
  );`;

for (const file of genericFiles) {
  const filePath = path.join(sectionsDir, file);
  let content = ensureBase(fs.readFileSync(filePath, 'utf8'));
  if (content.includes('Click to upload')) {
    content = replaceFunction(content, 'renderUploader', genericRenderUploader);
    fs.writeFileSync(filePath, content);
    console.log('Patched', file);
  }
}
