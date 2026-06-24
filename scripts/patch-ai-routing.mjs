import fs from 'fs';
import path from 'path';

const sectionsDir = path.join('src', 'components', 'sections');

const SECTIONS = [
  { file: 'Section1VitalInformation.tsx', id: '1', key: 'vital_information', subsection: null },
  { file: 'Section5Vehicles.tsx', id: '5', key: 'vehicles', subsection: '5A' },
  { file: 'Section6MainResidence.tsx', id: '6', key: 'main_residence', subsection: '6A' },
  { file: 'Section7InsurencePolicies.tsx', id: '7', key: 'insurance_policies', subsection: '7A' },
  { file: 'Section8CommunityMembership.tsx', id: '8', key: 'community_memberships', subsection: '8A' },
  { file: 'Section9CharitableGiving.tsx', id: '9', key: 'charitable_giving', subsection: '9A' },
  { file: 'Section10EducationAccomplishments.tsx', id: '10', key: 'education_accomplishments', subsection: '10A' },
  { file: 'Section11MilitaryService.tsx', id: '11', key: 'military_service', subsection: '11A' },
  { file: 'Section12BankingFinancialAccounts.tsx', id: '12', key: 'banking_financial_accounts', subsection: null },
  { file: 'Section13PasswordsOnlineAccounts.tsx', id: '13', key: 'passwords_online_accounts', subsection: '13A' },
  { file: 'Section14InvestmentAccounts.tsx', id: '14', key: 'investment_accounts', subsection: '14A' },
  { file: 'Section15HealthInformation.tsx', id: '15', key: 'health_information', subsection: null },
  { file: 'Section16CreditCardsDebt.tsx', id: '16', key: 'credit_cards_debt', subsection: null },
  { file: 'Section17FamilyTreasuredConnections.tsx', id: '17', key: 'family_treasured_connections', subsection: null },
  { file: 'Section18EmploymentBusiness.tsx', id: '18', key: 'employment_business', subsection: null },
  { file: 'Section19AssetsValuables.tsx', id: '19', key: 'assets_valuables', subsection: null },
  { file: 'Section20LegalDocumentsRecords.tsx', id: '20', key: 'legal_documents_records', subsection: null },
  { file: 'Section21EstatePlanningFinalWishes.tsx', id: '21', key: 'estate_planning_final_wishes', subsection: null },
];

for (const section of SECTIONS) {
  const filePath = path.join(sectionsDir, section.file);
  if (!fs.existsSync(filePath)) {
    console.log('Skip missing', section.file);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('useRestoreAiPendingUploadForSection')) {
    console.log('Already patched', section.file);
    continue;
  }

  if (!content.includes("from '@/services/aiAutofill'")) {
    console.log('No aiAutofill import', section.file);
    continue;
  }

  content = content.replace(
    /import \{ autofillSectionFromDocument \} from '@\/services\/aiAutofill';/,
    `import { runAiSectionAutofill } from '@/services/aiSectionAutofill';\nimport { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';\nimport {\n  resolveAiUploadedFileForScope,\n  useRestoreAiPendingUploadForSection,\n} from '@/hooks/useAiUploadedFileResolver';`,
  );

  content = content.replace(
    /(const latestUploadRef = useRef<Record<string, UploadedAIFile>>\(\{\}\);[\s\S]*?\n)/,
    `$1\n  const aiRouting = useOptionalAiDocumentRouting();\n\n  useRestoreAiPendingUploadForSection({\n    sectionId: '${section.id}',\n    setUploadedFiles,\n    latestUploadRef,\n  });\n`,
  );

  content = content.replace(
    /const getUploadedFileForScope = \(([^)]+)\) => \{\s*return latestUploadRef\.current\[String\(([^)]+)\)\] \?\? uploadedFiles\[\2\] \?\? null;\s*\};/,
    `const getUploadedFileForScope = ($1) => {\n    const pendingFile =\n      aiRouting?.getPendingFileForSection('${section.id}', String($2)) ?? null;\n\n    return resolveAiUploadedFileForScope($2, uploadedFiles, latestUploadRef, pendingFile);\n  };`,
  );

  const autofillCallPattern = /const json = await autofillSectionFromDocument\(\{([\s\S]*?)\}\);/g;
  content = content.replace(autofillCallPattern, (match, body) => {
    const fileIdMatch = body.match(/file_id:\s*([^,\n]+)/);
    const subsectionMatch = body.match(/subsection:\s*([^,\n]+)/);
    const fileId = fileIdMatch?.[1]?.trim() || 'uploadedFile.file_id';
    const subsection = subsectionMatch?.[1]?.trim();

    const subsectionLine = subsection
      ? `subsection: ${subsection},`
      : `subsection: ${section.subsection ? `'${section.subsection}'` : 'undefined'},`;

    return `const json = await runAiSectionAutofill({
        sectionKey: '${section.key}',
        sectionId: '${section.id}',
        file_id: ${fileId},
        ${subsectionLine}
        uploadScope: String(scope),
        onMismatch: error =>
          aiRouting?.handleMismatch(error.detail, {
            currentSectionId: '${section.id}',
            uploadScope: String(scope),
          }),
      });

      if (!json) return;

      aiRouting?.clearPendingUpload();`;
  });

  if (content.includes('<SectionAiDocumentUploader')) {
    content = content.replace(
      /uploadedMimeType=\{getUploadedFileForScope\(scope\)\?\.mime_type\}/g,
      `uploadedMimeType={getUploadedFileForScope(scope)?.mime_type}\n      highlightUpload={aiRouting?.shouldHighlightUpload('${section.id}', String(scope)) ?? false}`,
    );
  }

  fs.writeFileSync(filePath, content);
  console.log('Patched', section.file);
}
