# PECAT-E Design System — Master

Source of truth for colors, typography and spacing. The tokens live in three
files that must stay in sync:

| File | Role |
|---|---|
| `app/providers.jsx` | AntD `ConfigProvider` theme tokens |
| `tailwind.config.js` | Tailwind `colors.primary` scale + `fontFamily.sans` |
| `app/globals.css` | `:root` CSS vars (`--color-primary`, `--brand-gradient`, …) |

## Color

Brand: Pangeanic lime green, systematized into a full scale. The historical
`#98C441` is **accent only** (it fails contrast on white); the working primary
is `primary-700`.

| Token | Hex | Use |
|---|---|---|
| primary-50 | #F6FAEC | page tints, table header bg |
| primary-100 | #EAF3D3 | selected menu item, soft fills |
| primary-200 | #D7E8AC | pressed/soft borders |
| primary-500 / `bright` | #98C441 | badges, hovers, decorative accents — never text on white |
| primary-600 | #7FA836 | gradient end, hover on primary |
| **primary-700 (DEFAULT)** | **#5E7D26** | buttons, links, focus rings — 4.7:1 on white (AA) |
| primary-800 | #48611D | active states |
| primary-900 | #384C16 | gradient start, selected text |

Semantic (AntD tokens): success `#4D7C0F` · warning `#D97706` · error `#DC2626`.
Success light steps are pinned (`colorSuccessBg #EAF3D3`, `colorSuccessBorder
#C0DB7F`): antd would otherwise derive grayish tints from the olive seed.
Layout background: `#F8FAF5`; text base `#1C2617`.

Brand gradient (replaces the old navy→blue and navy→emerald wizard gradients):
`--brand-gradient: linear-gradient(135deg, #384C16 0%, #7FA836 100%)`.

## Typography

**Plus Jakarta Sans** everywhere, loaded with `next/font` in `app/layout.js`
(`--font-jakarta`, display swap). AntD `fontFamily` token points at the var.

Scale: H1 24/700 · H2 18/600 · body 14/400 (line-height ≥1.5) · small 12/500.

## Panel headers

Page and wizard hero panels use the brand gradient, never flat black:
`bg-gradient-to-br from-primary-900 to-primary-700` (hero variant in the
effort modal adds `via-primary-800`). Text inside stays `text-white`
(primary-700 keeps 4.7:1), subtitles `text-slate-300`, eyebrows
`text-primary-200`, decorative blurs `bg-primary-bright/25`.

## Icons

**lucide-react** is the only icon library (`@ant-design/icons` is fully
migrated out of our components; AntD keeps its internal icons for built-in
chrome like table sorters). Inline icons default to `size={15}`; spinners use
`<LoaderCircle className="animate-spin" />`; status icons take semantic hex
via `color`. A global `svg.lucide { vertical-align: -0.125em }` keeps them
aligned in text flow.

## Rules

- New components use Tailwind token classes (`bg-primary`, `text-primary`,
  `ring-primary/40`, `bg-primary-50`) or AntD defaults — never raw hex.
- Inline `style` gradients use `var(--brand-gradient)`.
- Deliberate exceptions (left as-is): AntD status icon colors in the TU editor
  (success/warning/error semantics), TM score colors (`components/TM/tus.jsx`),
  the avatar identity palette (`components/shared/UserAvatar.jsx`), and the
  per-step blue/sky/emerald section tints inside wizards.

## Page overrides

Page-specific deviations go in `design-system/pages/<page>.md` and override
this file.
