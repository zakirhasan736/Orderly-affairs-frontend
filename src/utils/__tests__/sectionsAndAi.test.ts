import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  applySection1AIPatch,
  applySection1SubsectionPatch,
} from '@/utils/applySection1AIPatch';
import {
  applyItemsToIndexedList,
  buildAutofillSuccessNotice,
  buildMultiItemFoundNotice,
  cleanAutofillPatchObject,
  describeAutofillItem,
  extractAutofillArrayFromPatch,
  isEmptyAutofillValue,
} from '@/utils/aiMultiItemAutofill';
import {
  buildDuplicateSkippedNotice,
  buildUpsertAutofillNotice,
  filterDuplicateAutofillItems,
  insurancePoliciesAreDuplicates,
  upsertAutofillItems,
  vehiclesAreDuplicates,
} from '@/utils/aiItemDedup';
import {
  getDynamicTopicsForSubsection,
  getTopicElementId,
  subsectionHasDynamicTopics,
} from '@/utils/dynamicVaultTopics';
import {
  mapSection1ResponseToUI,
  mapUIToSection1Payload,
} from '@/libs/mappers/section1Mapper';
import {
  createEmptyUploadField,
  normalizeUploadField,
  sanitizeSectionPayload,
} from '@/utils/sectionUploadFields';
import {
  applySemanticConceptsToItem,
  extractEndDateFromText,
  resolveSemanticConcept,
} from '@/utils/aiSemanticFieldMatch';
import { smartPlaceOntoFields } from '@/utils/smartFieldPlacement';
import {
  coerceAiFieldValue,
  createEmptyItemFromFields,
  humanizeFieldKey,
  mergeAiPatchWithDefaults,
} from '@/utils/aiPatchNormalizer';
import {
  getReadableAiDocumentType,
  validateAiDocumentFile,
} from '@/utils/aiDocumentUploadUi';
import { getAiSectionLabel } from '@/utils/aiSectionRegistry';
import {
  isAiDocumentMismatchDetail,
  markSectionFilledForFile,
  isSectionFilledForFile,
  clearFilledSectionsForFile,
  pendingUploadKey,
} from '@/utils/aiDocumentRouting';
import { applySubsectionOrder, reorderIds } from '@/utils/vaultNavOrder';

describe('applySection1AIPatch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('merges vital_info and replaces contact arrays when confirmed', () => {
    vi.stubGlobal('window', { confirm: () => true });
    const next = applySection1AIPatch(
      {
        vital_info: { full_legal_name: 'Old' },
        next_of_kin: [{ name: 'A' }],
      },
      {
        vital_info: { full_legal_name: 'New', city: 'Austin' },
        next_of_kin: [{ name: 'B' }],
      },
    );
    expect(next.vital_info.full_legal_name).toBe('New');
    expect(next.vital_info.city).toBe('Austin');
    expect(next.next_of_kin).toEqual([{ name: 'B' }]);
  });

  it('fills empty vital fields only when overwrite declined', () => {
    vi.stubGlobal('window', { confirm: () => false });
    const next = applySection1AIPatch(
      {
        vital_info: { full_legal_name: 'Keep Me', city: '' },
        next_of_kin: [{ name: 'Existing' }],
      },
      {
        vital_info: { full_legal_name: 'Overwrite', city: 'Dallas' },
        next_of_kin: [{ name: 'Incoming' }],
      },
    );
    expect(next.vital_info.full_legal_name).toBe('Keep Me');
    expect(next.vital_info.city).toBe('Dallas');
    expect(next.next_of_kin).toEqual([{ name: 'Existing' }]);
  });

  it('routes subsection patches', () => {
    const base = { vital_info: {}, next_of_kin: [] };
    expect(
      applySection1SubsectionPatch(base, 'next_of_kin', {
        next_of_kin: [{ name: 'Kin' }],
      }).next_of_kin,
    ).toEqual([{ name: 'Kin' }]);
    expect(applySection1SubsectionPatch(base, 'unknown', {})).toEqual(base);
  });
});

describe('aiMultiItemAutofill', () => {
  it('detects empty upload values and cleans patches', () => {
    expect(isEmptyAutofillValue({ text: '', files: [] })).toBe(true);
    expect(isEmptyAutofillValue({ text: 'note', files: [] })).toBe(false);
    expect(
      cleanAutofillPatchObject({
        year: 2020,
        __rowId: 'x',
        notes_instructions: 'skip',
        make: 'Honda',
        empty: '',
      }),
    ).toEqual({ year: '2020', make: 'Honda' });
  });

  it('extracts arrays and single objects from patches', () => {
    const normalize = (raw: unknown) =>
      ({ ...(raw as object) }) as Record<string, unknown>;

    expect(
      extractAutofillArrayFromPatch({
        patch: { '5A': [{ make: 'Honda' }, { make: 'Toyota' }] },
        subsectionKey: '5A',
        normalizeItem: normalize,
      }),
    ).toHaveLength(2);

    expect(
      extractAutofillArrayFromPatch({
        patch: { make: 'Ford', model: 'F150' },
        subsectionKey: '5A',
        normalizeItem: normalize,
        singleObjectDetectKeys: ['make'],
      }),
    ).toHaveLength(1);
  });

  it('applies items at target index without wiping earlier cards', () => {
    const { items, skipped, added, updated } = applyItemsToIndexedList({
      currentItems: [
        { make: 'Honda', __rowId: '1' },
        { make: '', __rowId: '2' },
      ],
      extractedItems: [{ make: 'Toyota' }, { make: 'Ford' }],
      targetIndex: 1,
      createEmpty: () => ({ make: '', __rowId: 'new' }),
      isDuplicate: () => false,
    });
    expect(items[0].make).toBe('Honda');
    expect(items[1].make).toBe('Toyota');
    expect(items[2].make).toBe('Ford');
    expect(skipped).toBe(0);
    expect(added).toBeGreaterThan(0);
    expect(updated).toBe(1);
  });

  it('updates matching insurance policies instead of appending duplicates', () => {
    const { items, added, updated } = applyItemsToIndexedList({
      currentItems: [
        {
          policy_company: 'Acme',
          policy_type: 'Life',
          policy_number: 'P-99',
          coverage_amount: '100000',
          __rowId: 'a',
        },
      ],
      extractedItems: [
        {
          policy_company: 'Acme Insurance',
          policy_type: 'Life',
          coverage_amount: '250000',
          policy_number: { text: 'P-99', files: [] },
        },
      ],
      createEmpty: () => ({
        policy_company: '',
        policy_type: '',
        coverage_amount: '',
        __rowId: 'new',
      }),
      isDuplicate: insurancePoliciesAreDuplicates,
    });

    expect(items).toHaveLength(1);
    expect(items[0].coverage_amount).toBe('250000');
    expect(items[0].__rowId).toBe('a');
    expect(added).toBe(0);
    expect(updated).toBe(1);
  });

  it('adds a second insurance policy when policy numbers differ', () => {
    const { items, added, updated } = applyItemsToIndexedList({
      currentItems: [
        {
          policy_company: 'State Farm',
          policy_type: 'Vehicle',
          policy_number: 'AUTO-1',
        },
      ],
      extractedItems: [
        {
          policy_company: 'State Farm',
          policy_type: 'Vehicle',
          policy_number: 'AUTO-2',
        },
        {
          policy_company: 'Acme',
          policy_type: 'Bank/Loan',
          policy_number: 'LOAN-9',
        },
      ],
      createEmpty: () => ({
        policy_company: '',
        policy_type: '',
        policy_number: '',
      }),
      isDuplicate: insurancePoliciesAreDuplicates,
    });

    expect(items).toHaveLength(3);
    expect(added).toBe(2);
    expect(updated).toBe(0);
  });

  it('builds human notices and labels from objects safely', () => {
    expect(buildMultiItemFoundNotice(3, 'Policy')).toMatch(/3 policy/i);
    expect(buildAutofillSuccessNotice(1, 'Vehicle', 1)).toMatch(/Vehicle #2/i);
    expect(
      describeAutofillItem({ policy_type: { label: 'Life' } }, ['policy_type']),
    ).toBe('Life');
  });
});

describe('aiItemDedup', () => {
  it('detects duplicate vehicles by VIN and year/make/model', () => {
    expect(
      vehiclesAreDuplicates(
        { vin: 'ABC123' },
        { vin: { text: 'abc123', files: [] } },
      ),
    ).toBe(true);
    expect(
      vehiclesAreDuplicates(
        { year: '2022', make: 'Honda', model: 'CR-V' },
        { year: '2022', make: 'Honda', model: 'CR-V' },
      ),
    ).toBe(true);
    expect(
      vehiclesAreDuplicates(
        { year: '2022', make: 'Honda', model: 'CR-V' },
        { year: '2023', make: 'Honda', model: 'CR-V' },
      ),
    ).toBe(false);
  });

  it('detects duplicate insurance policies', () => {
    expect(
      insurancePoliciesAreDuplicates(
        { policy_number: 'P-1' },
        { policy_number: 'P-1' },
      ),
    ).toBe(true);
    expect(
      insurancePoliciesAreDuplicates(
        { policy_number: 'P-1' },
        { policy_number: 'P-2' },
      ),
    ).toBe(false);
    // Same company+type without numbers can still be a renewal of an incomplete card
    expect(
      insurancePoliciesAreDuplicates(
        { policy_company: 'Acme', policy_type: 'Life' },
        { policy_company: 'Acme', policy_type: { value: 'Life' } },
      ),
    ).toBe(true);
    // Same insurer + Vehicle with number on one side only → update same policy
    expect(
      insurancePoliciesAreDuplicates(
        {
          policy_company: 'State Farm',
          policy_type: 'Vehicle',
          policy_number: 'V-100',
        },
        { insurance_company: 'State Farm Insurance', policy_type: 'Vehicle' },
      ),
    ).toBe(true);
    expect(
      insurancePoliciesAreDuplicates(
        { policy_company: 'State Farm', policy_type: 'Vehicle' },
        {
          insurance_company: 'State Farm',
          policy_type: 'Bank/Loan',
        },
      ),
    ).toBe(false);
  });

  it('upserts matching policies and builds upsert notices', () => {
    const { items, added, updated } = upsertAutofillItems(
      [
        {
          policy_company: 'Acme',
          policy_type: 'Life',
          coverage_amount: '100',
        },
      ],
      [
        {
          policy_company: 'Acme',
          policy_type: 'Life',
          coverage_amount: '200',
        },
        {
          policy_company: 'Beta',
          policy_type: 'Health',
          coverage_amount: '50',
        },
      ],
      insurancePoliciesAreDuplicates,
    );
    expect(items).toHaveLength(2);
    expect(items[0].coverage_amount).toBe('200');
    expect(added).toBe(1);
    expect(updated).toBe(1);
    expect(buildUpsertAutofillNotice(1, 1, 'Policy')).toMatch(/updated 1 and added 1/i);
  });

  it('filters duplicates and builds skip notices', () => {
    const { unique, skipped } = filterDuplicateAutofillItems(
      [{ vin: '1' }],
      [{ vin: '1' }, { vin: '2' }, {}],
      vehiclesAreDuplicates,
    );
    expect(unique).toEqual([{ vin: '2' }]);
    expect(skipped).toBe(1);
    expect(buildDuplicateSkippedNotice(2, 'Vehicle')).toMatch(/2 vehicle/i);
  });
});

describe('dynamicVaultTopics', () => {
  it('labels vehicle topics and skips object garbage', () => {
    const topics = getDynamicTopicsForSubsection('5', '5A', {
      '5A': [
        { year: '2022', make: 'Honda', model: 'CR-V' },
        { year: '', make: { label: 'Ford' }, model: 'F150' },
      ],
    });
    expect(topics[0].label).toContain('Honda');
    expect(topics[1].label).toContain('Ford');
    expect(topics[1].label).not.toContain('[object Object]');
    expect(subsectionHasDynamicTopics('5', '5A')).toBe(true);
    expect(getTopicElementId('5A:0')).toBe('vault-topic-5A-0');
  });
});

describe('section1Mapper', () => {
  it('maps UI payload and coerces nested objects from API', () => {
    expect(
      mapUIToSection1Payload({
        vital_info: { full_legal_name: 'A' },
      }),
    ).toMatchObject({
      vital_info: { full_legal_name: 'A' },
      next_of_kin: [],
    });

    const ui = mapSection1ResponseToUI({
      data: {
        vital_info: {
          full_legal_name: { label: 'Jordan Casey' },
          city: 'Austin',
          passport: { text: 'scan', files: [] },
        },
        next_of_kin: [],
      },
    });
    expect(ui.vital_info.full_legal_name).toBe('Jordan Casey');
    expect(ui.vital_info.passport).toEqual({ text: 'scan', files: [] });
    expect(mapSection1ResponseToUI({})).toEqual({});
  });
});

describe('smartFieldPlacement', () => {
  it('understands meaning then places onto exact labels without confusion', () => {
    const fields = [
      { key: 'account_number', label: 'Account Number' },
      { key: 'routing_number', label: 'Routing Number' },
      { key: 'bank_name', label: 'Bank Name' },
      { key: 'notes', label: 'Notes' },
    ];

    const placed = smartPlaceOntoFields(
      {
        acct_no: '123456',
        aba: '021000021',
        financial_institution: 'Chase',
        random_other: 'keep-me',
      },
      fields,
    );

    expect(placed.account_number).toBe('123456');
    expect(placed.routing_number).toBe('021000021');
    expect(placed.bank_name).toBe('Chase');
    expect(placed.random_other).toBe('keep-me');
    expect(placed.acct_no).toBeUndefined();
  });

  it('does not confuse similarly named fields', () => {
    const fields = [
      { key: 'policy_number', label: 'Policy Number' },
      { key: 'policy_company', label: 'Insurance Company' },
      { key: 'policy_expiry', label: 'Policy Expiry Date' },
    ];

    const placed = smartPlaceOntoFields(
      {
        member_id: 'M-9',
        carrier: 'Geico',
        valid_through: '2026-12-01',
      },
      fields,
    );

    expect(placed.policy_number).toBe('M-9');
    expect(placed.policy_company).toBe('Geico');
    expect(placed.policy_expiry).toBe('2026-12-01');
  });
});

describe('aiSemanticFieldMatch', () => {
  it('maps wording mismatches onto vehicle and insurance fields', () => {
    expect(resolveSemanticConcept('member_id')).toBe('policy_number');
    expect(resolveSemanticConcept('insurance_number')).toBe('policy_number');
    expect(resolveSemanticConcept('Insurance Number')).toBe('policy_number');
    expect(resolveSemanticConcept('valid_through')).toBe('policy_expiry');
    expect(extractEndDateFromText('Policy period 01/01/2025 to 12/31/2025')).toBe(
      '2025-12-31',
    );

    const vehicle = applySemanticConceptsToItem(
      {
        policy_number: 'P-1',
        policy_company: 'Acme',
        policy_expiry: '2026-01-01',
      },
      '5',
    );
    expect(vehicle.insurance_policy).toBe('P-1');
    expect(vehicle.insurance_company).toBe('Acme');
    expect(vehicle.registration_expiry).toBe('2026-01-01');

    const policy = applySemanticConceptsToItem(
      {
        insurance_policy: 'P-2',
        registration_expiry: '2027-02-02',
      },
      '7',
    );
    expect(policy.policy_number).toBe('P-2');
    expect(policy.policy_expiry).toBe('2027-02-02');
  });
});

describe('sectionUploadFields + aiPatchNormalizer', () => {
  it('normalizes upload fields and sanitizes payloads', () => {
    expect(createEmptyUploadField()).toEqual({
      text: '',
      files: [],
      _deleted_files: [],
    });
    expect(normalizeUploadField('deed note')).toEqual({
      text: 'deed note',
      files: [],
      _deleted_files: [],
    });
    expect(
      sanitizeSectionPayload(
        {
          '6A': [{ property_deeds_titles: 'text only', home_address: '123 Main' }],
        },
        '6A',
        ['property_deeds_titles'],
      )['6A'][0].property_deeds_titles,
    ).toMatchObject({ text: 'text only' });
  });

  it('coerces AI values and merges defaults', () => {
    expect(humanizeFieldKey('policy_type')).toBe('Policy Type');
    expect(
      coerceAiFieldValue({ key: 'insured', type: 'Checkbox' } as any, 'yes'),
    ).toBe(true);
    expect(
      coerceAiFieldValue(
        {
          key: 'policy_type',
          type: 'Dropdown',
          options: ['Vehicle', 'Life', 'Health', 'Homeowner/Renter'],
        } as any,
        'Auto insurance',
      ),
    ).toBe('Vehicle');
    expect(
      coerceAiFieldValue(
        {
          key: 'notify',
          type: 'RadioButtons',
          options: ['Notify organization'],
        } as any,
        'yes',
      ),
    ).toBe('Notify organization');
    expect(
      coerceAiFieldValue(
        {
          key: 'ownership_status',
          type: 'RadioButtons',
          options: ['Owned', 'Rented', 'Other'],
        } as any,
        'lease',
      ),
    ).toBe('Rented');
    const empty = createEmptyItemFromFields([
      { key: 'make', type: 'TextInput' },
      { key: 'insured', type: 'Checkbox' },
    ] as any);
    expect(empty).toMatchObject({ make: '', insured: false });
    expect(
      mergeAiPatchWithDefaults(
        { make: 'Honda' },
        [{ key: 'make', type: 'TextInput' }, { key: 'model', type: 'TextInput' }] as any,
        () => ({ make: '', model: '' }),
      ),
    ).toEqual({ make: 'Honda', model: '' });
  });

  it('places mismatched AI keys onto dropdown by option meaning', () => {
    const fields = [
      {
        key: 'policy_type',
        label: 'Policy Type',
        type: 'Dropdown',
        options: ['Vehicle', 'Life', 'Health'],
      },
      {
        key: 'policy_company',
        label: 'Insurance Company',
        type: 'TextInput',
      },
    ] as any;

    const placed = smartPlaceOntoFields(
      { coverage_kind: 'Life insurance', carrier: 'MetLife' },
      fields,
    );
    expect(placed.policy_type).toBe('Life insurance');
    expect(placed.policy_company).toBe('MetLife');

    expect(
      coerceAiFieldValue(fields[0], placed.policy_type),
    ).toBe('Life');
  });
});

describe('ai document upload + registry + routing maps', () => {
  it('validates AI document files', () => {
    expect(getReadableAiDocumentType('application/pdf')).toBe('PDF');
    expect(
      validateAiDocumentFile({
        type: 'application/pdf',
        size: 1000,
      } as File),
    ).toBeNull();
    expect(
      validateAiDocumentFile({
        type: 'application/exe',
        size: 1000,
      } as File),
    ).toMatch(/PDF/i);
    expect(
      validateAiDocumentFile({
        type: 'application/pdf',
        size: 20 * 1024 * 1024,
      } as File),
    ).toMatch(/15MB/i);
  });

  it('resolves AI section labels and filled-file markers', () => {
    expect(getAiSectionLabel('1')).toMatch(/Vital/i);
    expect(getAiSectionLabel('999')).toBe('Section 999');
    expect(pendingUploadKey('5', 'full')).toBe('5:full');

    const map = markSectionFilledForFile({}, 'file-1', '1');
    expect(isSectionFilledForFile(map, 'file-1', '1')).toBe(true);
    expect(clearFilledSectionsForFile(map, 'file-1')['file-1']).toBeUndefined();
    expect(
      isAiDocumentMismatchDetail({
        code: 'section_mismatch',
        file_id: 'abc',
        detected_section_id: '7',
      }),
    ).toBe(true);
  });
});

describe('vaultNavOrder', () => {
  it('applies custom subsection order and reorders ids', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(
      applySubsectionOrder(items, '5', { '5': ['c', 'a'] }).map(i => i.id),
    ).toEqual(['c', 'a', 'b']);
    expect(reorderIds(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a']);
    expect(reorderIds(['a', 'b'], 'a', 'a')).toEqual(['a', 'b']);
  });
});
