# Orderly Affairs Design System

One palette, one type scale, one set of components — used identically across the owner portal, the next-of-kin portal, and both mobile apps. Built for people in their sixties and seventies, and for families reading it on the worst week of their lives.

## Floors

| Rule | Value |
|------|-------|
| Smallest type | 11px |
| Minimum text contrast | 4.5:1 |
| Border contrast on page ground | 3.40:1 |
| Smallest tap target | 44px |
| Gradients on large surfaces | 0 |

## Principles

- **Flat, no glass.** One paper background, one card surface, hairline borders, shadows only on floating layers.
- **AI is a lane, not a banner.** Inbox on the overview and a review rail inside each section — never a gradient hero.
- **Owner is primary;** NOK portal is secondary but must stay legible under stress.
- **Desktop 1440 / mobile 390.** Use `public/images/brand-logo.png` on every screen.

## 01 · Colour

Every ratio below is computed from the hex beside it.

### Brand & surfaces

| Token | Hex | Role / contrast |
|-------|-----|-----------------|
| Brand navy | `#213D59` · rgb(33,61,89) | Logo, titles, **auth left panels**, dark panels · 11.19:1 on white · white on it 11.19:1 |
| Pantone 540 C | `#00305C` · rgb(0,48,92) | Print match / deepest print surfaces · 13.31:1 |
| Blue (accent & link) | `#2B5A8C` | 7.13:1 on white · 6.10:1 on tint |
| Blue hover | `#3d6f9e` | 5.30:1 · hover; links stay underlined |
| Light blue tint | `#e7eef7` | AI / upload fills — never text itself |
| Page ground | `#f5f8fc` | Under white cards |
| Body text | `#33506e` | 8.36:1 on white · 7.15:1 on tint |
| Muted / secondary | `#5a6b80` | 5.46:1 on white · 4.67:1 on tint |
| Border | `#7688a1` | 3.40:1 on page ground — control boundaries |
| Hairline | `#dbe3ed` | In-card dividers only — never fill behind text |
| Card | `#ffffff` | Always with a visible border |

CSS variables: `src/app/globals.css` (`--navy`, `--navy-deep`, `--blue`, `--paper`, `--body-text`, …). Legacy aliases (`--ink`, `--accent-teal`) map to these values.

### Status — never hue alone

| Status | Shape | Colour |
|--------|-------|--------|
| Complete | Solid dot | `#2c7a63` at 5.16:1 · tint `#e7f2ee` |
| Needs you | Ringed dot | `#9a7326` · label `#6d4d15` at 7.19:1 · tint `#fff6e6` |
| Not started | Hollow ring | `#6c7e97` at 4.14:1 · no fill |
| Danger | — | `#a2453c` (irreversible actions only) |

Utility classes: `.status-complete`, `.status-needs-you`, `.status-not-started`.

### Do / Don’t

**Do:** flat solid fills on panels larger than a badge; one navy (or Pantone deep) panel per page; light blue for upload/AI; borders on every card.

**Don’t:** gradients across large areas; glass / backdrop blur on content; saturated blue on saturated blue; hairline as a fill behind text; green and blue tints in the same control group.

## 02 · Type

Manrope for UI, Poppins for human moments (letters, NOK portal), IBM Plex Mono for kickers/data. Floor: body ≥ 15px in product UI; labels ≥ 12px.

| Role | Size / line | Font |
|------|-------------|------|
| Display | 44–52 / 1.18 | Poppins 400 |
| Page title | 30–34 / 1.2 | Poppins 400 |
| Screen title | 20 / 1.3 | Manrope 600 |
| Section heading | 17 / 1.4 | Manrope 600 |
| Body | 16 / 1.65 | Manrope 400 |
| Body small | 14 / 1.6 | Manrope 400 |
| Field label | 13 / 1.4 | Manrope 500 |
| Kicker | 11 · .14em caps | IBM Plex Mono 500 |
| Reference data | 14 / 1.5 | IBM Plex Mono 500 |

Utility classes: `.text-display`, `.text-page-title`, `.text-screen-title`, `.text-section`, `.text-body`, `.text-body-sm`, `.text-label`, `.text-kicker`, `.text-reference`.

Fonts load in `src/app/layout.tsx`.

## 03 · Shape

| Token | Value | Use |
|-------|-------|-----|
| Button / control | 12px | `--corner-radius-button` |
| Card | 20px | `--corner-radius-card` |
| Modal | 28px | `--corner-radius-modal` |
| Panel | 40px | `--corner-radius-panel` |

## 04 · Navigation & AI

- **21 sections** group into the four vault groups already in the repo; sidebar includes ⌘K jump. Mobile keeps a 4-tab bar (`MobileDashboardChrome`).
- **AI lane:** `OverviewAiUploadCard` + `OverviewTaskBoard` on overview; section review rail via `SectionAiDocumentUploader` / detected-info panels — flat bordered surfaces on `#e7eef7`, not navy gradient dropzones.

## Implementation notes for mobile apps

Reuse the same hex tokens and type roles. Prefer CSS/theme variables over hard-coded iOS blue (`#007aff`) or legacy teal. AI and document surfaces use light blue tint `#e7eef7`; complete/success stays `#2c7a63`.
