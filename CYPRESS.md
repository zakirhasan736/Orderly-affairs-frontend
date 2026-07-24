# Cypress E2E, integration & component testing

## Commands

```bash
# Unit (Vitest)
npm test

# Cypress component tests (no Next server required)
npm run test:component:cy

# Cypress E2E (starts Next on :3001 with captcha disabled)
npm run test:e2e

# Interactive Cypress
npm run test:e2e:open
npm run cypress:open:component

# Everything
npm run test:all
```

E2E uses `NEXT_PUBLIC_OTP_CAPTCHA_ENABLED=false` so Cloudflare Turnstile does not block forms in CI/local automation.

## Coverage map

| Area | Specs |
|------|--------|
| User login | `cypress/e2e/01-login.cy.ts` |
| User registration | `cypress/e2e/02-registration.cy.ts` |
| Checkout / trial | `cypress/e2e/03-checkout.cy.ts` |
| Form submission (auth) | `cypress/e2e/04-form-submission.cy.ts` |
| Navigation | `cypress/e2e/05-navigation.cy.ts` |
| API interactions | `cypress/e2e/06-api-interactions.cy.ts` |
| Dashboard | `cypress/e2e/07-dashboard.cy.ts` |
| Integration journey | `cypress/e2e/08-integration-auth-checkout.cy.ts` |
| Vault section forms (0–21) | `cypress/e2e/09-section-form-submissions.cy.ts` — open each section, fill text inputs, Save / section POST (plus Access / NOK letter / messages smoke) |
| Component tests | `cypress/component/*.cy.tsx` — AI dialog, autofill banner, phone input, Access Person card |

Shared stubs: `cypress/support/commands.ts` (`stubAuthApis`, `stubAuthenticatedOwner`, `visitVaultAsOwner`, `openVaultSection`, `fillVisibleTextFields`, `clickSectionSave`).

Section catalog: `cypress/fixtures/vaultSections.ts`.

Run only vault section forms:

```bash
npx start-server-and-test "next dev -H 127.0.0.1 -p 3001" http://127.0.0.1:3001 "npx cypress run --e2e --spec cypress/e2e/09-section-form-submissions.cy.ts --config baseUrl=http://127.0.0.1:3001"
```

Or via the normal suite: `npm run test:e2e`.

## Notes

- E2E stubs backend APIs with `cy.intercept` (no live Stripe/Mongo required).
- Auth UI selectors use `data-cy` hooks on the login/checkout page.
- Component tests mount isolated React widgets via Cypress + Vite.
- Vitest remains the fast unit layer; Cypress covers browser E2E/integration/component.
