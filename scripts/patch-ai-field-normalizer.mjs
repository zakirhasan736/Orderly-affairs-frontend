import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');

const SECTION_FIELDS = [
  { file: 'Section5Vehicles.tsx', constName: 'SECTION_5', fields: 'SECTION_5.fields' },
  { file: 'Section6MainResidence.tsx', constName: 'SECTION_6A', fields: 'SECTION_6A.fields' },
  { file: 'Section7InsurencePolicies.tsx', constName: 'SECTION_7A', fields: 'SECTION_7A.fields' },
  { file: 'Section8CommunityMembership.tsx', constName: 'SECTION_8A', fields: 'SECTION_8A.fields' },
  { file: 'Section9CharitableGiving.tsx', constName: 'SECTION_9A', fields: 'SECTION_9A.fields' },
  { file: 'Section10EducationAccomplishments.tsx', constName: 'SECTION_10A', fields: 'SECTION_10A.fields' },
  { file: 'Section11MilitaryService.tsx', constName: 'SECTION_11A', fields: 'SECTION_11A.fields' },
  { file: 'Section12BankingFinancialAccounts.tsx', constName: null, fields: null },
  { file: 'Section13PasswordsOnlineAccounts.tsx', constName: 'SECTION_13A', fields: 'SECTION_13A.fields' },
  { file: 'Section14InvestmentAccounts.tsx', constName: 'SECTION_14A', fields: 'SECTION_14A.fields' },
  { file: 'Section15HealthInformation.tsx', constName: null, fields: null },
  { file: 'Section16CreditCardsDebt.tsx', constName: null, fields: null },
  { file: 'Section17FamilyTreasuredConnections.tsx', constName: null, fields: null },
  { file: 'Section18EmploymentBusiness.tsx', constName: null, fields: null },
  { file: 'Section19AssetsValuables.tsx', constName: null, fields: null },
  { file: 'Section20LegalDocumentsRecords.tsx', constName: null, fields: null },
  { file: 'Section21EstatePlanningFinalWishes.tsx', constName: null, fields: null },
  { file: 'Section1VitalInformation.tsx', constName: null, fields: null },
];

for (const section of SECTION_FIELDS) {
  const filePath = path.join(sectionsDir, section.file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('runAiSectionAutofill')) continue;

  if (!content.includes('aiPatchNormalizer')) {
    content = content.replace(
      /import \{ runAiSectionAutofill \} from '@\/services\/aiSectionAutofill';/,
      `import { runAiSectionAutofill } from '@/services/aiSectionAutofill';\nimport {\n  createEmptyItemFromFields,\n  mergeAiPatchWithDefaults,\n} from '@/utils/aiPatchNormalizer';`,
    );
  }

  if (section.fields && content.includes(`const createEmpty`)) {
    content = content.replace(
      /const createEmpty\w+ = \(\) => \{[\s\S]*?\};\r?\n\r?\n/,
      match => {
        const fnName = match.match(/const (createEmpty\w+)/)?.[1];
        if (!fnName || content.includes(`createEmptyItemFromFields(${section.fields})`)) {
          return match;
        }
        return `const ${fnName} = () => createEmptyItemFromFields(${section.fields});\n\n`;
      },
    );

    content = content.replace(
      /const normalize\w+Patch = \(patch: any\) => \{\s*return \{\s*\.\.\.createEmpty\w+\(\),\s*\.\.\.cleanPatchObject\(patch\),\s*\};\s*\};/g,
      match => {
        const normalizeName = match.match(/const (normalize\w+Patch)/)?.[1];
        const createName = match.match(/createEmpty\w+/)?.[0];
        if (!normalizeName || !createName) return match;
        return `const ${normalizeName} = (patch: any) =>\n    mergeAiPatchWithDefaults(patch, ${section.fields}, ${createName});`;
      },
    );

    if (!content.includes('fields:')) {
      content = content.replace(
        /uploadScope: String\(scope\),\s*\r?\n\s*aiRouting,/g,
        `uploadScope: String(scope),\n        fields: ${section.fields},\n        aiRouting,`,
      );
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('patched', section.file);
}
