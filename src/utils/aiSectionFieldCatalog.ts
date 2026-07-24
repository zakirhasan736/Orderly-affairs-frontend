import { formConfig } from '@/config/formConfig';
import type { FieldDefinition, Subsection } from '@/types/formTypes';
import { buildFieldCatalogForAi } from '@/utils/aiPatchNormalizer';
import { AI_SECTION_BY_ID, AI_SECTION_BY_KEY } from '@/utils/aiSectionRegistry';

function collectFieldsFromSubsection(subsection: Subsection): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  if (Array.isArray(subsection.fields)) {
    fields.push(...subsection.fields);
  }

  if (Array.isArray(subsection.groups)) {
    subsection.groups.forEach(group => {
      if (Array.isArray(group.fields)) {
        fields.push(...group.fields);
      }
    });
  }

  return fields;
}

/** All fillable fields for a vault section (from formConfig JSON). */
export function getSectionFieldDefinitions(
  sectionId: string,
  subsectionId?: string | null,
): FieldDefinition[] {
  const section = formConfig.chunks
    .flatMap(chunk => chunk.sections)
    .find(item => item.id === sectionId);

  if (!section?.subsections?.length) return [];

  let target = section.subsections;
  if (subsectionId) {
    const exact = section.subsections.filter(item => item.id === subsectionId);
    if (exact.length) {
      target = exact;
    } else {
      // e.g. defaultSubsection "vital_info" vs form subsection "1A"
      const soft = section.subsections.filter(item =>
        item.id.toLowerCase().includes(String(subsectionId).toLowerCase()),
      );
      if (soft.length) target = soft;
    }
  }

  const fields: FieldDefinition[] = [];
  const seen = new Set<string>();

  const pushFields = (list: Subsection[]) => {
    list.forEach(sub => {
      collectFieldsFromSubsection(sub).forEach(field => {
        if (!field?.key || seen.has(field.key)) return;
        if (field.type === 'Instructions' || field.type === 'InstructionsModal') {
          return;
        }
        seen.add(field.key);
        fields.push(field);
      });
    });
  };

  pushFields(target);

  // Fall back to entire section if subsection filter was too narrow.
  if (!fields.length && target !== section.subsections) {
    pushFields(section.subsections);
  }

  return fields;
}

export function getSectionFieldCatalog(
  sectionIdOrKey: string,
  subsectionId?: string | null,
) {
  const meta =
    AI_SECTION_BY_ID[sectionIdOrKey] || AI_SECTION_BY_KEY[sectionIdOrKey];
  const sectionId = meta?.id || sectionIdOrKey;
  const subsection = subsectionId || meta?.defaultSubsection || null;
  const fields = getSectionFieldDefinitions(sectionId, subsection);
  return {
    sectionId,
    subsection,
    fields,
    catalog: buildFieldCatalogForAi(fields),
  };
}
