import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, options);
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
