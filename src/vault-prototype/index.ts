import type { SchemaSection } from './types';
import raw from './schema.raw.json';
import { mappedSchemaFill } from './schemaDataBridge';

export const VAULT_SCHEMA = raw as SchemaSection[];

export { schemaByApiId } from './schemaDataBridge';

export function schemaByHtmlId(htmlId: string): SchemaSection | undefined {
  return VAULT_SCHEMA.find(section => section.id === htmlId);
}

export function schemaFillProgress(
  apiId: string,
  data: Record<string, unknown> | undefined,
) {
  return mappedSchemaFill(apiId, data);
}
