import fs from 'fs';
import path from 'path';

const map = {
  'Section5Vehicles.tsx': 'SECTION_5.fields',
  'Section6MainResidence.tsx': 'SECTION_6A.fields',
  'Section7InsurencePolicies.tsx': 'SECTION_7A.fields',
  'Section8CommunityMembership.tsx': 'SECTION_8A.fields',
  'Section9CharitableGiving.tsx': 'SECTION_9A.fields',
  'Section10EducationAccomplishments.tsx': 'SECTION_10A.fields',
  'Section11MilitaryService.tsx': 'SECTION_11A.fields',
  'Section13PasswordsOnlineAccounts.tsx': 'SECTION_13A.fields',
  'Section14InvestmentAccounts.tsx': 'SECTION_14A.fields',
};

const sectionsDir = path.join('src', 'components', 'sections');

for (const [file, fieldsExpr] of Object.entries(map)) {
  const filePath = path.join(sectionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(`fields: ${fieldsExpr}`)) {
    console.log('skip', file);
    continue;
  }

  content = content.replace(
    /uploadScope: String\(scope\),\s*\r?\n\s*aiRouting,/g,
    `uploadScope: String(scope),\n        fields: ${fieldsExpr},\n        aiRouting,`,
  );

  fs.writeFileSync(filePath, content);
  console.log('added fields', file);
}
