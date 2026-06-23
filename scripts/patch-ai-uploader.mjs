import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');
const files = fs
  .readdirSync(sectionsDir)
  .filter(file => {
    const fullPath = path.join(sectionsDir, file);
    return (
      file.startsWith('Section') &&
      file.endsWith('.tsx') &&
      fs.readFileSync(fullPath, 'utf8').includes('renderUploader')
    );
  });

const sharedRenderUploader = `  const renderUploader = ({
    scope,
    title,
    description,
    buttonLabel = 'Auto-fill',
    uploadLabel,
    onAutofill,
    compact = false,
    tone,
  }: {
    scope: string;
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

const uploadHandlerBody = `    try {
      if (!file) return;

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

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
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
      /import React, \{([^}]+)\} from 'react';/,
      (match, hooks) => {
        if (hooks.includes('useRef')) return match;
        return `import React, {${hooks.trim()}, useRef } from 'react';`;
      },
    );
  }

  content = content.replace(
    /\nconst ALLOWED_UPLOAD_TYPES = \[[\s\S]*?\];\n\nconst MAX_UPLOAD_SIZE = [\s\S]*?;\n\nconst getReadableFileType = [\s\S]*?\};\n/,
    '\n',
  );

  content = content.replace(/\ntype UploadedAIFile = \{[\s\S]*?\};\n/, '\n');

  if (!content.includes('latestUploadRef')) {
    content = content.replace(
      /(const \[uploadedFiles, setUploadedFiles\] = useState<[\s\S]*?>;\n)/,
      `$1\n  const latestUploadRef = useRef<Record<string, UploadedAIFile>>({});\n`,
    );
  }

  content = content.replace(
    /const getUploadedFileForScope = \(([^)]*)\) => \{\s*return uploadedFiles\[([^\]]+)\] \|\| null;\s*\};/,
    'const getUploadedFileForScope = ($1) => {\n    return latestUploadRef.current[String($2)] ?? uploadedFiles[$2] ?? null;\n  };',
  );

  content = content.replace(
    /const handleDocumentUpload = async \(([\s\S]*?)\) => \{[\s\S]*?finally \{\s*setUploadingScope\(null\);\s*\}\s*\};\n/,
    (match, params) => {
      if (match.includes('runAutofill')) return match;
      const trimmed = params.trim();
      const signature = trimmed.includes('runAutofill')
        ? trimmed
        : `${trimmed}${trimmed ? ', ' : ''}runAutofill?: () => void | Promise<void>`;
      return `const handleDocumentUpload = async (${signature}) => {\n${uploadHandlerBody}\n  };\n`;
    },
  );

  const renderStart = content.indexOf('const renderUploader =');
  const isSection21 = content.includes(
    'const renderUploader = (subsection: SubsectionId)',
  );

  if (renderStart !== -1 && !isSection21) {
    let depth = 0;
    let index = renderStart;
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

    content =
      content.slice(0, renderStart) + sharedRenderUploader + content.slice(index);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Patched', path.basename(filePath));
  } else {
    console.log('Skipped', path.basename(filePath));
  }
}

for (const file of files) {
  patchFile(path.join(sectionsDir, file));
}
