import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');

const INLINE_SECTIONS = [
  { file: 'Section1VitalInformation.tsx', id: '1' },
  { file: 'Section12BankingFinancialAccounts.tsx', id: '12' },
  { file: 'Section15HealthInformation.tsx', id: '15' },
  { file: 'Section16CreditCardsDebt.tsx', id: '16' },
  { file: 'Section17FamilyTreasuredConnections.tsx', id: '17' },
  { file: 'Section18EmploymentBusiness.tsx', id: '18' },
  { file: 'Section19AssetsValuables.tsx', id: '19' },
  { file: 'Section20LegalDocumentsRecords.tsx', id: '20' },
];

for (const section of INLINE_SECTIONS) {
  const filePath = path.join(sectionsDir, section.file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(`shouldHighlightUpload('${section.id}'`)) {
    console.log('Inline highlight exists', section.file);
    continue;
  }

  content = content.replace(
    /const isReading = aiLoadingScope === scope;\r?\n/,
    `const isReading = aiLoadingScope === scope;\r\n    const highlightUpload =\r\n      aiRouting?.shouldHighlightUpload('${section.id}', String(scope)) ?? false;\r\n`,
  );

  content = content.replace(
    /<div\r?\n        className=\{\[\r?\n          'relative overflow-hidden rounded-2xl border border-dashed',/,
    `<div\r\n        data-ai-upload-zone={highlightUpload ? 'highlight' : undefined}\r\n        className={[\r\n          'relative overflow-hidden rounded-2xl border border-dashed',`,
  );

  content = content.replace(
    /compact \? 'space-y-3' : 'space-y-4',\r?\n        \]\.join\(' '\)\r?\n      \}\)/,
    `compact ? 'space-y-3' : 'space-y-4',\r\n          highlightUpload &&\r\n            'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-300 ring-offset-2 animate-pulse',\r\n        ].join(' ')\r\n      })}`,
  );

  if (!content.includes('Your document is ready here')) {
    content = content.replace(
      /<div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">/,
      `{highlightUpload && (\r\n          <div className="relative rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">\r\n            Your document is ready here. Click Auto-fill to apply it — no need to upload again.\r\n          </div>\r\n        )}\r\n\r\n        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">`,
    );
  }

  fs.writeFileSync(filePath, content);
  console.log('Inline patched', section.file);
}
