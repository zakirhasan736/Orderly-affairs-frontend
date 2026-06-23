import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');

const uploadHandlerTemplate = (params) => `const handleDocumentUpload = async (${params}) => {
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

function ensureImports(content) {
  if (!content.includes('SectionAiDocumentUploader')) return content;

  if (!content.includes("from '@/components/ai/SectionAiDocumentUploader'")) {
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
      /import React, \{([^}]+)\} from 'react';/,
      (match, hooks) =>
        hooks.includes('useRef') ? match : `import React, {${hooks.trim()}, useRef } from 'react';`,
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

  return content;
}

function ensureLatestUploadRef(content) {
  if (!content.includes('latestUploadRef.current')) return content;
  if (content.includes('const latestUploadRef')) return content;

  return content.replace(
    /(const \[uploadedFiles, setUploadedFiles\] = useState[\s\S]*?\);\n)/,
    `$1\n  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});\n`,
  );
}

function ensureGetUploadedFileForScope(content) {
  return content.replace(
    /const getUploadedFileForScope = \(([^)]*)\) => \{\s*return uploadedFiles\[([^\]]+)\] \|\| null;\s*\};/,
    'const getUploadedFileForScope = ($1) => {\n    return latestUploadRef.current[String($2)] ?? uploadedFiles[$2] ?? null;\n  };',
  );
}

function ensureHandleDocumentUpload(content) {
  if (!content.includes('handleDocumentUpload')) return content;
  if (content.includes('validateAiDocumentFile')) return content;

  return content.replace(
    /const handleDocumentUpload = async \(([\s\S]*?)\) => \{[\s\S]*?finally \{\s*setUploadingScope\(null\);\s*\}\s*\};\n/,
    (match, params) => {
      const trimmed = params.trim();
      const signature = trimmed.includes('runAutofill')
        ? trimmed
        : `${trimmed}${trimmed ? ', ' : ''}runAutofill?: () => void | Promise<void>`;
      return `${uploadHandlerTemplate(signature)}\n`;
    },
  );
}

function ensureRenderUploader(content) {
  if (!content.includes('SectionAiDocumentUploader')) return content;
  if (content.includes('onUpload={file => handleDocumentUpload(file, scope, onAutofill)}')) {
    return content.replace(/scope: string;/g, 'scope: UploadScope;');
  }

  const block = `  const renderUploader = ({
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
      uploadLabel={uploadLabel}
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

  if (content.includes('const renderUploader = (')) {
    const start = content.indexOf('const renderUploader =');
    const isSection21 = content.includes(
      'const renderUploader = (subsection: SubsectionId)',
    );
    if (isSection21) return content;

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

    return content.slice(0, start) + block + content.slice(index);
  }

  return content;
}

const files = fs
  .readdirSync(sectionsDir)
  .filter(
    file =>
      file.startsWith('Section') &&
      file.endsWith('.tsx') &&
      fs.readFileSync(path.join(sectionsDir, file), 'utf8').includes('renderUploader'),
  );

for (const file of files) {
  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = ensureImports(content);
  content = ensureLatestUploadRef(content);
  content = ensureGetUploadedFileForScope(content);
  content = ensureHandleDocumentUpload(content);
  content = ensureRenderUploader(content);

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', file);
  }
}
