import fs from 'fs';
import path from 'path';

const dir = 'src/components/sections';

const configs = [
  {
    file: 'Section9CharitableGiving.tsx',
    section: 'SECTION_9A',
    items: 'charities',
    create: 'createEmptyCharity',
    update: 'updateCharities',
    remove: 'removeCharity',
    index: 'charityIndex',
    extracted: 'extractedCharities',
    empty:
      'AI could not find charitable giving information in this document.',
    fields: "['charity_name', 'organization_name', 'name']",
  },
  {
    file: 'Section10EducationAccomplishments.tsx',
    section: 'SECTION_10A',
    items: 'educationItems',
    create: 'createEmptyEducation',
    update: 'updateEducationItems',
    remove: 'removeEducation',
    index: 'educationIndex',
    extracted: 'extractedEducationItems',
    empty: 'AI could not find education information in this document.',
    fields: "['institution', 'school', 'degree']",
  },
  {
    file: 'Section11MilitaryService.tsx',
    section: 'SECTION_11A',
    items: 'servicePeriods',
    create: 'createEmptyServicePeriod',
    update: 'updateServicePeriods',
    remove: 'removeServicePeriod',
    index: 'serviceIndex',
    extracted: 'extractedServicePeriods',
    empty: 'AI could not find military service information in this document.',
    fields: "['branch', 'service_branch', 'rank']",
  },
  {
    file: 'Section13PasswordsOnlineAccounts.tsx',
    section: 'SECTION_13A',
    items: 'accounts',
    create: 'createEmptyAccount',
    update: 'updateAccounts',
    remove: 'removeAccount',
    index: 'accountIndex',
    extracted: 'extractedAccounts',
    empty: 'AI could not find online account information in this document.',
    fields: "['account_name', 'website', 'platform']",
  },
  {
    file: 'Section14InvestmentAccounts.tsx',
    section: 'SECTION_14A',
    items: 'accounts',
    create: 'createEmptyAccount',
    update: 'updateAccounts',
    remove: 'removeAccount',
    index: 'accountIndex',
    extracted: 'extractedAccounts',
    empty:
      'AI could not find investment account information in this document.',
    fields: "['institution', 'account_type', 'account_name']",
  },
];

for (const c of configs) {
  const fp = path.join(dir, c.file);
  let s = fs.readFileSync(fp, 'utf8');
  if (s.includes('useAiMultiItemAutofill')) {
    console.log('skip', c.file);
    continue;
  }

  const navImport = "} from '@/utils/vaultTopicNavigation';";
  if (!s.includes(navImport)) {
    console.log('no nav import', c.file);
    continue;
  }
  s = s.replace(
    navImport,
    navImport +
      "\nimport { useAiMultiItemAutofill } from '@/hooks/useAiMultiItemAutofill';",
  );

  const removePattern = new RegExp(
    `const ${c.remove} = \\(index: number\\) => \\{[\\s\\S]*?\\};\\n\\n  const getUploadedFileForScope`,
  );
  const hookBlock = `const ${c.remove} = (index: number) => {
    ${c.update}(${c.items}.filter((_, itemIndex) => itemIndex !== index));
  };

  const multiItemAutofill = useAiMultiItemAutofill({
    itemLabel: ${c.section}.itemLabel,
    createEmpty: ${c.create},
    getCurrentItems: () => ${c.items},
    setItems: ${c.update},
    setAiNotice,
    describeFields: ${c.fields},
  });

  const getUploadedFileForScope`;

  if (!removePattern.test(s)) {
    console.log('no remove block', c.file);
    continue;
  }
  s = s.replace(removePattern, hookBlock);

  const autofillPattern = new RegExp(
    `if \\(${c.extracted}\\.length === 0\\) \\{[\\s\\S]*?setAiNotice\\([\\s\\S]*?\\);\\s*\\}`,
  );
  const autofillReplacement = `if (
        !multiItemAutofill.processExtraction(${c.extracted}, ${c.index}, {
          setAiError,
          setAiNotice,
          emptyError: '${c.empty}',
        })
      ) {
        return;
      }`;

  if (!autofillPattern.test(s)) {
    console.log('no autofill block', c.file);
    continue;
  }
  s = s.replace(autofillPattern, autofillReplacement);

  if (!s.includes('multiItemAutofill.dialog')) {
    s = s.replace(
      'return (\n    <div className="space-y-8">',
      'return (\n    <div className="space-y-8">\n      {multiItemAutofill.dialog}',
    );
  }

  fs.writeFileSync(fp, s);
  console.log('updated', c.file);
}
