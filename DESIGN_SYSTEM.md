# FORMA design system

This document records the design implemented from the supplied reference images. The styling source of truth is [frontend/src/styles.css](frontend/src/styles.css); React screens and interaction helpers live in [frontend/src/main.jsx](frontend/src/main.jsx).

## Brand and assets

FORMA uses a dark fitness aesthetic, restrained red accents, strong headings and photography focused on training. Keep primary actions visually distinct and use consistent cards across screens.

- Main logo: `frontend/public/assets/forma-logo-transparent.png`, edited from the user-supplied main logo using the built-in image generation tool. Gold FORMA lettering and TRAIN WITH PURPOSE tagline accompany the red angular symbol. The PNG background and internal negative spaces are transparent. Header width: 260px on desktop and `clamp(140px, 40vw, 180px)` on mobile. Footer width: 180px; dashboard preview: 150px. Preserve the aspect ratio. Earlier logo files are retained as unused legacy assets.
- Logo opacity: `1`, with a transparent CSS background. Keep the lettering and symbol fully visible while allowing the page background to show through.
- Favicon: `frontend/public/favicon.svg`, the red angular F symbol on a solid black (`#000000`) background. It contains no lettering or tagline. The full transparent logo is used for site branding only.
- Photography: `frontend/public/assets/`. Active photographs are high-resolution AI-generated assets with a contemporary Nigerian fitness direction: Nigerian athletes and fictional coaches, refined studio environments, warm daylight and natural skin textures. Equipment and product photography use consistent charcoal surfaces and warm highlights. See `IMAGE_ASSETS.md` for the asset list and generation briefs. Crop with `object-fit: cover`; avoid stretching.
- Original references: `images/`. `references.jpg` contains the reference contact sheet.
- Icons: Lucide React. Icon-only buttons need an accessible label.

### Logo editing brief

Tool: built-in image generation, edit mode. Brief: remove only the grey background, including internal negative spaces; preserve the red symbol, gold lettering, tagline, geometry and distress details; output a transparent PNG without added text or shadows. The original attachment remains the reference for exact geometry.

## Colour tokens

| Role | Value | Implementation |
| --- | --- | --- |
| Page background | `#101114` | Tailwind `forma-bg` |
| Card surface | `#1a1d23` | `--panel`, Tailwind `forma-panel` |
| Primary accent | `#d3243b` | `--red`, Tailwind `forma-red` |
| Logo lettering | `#d4af37` | Target gold in the logo image |
| Logo background | Transparent | PNG alpha and transparent `.logo` surface |
| Primary text | `#f3f3f4` | Root text colour |
| Muted text | `#92959e` | `--muted` |
| Card border | `#2a2e36` | `--border` |
| Secondary button | `#252a34` | `.secondary` |
| Primary hover | `#ec3049` | `.button:hover` |
| Success text | `#56b483` | `.status` |
| Error text | `#ffa1b0` | `.error` |
| Keyboard focus | `#ff5b71` | Interactive `:focus-visible` outline |

Tailwind 4 is imported using `@import "tailwindcss"`. The `@theme` block defines the three brand colours and the sans-serif font. Additional values above currently use CSS custom properties or component declarations rather than individual Tailwind tokens.

## Typography

Font family: Arial, Helvetica, sans-serif. Headlines use tight letter spacing; body copy uses a generous line height.

| Style | Default size | Weight / line height |
| --- | --- | --- |
| Main heading | `clamp(48px, 5.5vw, 84px)` | 750 / 1.06 |
| Section heading | `clamp(32px, 3.2vw, 44px)` | 700 / 1.2 |
| Card heading | 22px | 650 / 1.35 |
| Body | 16px (15px in cards) | Normal / 1.65 |
| Button | 15px | 600 |
| Form label / fine print | 13px | Normal |
| Eyebrow | 12px (11px in section/product labels) | 600, 1.6px letter spacing |

Page headings, hero headings and individual components have responsive overrides in the stylesheet. Use one main heading per screen and a logical heading order within sections.

## Layout, spacing and shape

- Main content: centred, maximum width 1600px with 24px horizontal padding; 1680px on screens at least 1440px wide. Gutters reduce to 20px at 1050px and 16px at 760px.
- Section spacing: 64px vertically on desktop, 44px on mobile. The hero starts 32px below the desktop header and 24px below the mobile header.
- Main grid gap: 16px, reducing to 14px on tablet. Card padding: 18px; product and trainer cards use 12px on desktop so images occupy more of the card. Section headings have a 22px bottom gap.
- Cards: 8px corner radius and a 1px border. Inputs and buttons: 5px radius. Dialogs: 12px radius.
- Existing spacing commonly uses 8, 12, 16, 20, 24 and 30px; these are CSS values rather than a separate spacing-token API.

## Image sizing

Larger imagery and reduced outer spacing give the interface more visual presence. Images retain their existing assets and use cover cropping rather than stretching.

| Image | Desktop | Tablet (up to 1050px) | Mobile (up to 760px) | Small mobile (up to 450px) |
| --- | --- | --- | --- | --- |
| Hero | 560px; 640px at 1440px+ | 500px | 460px | 400px |
| Trainer | 380px | 310px | 330px; final full-width card 400px | 380px |
| Product | 280px | 220px | 240px | 280px |
| Equipment | 250px | 250px | 250px | 250px |
| Workout | 300px | 300px | 300px | 300px |
| Dialog image | 340px | 340px | 280px | 280px |

On mobile, the hero heading is 64px, reducing to 54px on small phones; section headings are 33px and page headings are 42px. Buttons, inputs and navigation remain readable without increasing empty space around them. The full main logo uses the brand sizing above; the favicon uses only the red F symbol on black.

### Editorial image treatment

Use restrained gold (`#c8ae75`) section labels, charcoal card gradients and subtle borders. Hero imagery has a fine gold border and soft shadow; maintain realistic skin tones without heavy CSS filters. Meal photographs use 250px cover crops (230px on mobile; 300px in dialogs). Product images have a gentle 1.025 hover zoom and respect reduced-motion preferences. Card photographs are lazy-loaded; the hero is prioritised. Coach identities and profiles are demonstration content, not claims about real people.

## Reusable components

| Component | CSS / React entry | Behaviour |
| --- | --- | --- |
| Primary action | `.button`, `button()` helper | Red fill, hover feedback, disabled saving state |
| Secondary action | `.button.secondary` | Neutral fill with a visible border |
| Card | `.card` | Shared surface for products, plans and training content |
| Featured plan | `.plan.featured` | Red border and recommendation tag |
| Section heading | `.section-heading`, `heading()` helper | Eyebrow, heading and optional description |
| Filters / billing | `.filters`, `.billing` | Selected option uses the primary accent |
| Status tag | `.status`, `.tag` | Text communicates state as well as colour |
| Form controls | `label`, `input`, `textarea` | Visible labels, required fields and focus feedback |
| Dialog | Native `dialog`, `.modal-content` | Close control, Escape support and backdrop dismissal |
| Feedback | `.toast`, `.error` | Live status messages and inline request errors |
| FAQ | Native `details` and `summary` | Keyboard-accessible disclosure |

Rendering helpers currently live together in `main.jsx`; there are no separate `components/` or `pages/` folders in this implementation.

Header height is 104px on desktop and 76px on mobile to accommodate the wider logo. Navigation switches to a menu at 1200px to avoid crowding; content grid breakpoints remain unchanged.

## Responsive behaviour

| Viewport | Layout changes |
| --- | --- |
| At least 1440px | Wider content container and taller hero imagery |
| Up to 1200px | Menu navigation accommodates the wider header logo |
| Up to 1050px | 20px gutters; four-column content becomes two columns except stats |
| Up to 760px | Mobile navigation, stacked hero, two-column content cards, 16px gutters, 44px section spacing |
| Up to 450px | Content grids become one column; stats retain two columns; stacked hero actions |

Dialogs fit within the viewport and scroll vertically. Preserve mobile navigation, image proportions and full-width form controls when adding content.

## Shop placement

The landing page focuses on membership, coaching and the training experience. It does not render the Performance essentials section, product cards or a Visit the shop action. Shop is linked from the footer Explore area and is excluded from desktop and mobile primary navigation. The Shop screen retains its product catalog, filters, quick views, wishlist and cart interactions.

## Interaction and accessibility

Use native buttons, links and form controls. Provide descriptive image alternatives and names for icon-only actions. Retain visible keyboard focus and reduced-motion overrides. Keep loading, success and error messages explicit. The current implementation includes these foundations; browser and accessibility audits have not established formal conformance.

Navigation uses URL hashes. Cart, wishlist and the booking diary persist in localStorage. Express stores submitted requests locally. Checkout is a demo; dashboard and nutrition metrics are illustrative. Keep those distinctions visible when modifying the interface.

## Current project structure

```text
gym/
|-- frontend/
|   |-- src/
|   |   |-- main.jsx             # React screens, helpers, state and dialogs
|   |   `-- styles.css           # Tailwind entry, tokens and responsive components
|   |-- public/
|   |   |-- assets/
|   |   |   |-- forma-logo-transparent.png # Active site logo
|   |   |   |-- forma-main-logo.png # Legacy grey background logo
|   |   |   |-- forma-logo.png   # Legacy screenshot wordmark
|   |   |   `-- *.jpg            # Training, equipment and product imagery
|   |   |-- favicon.svg         # Active red F favicon on black
|   |   `-- favicon.png         # Legacy favicon
|   |-- index.html              # React entry HTML and favicon declaration
|   |-- vite.config.js          # React/Tailwind plugins and development API proxy
|   |-- eslint.config.js
|   |-- package.json
|   |-- .env                    # Local proxy configuration; ignored
|   |-- .env.example            # Committed environment template
|   `-- dist/                   # Generated production build; ignored
|-- backend/
|   |-- index.js                # Express API, local persistence and static serving
|   |-- api.test.js             # API validation and routing tests
|   |-- eslint.config.js
|   |-- package.json
|   |-- .env                    # Local server port; ignored
|   |-- .env.example            # Committed environment template
|   `-- data/                   # Generated local JSON storage; ignored
|-- images/                     # Original design reference screenshots
|-- references.jpg              # Reference contact sheet
|-- package.json                # npm workspaces and combined commands
|-- package-lock.json           # Shared dependency lockfile
|-- .gitignore
|-- IMAGE_ASSETS.md             # Photography provenance and generation briefs
|-- DESIGN_SYSTEM.md            # Design rules and project structure
`-- README.md                   # Setup, commands and implementation notes
```

Dependencies in `node_modules/` and the local `.npm-cache/` are ignored and omitted from the tree above. Root npm commands coordinate the frontend and backend workspaces. See [README.md](README.md) for installation and environment setup.

## Maintaining the system

Update shared styles before adding one-off variants. Reuse existing rendering helpers where appropriate. When changing a token, component, breakpoint or folder, update this document and the README structure together. Check affected layouts at desktop and mobile widths, preserve focus and loading states, and run the relevant root lint, test and build commands when implementation changes.
