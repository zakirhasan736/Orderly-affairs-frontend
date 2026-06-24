export type SectionFieldConfig = {
  key: string;
  type?: string;
};

export const createEmptyUploadField = () => ({
  text: '',
  files: [] as unknown[],
  _deleted_files: [] as string[],
});

export function createEmptyItemFromFields(fields: SectionFieldConfig[]) {
  return Object.fromEntries(
    fields.map(field => [
      field.key,
      field.type === 'TextInputWithUpload'
        ? createEmptyUploadField()
        : field.type === 'Checkbox'
          ? false
          : '',
    ]),
  );
}

export function normalizeUploadField(value: unknown) {
  if (value === '' || value == null) {
    return createEmptyUploadField();
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return {
      ...createEmptyUploadField(),
      text: String(value),
    };
  }

  if (typeof value === 'object') {
    const field = value as Record<string, unknown>;
    return {
      text: typeof field.text === 'string' ? field.text : '',
      files: Array.isArray(field.files) ? field.files : [],
      _deleted_files: Array.isArray(field._deleted_files)
        ? field._deleted_files
        : [],
    };
  }

  return createEmptyUploadField();
}

export function sanitizeSectionPayload(
  payload: Record<string, unknown>,
  subsectionKey: string,
  uploadKeys: readonly string[],
) {
  const items = payload[subsectionKey];
  if (!Array.isArray(items)) return payload;

  return {
    ...payload,
    [subsectionKey]: items.map(item => {
      if (!item || typeof item !== 'object') return item;

      const next = { ...(item as Record<string, unknown>) };
      for (const key of uploadKeys) {
        if (key in next) {
          next[key] = normalizeUploadField(next[key]);
        }
      }
      return next;
    }),
  };
}
