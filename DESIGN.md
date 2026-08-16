# Orderly Affairs Design System

Native Next.js portal tokens. Colors match the live store on orderly-affairs.com. There is no Elementor in this app.

Built for people in their sixties and seventies, and for families reading it on a hard week.

## Floors

| Rule | Value |
|------|-------|
| Smallest type | 11px |
| Minimum text contrast | 4.5:1 |
| Border contrast on page ground | 3.40:1 |
| Smallest tap target | 44px (icon buttons 38px / 32px compact) |
| Gradients on large surfaces | 0 |

## 01 · Colour

### Brand & surfaces

| Token | Hex | Role |
|-------|-----|------|
| Navy, primary | `#213D59` | Logo, titles, auth panels, primary buttons |
| Navy deep | `#16293C` | Pressed / darkest surfaces |
| Navy soft, hover | `#2C4B6B` | Hover on navy fills |
| Accent blue | `#3EB1E5` | Fills, bars, icons, **large headings only** |
| Accent mid | `#619FCE` | Secondary accent |
| Accent light | `#7ACAF9` | Highlights on navy |
| Slate, secondary | `#6A7481` | Secondary copy |
| Muted text | `#7A8794` | Labels, captions |
| Link (small text) | `#2E7FAD` | Links and small text on white |
| Accent surface | `#EAF6FD` | AI / upload fills, never body text |
| Page background | `#F6F8FA` | Under white cards |
| Border | `#E4EAF0` | Card and hairline borders |

**Accessibility:** `#3EB1E5` on white is ~2.2:1. Do not use it for links or small text. Use `#2E7FAD` or darker, or place the accent on navy.

### Status

| Status | Colour | Surface |
|--------|--------|---------|
| Complete | `#1F9D6B` | `#E8F6F0` |
| Due soon | `#B4761A` | `#FDF4E4` |
| Overdue or missing | `#C2442E` | `#FBEDEA` |

## 02 · Type

System font stack (same as the live store). Do not load Google Fonts on Vault pages. If Inter is added later, self-host 400, 600, and 750 only.

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Hero heading | 29px | 750 | Letter spacing -0.028em |
| Section heading | 27px | 750 | Letter spacing -0.028em |
| Panel heading | 19px | 700 | Letter spacing -0.02em |
| Card title | 15.5px | 700 | One line, ellipsis |
| Body | 15px | 400 | Line height 1.55 |
| Secondary | 13px | 400 | Muted color |
| Kicker / eyebrow | 10.5px | 700 | Uppercase, letter spacing 0.1em |
| Numbers | inherit | inherit | `font-variant-numeric: tabular-nums` on amounts, account numbers, dates |

Utilities: `.text-hero`, `.text-section-heading`, `.text-panel`, `.text-card-title`, `.text-body`, `.text-secondary`, `.text-kicker`, `.oa-num`.

## 03 · Shape

| Token | Value | Applies to |
|-------|-------|------------|
| Radius, small | 8px | Chips, inline pills |
| Radius, default | 12px | Inputs, small cards, category tiles |
| Radius, large | 16px | Item cards, stat cards |
| Radius, extra large | 22px | Panels, hero blocks |
| Radius, pill | 99px | Buttons, search, badges, progress bars |
| Shadow, resting | `0 1px 2px rgba(33,61,89,.06)` | Cards at rest |
| Shadow, hover | `0 2px 8px rgba(33,61,89,.07)` | Cards on hover, with a 2px lift |
| Shadow, overlay | `0 18px 48px rgba(33,61,89,.16)` | Drawer, search results |
| Transition | `.16s ease` | Hover. Drawer: `.28s cubic-bezier(.32,.72,0,1)` |

## 04 · Components

All 18 live in `src/components/vault-ui`. Do not invent one-offs when one of these covers the screen.

1. Sidebar nav item
2. Sidebar collection header
3. Progress bar
4. Progress ring
5. Button (primary navy, accent blue, ghost; default and small)
6. Icon button
7. Global search (`/` focuses)
8. Attention chip
9. Stat card
10. Category tile
11. Section tile
12. Item card
13. Add card
14. Form field (including masked reveal)
15. Upload zone
16. Detail drawer
17. Permission toggle row
18. Empty state

## 05 · Copy

- First mention: Orderly Affairs Vault. Then: Vault.
- Verbs: build, keep, access, stock.
- Lead with everyday use. Next-of-kin value is a side effect.
- Empty states are invitations.
- Use commas, colons, parentheses, or semicolons. No em dashes in portal UI.
- Never call it a kit in the portal. The kit is the physical product.
- No "fill out". No 50/50 now/later framing. No leverage, seamless, empower, unlock your potential.
- Legal disclaimer is a bordered callout in Instructions, and a persistent footer line on Legal Documents and Estate Planning.
