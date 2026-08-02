/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { MultiItemAutofillDialog } from '@/components/ai/MultiItemAutofillDialog';
import { AiPendingUploadBanner } from '@/components/ai/AiPendingUploadBanner';
import Section0PersonalInformation from '@/components/sections/Section0PersonalInformation';
import { AccessPersonCard } from '@/components/AccessPersonCard';
import { PhoneNumberInput } from '@/components/PhoneNumberInput';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

describe('MultiItemAutofillDialog (AI popup flow)', () => {
  it('lists extracted items and fires add-all / add-first actions', async () => {
    const user = userEvent.setup();
    const onAddAll = vi.fn();
    const onAddFirstOnly = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <MultiItemAutofillDialog
        open
        onOpenChange={onOpenChange}
        itemLabel="Vehicle"
        items={[
          { make: 'Honda', model: 'CR-V' },
          { make: 'Toyota', model: 'RAV4' },
        ]}
        describeItem={item => `${item.make} ${item.model}`}
        onAddAll={onAddAll}
        onAddFirstOnly={onAddFirstOnly}
      />,
    );

    expect(screen.getByText(/2 vehicles found/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Honda CR-V/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Toyota RAV4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add all 2 vehicles/i }));
    expect(onAddAll).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole('button', { name: /only fill the first vehicle/i }),
    );
    expect(onAddFirstOnly).toHaveBeenCalledTimes(1);
  });

  it('labels first-only action with target card index', () => {
    renderWithProviders(
      <MultiItemAutofillDialog
        open
        onOpenChange={() => {}}
        itemLabel="Policy"
        items={[{ type: 'Life' }, { type: 'Auto' }]}
        describeItem={item => item.type}
        targetIndex={1}
        onAddAll={() => {}}
        onAddFirstOnly={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: /only fill policy #2/i }),
    ).toBeInTheDocument();
  });
});

describe('AiPendingUploadBanner (AI ready popup/actions)', () => {
  it('runs autofill, show-upload, and dismiss actions', async () => {
    const user = userEvent.setup();
    const onAutofillNow = vi.fn();
    const onScrollToUpload = vi.fn();
    const onDismiss = vi.fn();

    renderWithProviders(
      <AiPendingUploadBanner
        pendingUpload={{
          file_id: 'file-1',
          mime_type: 'application/pdf',
          targetSectionId: '5',
          targetSectionKey: 'vehicles',
          uploadScope: 'full',
          highlightUpload: true,
          createdAt: Date.now(),
          documentSummary: 'Registration for two cars',
        } as any}
        onAutofillNow={onAutofillNow}
        onScrollToUpload={onScrollToUpload}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText(/ready to auto-fill/i)).toBeInTheDocument();
    expect(screen.getByText(/registration for two cars/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /auto-fill now/i }));
    expect(onAutofillNow).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /show upload/i }));
    expect(onScrollToUpload).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('Section0PersonalInformation (continue flow)', () => {
  it('marks instructions read only after explicit confirmation', async () => {
    const user = userEvent.setup();
    const onFullyRead = vi.fn();
    const onContinue = vi.fn();

    renderWithProviders(
      <Section0PersonalInformation
        onFullyRead={onFullyRead}
        onContinue={onContinue}
      />,
    );

    expect(
      screen.getByRole('button', { name: /i've read these instructions/i }),
    ).toBeInTheDocument();
    expect(onFullyRead).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /i've read these instructions/i }),
    );
    expect(onFullyRead).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole('button', { name: /continue to vital information/i }),
    );
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe('AccessPersonCard (trusted person card actions)', () => {
  it('renders person state and fires edit/delete', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <AccessPersonCard
        item={{
          full_name: 'Sebastian Casey',
          email: 'seb@example.com',
          phone_number: '+15551234567',
          relationship: 'Spouse',
          access_level: 'Full Kit Access',
          authorized_sections: ['all'],
          immediate_access: true,
        }}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Sebastian Casey')).toBeInTheDocument();
    expect(screen.getByText(/spouse/i)).toBeInTheDocument();
    expect(screen.getByText(/immediate access/i)).toBeInTheDocument();
    expect(screen.getByText(/seb@example.com/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /delete|remove/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('PhoneNumberInput (auth phone field state)', () => {
  it('emits E.164 for US national typing and shows validation when requested', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onValidationChange = vi.fn();

    const { rerender } = renderWithProviders(
      <PhoneNumberInput
        value=""
        onChange={onChange}
        showValidation={false}
        onValidationChange={onValidationChange}
        label="Mobile number"
      />,
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '2025550123');

    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)?.[0] as string;
    expect(last).toMatch(/^\+12025550123$/);

    rerender(
      <PhoneNumberInput
        value="+12025550123"
        onChange={onChange}
        showValidation
        onValidationChange={onValidationChange}
        label="Mobile number"
      />,
    );

    expect(onValidationChange).toHaveBeenCalledWith(true);
  });
});
