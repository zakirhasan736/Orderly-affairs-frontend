# Frontend automated testing

## Unit (Vitest)

```bash
npm install --legacy-peer-deps
npm test
```

## Cypress (E2E + component)

See [CYPRESS.md](./CYPRESS.md).

```bash
npm run test:component:cy
npm run test:e2e
```

## Playwright (E2E + smoke)

See [PLAYWRIGHT.md](./PLAYWRIGHT.md).

```bash
npx playwright install chromium
npm run test:playwright
npm run test:playwright:smoke
npm run test:playwright:ui
```

## Run everything

```bash
npm run test:all   # Vitest + Cypress component + Cypress E2E + Playwright
```

## What Vitest covers (66+ tests)

| Area | Files |
|------|--------|
| Auth / Access / Sections+AI / NOK / HTTP | `src/utils/__tests__/*` |
| UI flows (RTL) | `src/components/__tests__/*` |

## Scope note

Vitest = fast unit/logic. Cypress = browser E2E + component. Playwright = parallel browser E2E plus the vault smoke path (login → Section 0 → save → Access Management → AI autofill). Still critical-path coverage, not every portal button.
