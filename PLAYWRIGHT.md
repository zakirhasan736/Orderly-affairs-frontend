# Playwright E2E testing

Browser E2E for the highest-risk Orderly Affairs portal flows (alongside Cypress + Vitest).

## Commands

```bash
# Install browser once
npx playwright install chromium

# Run all Playwright E2E (starts Next on :3002 with captcha off)
npm run test:playwright

# Interactive UI mode
npm run test:playwright:ui

# Smoke vault path only
npm run test:playwright:smoke

# HTML report
npx playwright show-report
```

## Coverage map

| Area | Spec |
|------|------|
| User login | `e2e/01-login.spec.ts` |
| User registration | `e2e/02-registration.spec.ts` |
| Checkout / trial | `e2e/03-checkout.spec.ts` |
| Form submission | `e2e/04-form-submission.spec.ts` |
| Navigation | `e2e/05-navigation.spec.ts` |
| API interactions | `e2e/06-api-interactions.spec.ts` |
| Dashboard | `e2e/07-dashboard.spec.ts` |
| Smoke: login → Section 0 → save → Access Management → AI autofill | `e2e/08-smoke-vault-flow.spec.ts` |

Helpers: `e2e/helpers/stubs.ts` (auth/session/billing/section route stubs + AI pending seed).

## Notes

- Uses `PLAYWRIGHT_DIST_DIR=.next-playwright` so it can run beside `npm run dev` (:3000) and Cypress (:3001).
- Captcha is disabled via `NEXT_PUBLIC_OTP_CAPTCHA_ENABLED=false` and `window.Cypress`-style runtime bypass is not required (Playwright sets the env on the Next process).
- APIs are stubbed with `page.route` — no live Stripe/Mongo required.
- This is still a **critical-path** suite, not every button in every section.
