# FORMA fitness

A responsive fitness website implemented from the 23 supplied reference images. React 19, Vite, Tailwind CSS 4, Lucide icons, ESLint 9 and Node.js/Express 5.

## Run locally

Requires Node.js 22.9 or newer and npm.

```sh
npm install
npm run dev
```

Visit http://localhost:5173. Vite proxies `/api` to Express on port 3001. On Windows with restricted PowerShell scripts, use `npm.cmd` instead of `npm`.

```sh
npm run lint
npm test
npm run build
npm start
```

The production Express server serves the built frontend and API at http://localhost:3001. The backend npm scripts load `backend/.env` using built-in Node environment file support. Existing shell variables take precedence.

## Environment configuration

Local `frontend/.env` and `backend/.env` files are included in your working copy and ignored by Git. Their `.env.example` templates can be committed. For a new checkout, copy the examples before starting the app:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

| File | Variable | Default | Purpose |
| --- | --- | --- | --- |
| `backend/.env` | `PORT` | `3001` | Express API and production website port |
| `frontend/.env` | `API_PROXY_TARGET` | `http://127.0.0.1:3001` | Vite development proxy destination for `/api` |

If you change the backend port, update the frontend proxy target to match. Restart both services after changing environment files. Vite loads the frontend environment automatically; backend `dev` and `start` scripts use `--env-file-if-exists=.env`. If running Node directly from the project root, use `node --env-file-if-exists=backend/.env backend/index.js`.

The frontend uses relative `/api` requests in production, where Express serves both the API and built website. `API_PROXY_TARGET` is only used by the development server. Variables prefixed with `VITE_` are exposed to the browser; keep secrets in the backend environment.

## Screens and interactions

Performance essentials and product cards appear on the Shop screen, accessed through the footer Shop link. The landing page has no retail product section, and Shop is excluded from the primary navigation.

- Landing page, monthly/yearly memberships, equipment, shop, trainers, workout library, nutrition, dashboard and bookings.
- Search and category filters, product quick views, size selection, wishlist, quantity controls and demo checkout.
- Trainer, class and equipment reservation forms, waitlist requests, membership inquiries, contact and newsletter forms.
- Workout timer and completion, FAQ disclosures, mobile navigation, accessible native dialogs, labelled forms and reduced-motion support.

Navigation uses URL hashes. Cart, favourites and the personal booking diary persist in this browser using localStorage. The dashboard and nutrition figures are illustrative. The guided workout is a timer with a written session plan, not a streamed video.

## API and data

`GET /api/health` provides a health check. `POST /api/bookings`, `/api/memberships`, `/api/contacts`, `/api/orders` and `/api/subscriptions` accept JSON with a valid `email` and their relevant form fields. Bookings additionally require `item`, `date`, and `time`; orders require a nonempty `items` array. Successful responses return a generated ID. Submitted requests persist in MongoDB. Set `MONGODB_URI` and `MONGODB_DB` in `backend/.env` before using account and form routes. Missing configuration returns a clear 503 response; it never falls back to local JSON.

This is a prototype with member/admin authentication: no payment processing, inventory management, email delivery or live availability. Orders are explicitly demo requests. The diary remove action only affects this browser. Before a public production launch, configure your MongoDB access controls and backups, live booking capacity, trusted server-side catalog pricing, a payment provider and email delivery. Do not submit real payment or sensitive health information.

## Design system and reference assets

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for brand assets, colour and typography specifications, reusable components, responsive behaviour and the current project structure.

Dark background `#101114`, panel `#1a1d23`, border `#2a2e36`, accent `#d3243b`, muted text `#92959e`. Shared CSS components define type, spacing, cards, buttons and responsive grids. Tailwind 4 is integrated through the Vite plugin and imported in the stylesheet; theme tokens are defined in `@theme`. Layouts use wider 1600px content areas (1680px on large screens), larger typography and imagery, and reduced section spacing: 64px on desktop and 44px on mobile. Gutters range from 24px on desktop to 16px on mobile. Layouts adapt at 1050, 760 and 450px.

`images/` retains every supplied reference. `references.jpg` is a contact sheet of all 23 references. `frontend/public/assets/` contains image crops extracted from the landing reference, reused as assets rather than displaying complete screenshots as pages. Active content uses newly generated high-resolution Nigerian athlete and coach photography, matching equipment images, a dedicated image for each product, and Nigerian meal photography. Earlier reference crops remain as unused source assets. See [IMAGE_ASSETS.md](IMAGE_ASSETS.md) for provenance and generation briefs. The people and coach profiles are fictional demonstration content.

The site logo uses `frontend/public/assets/forma-logo-transparent.png`: red symbol, gold lettering and a transparent background. The favicon uses `frontend/public/favicon.svg`: only the red F symbol on solid black. The header displays it at 260px on desktop and 140-180px on mobile. Earlier logo assets and the PNG favicon remain unused.

## Structure

```text
gym/
  frontend/
    src/
      main.jsx           # React screens and interactions
      styles.css         # Tailwind and responsive design system
    public/
      assets/            # Reference imagery and active transparent logo
      favicon.svg        # Active red F favicon on black
      favicon.png        # Legacy favicon
    index.html
    .env                 # Local environment (ignored)
    .env.example         # Environment template
    vite.config.js
    eslint.config.js
    package.json
    dist/                # Generated production build (ignored)
  backend/
    index.js             # Express API and production static serving
    api.test.js          # API tests
    eslint.config.js
    .env                 # Local environment (ignored)
    .env.example         # Environment template
    package.json
    data/                # Local request storage (ignored)
  images/                # Original reference images
  references.jpg         # Reference contact sheet
  package.json           # Workspace commands
  package-lock.json      # Shared dependency lockfile
  .gitignore
  IMAGE_ASSETS.md        # Photography provenance and generation briefs
  DESIGN_SYSTEM.md       # Design rules and current project structure
  README.md
```

Install once from the project root with `npm install`. Root commands run both workspaces as appropriate. You can also run each service separately in two terminals:

```sh
npm run dev --workspace frontend
npm run dev --workspace backend
```

Frontend-only build: `npm run build --workspace frontend`. Backend-only tests: `npm test --workspace backend`. Express resolves `frontend/dist` relative to its own source file, so production serving works from either the root or backend directory.

## Member signup and gym administration

Use **Create account** in the footer to register a member account. Frontend validation lives in `frontend/src/validation/signup.js`; authoritative server validation lives in `backend/validation/signup.js`. Both report field-specific errors for name, email, password length (12-128 characters), matching confirmation and accepted terms. Emails are normalized and duplicates rejected. Accounts always receive the member role; passwords are stored as unique salted scrypt hashes in the MongoDB users collection. A unique email index prevents duplicate accounts, including concurrent requests.

Use **Admin sign in** in the footer to open gym management. Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in your local `backend/.env`, then restart the backend. There are no default administrator credentials. These variables belong only on the server. The environment credentials provide the original management login. Additional administrators are created from the Administrators section and stored in MongoDB.

The admin dashboard shows totals and the latest 500 member accounts, membership inquiries and audit events. The Members section shows registration timestamps, last sign-in and sign-in counts. Memberships shows requested plans, billing, confirmation, start and expiry dates. Activity filters member, admin, guest and anonymous events. Search and Refresh dashboard update the displayed records. Attendance and equipment telemetry are not recorded. Sessions use an HttpOnly, SameSite=Strict cookie, expire after eight hours and are cleared by server restarts. Sign out invalidates the session. Production cookies require HTTPS when `NODE_ENV=production`. Failed admin login attempts are limited to ten per IP per 15 minutes.

Account and management routes are in `backend/accounts.js`; MongoDB access and indexes are in `backend/database.js`. Members can use Sign in before Membership in the header. Sign-in uses the registered email and password and restores sessions after refresh. Member sessions use a separate HttpOnly cookie, expire after eight hours, and never grant administrator access. Sign out from the sign-in page. Bookings still use the existing device diary. Sign-in validation lives in frontend/src/validation/signin.js and backend/validation/signin.js; backend/memberAuth.js handles authentication and limits login attempts to ten per IP per 15 minutes. Account validation and authorization tests run with `npm test` against an isolated temporary MongoDB server, leaving your configured database untouched. The first test run downloads a MongoDB binary.

## MongoDB setup and migration

1. Set MONGODB_URI and MONGODB_DB=forma_fitness in backend/.env. Use a database user with read/write access to this database. Keep the URI private. For Atlas, allow the application host IP in your network access settings.
2. Run npm run migrate --workspace backend from the project root to import the existing backend/data/*.json files. The command preserves the originals and uses record IDs to avoid duplicating previously imported records. Existing membership inquiries stay pending; migration does not create paid or confirmed subscriptions.
3. Restart npm run dev. Open Admin sign in in the footer and use your ADMIN_EMAIL / ADMIN_PASSWORD.

The connection has a five-second server-selection timeout. No connection strings, passwords, password hashes or salts are sent to the management dashboard. MongoDB indexes enforce unique user emails and record IDs. Back up the database independently; local JSON files are migration sources only.

Management can accept a pending inquiry when the plan, billing and start date are valid. If an account exists for that email it is linked; an applicant without a website account can also be accepted, without creating login credentials. Confirmation is an explicit administrative action, not payment processing. Monthly/yearly access periods use calendar dates, clamping month-end dates (January 31 to February 28, for example). Confirmed future plans appear scheduled; expired periods appear expired. Newsletter subscriptions are separate from gym membership plans.

The audit collection records registrations, successful/failed member and admin sign-ins, sign-outs, public form submissions, dashboard views and membership confirmations. Signed-in browsers can report page views, cart additions, wishlist changes and workout starts/completions; those events are labelled browser-reported and are not proof of attendance or payment. Guest form identities are unverified. Historic sign-in data cannot be reconstructed from old JSON records and appears Not recorded until a new sign-in.

Sessions and login rate limits remain in server memory; sessions expire after eight hours and server restarts require signing in again. Use HTTPS in production (NODE_ENV=production enables Secure cookies). The environment account remains available as the original management account. Additional administrators have unique usernames/emails and individual passwords; all currently have full management access.

`GET /api/health` reports the HTTP process status. `GET /api/ready` pings MongoDB and returns 503 when the database is unavailable or not configured. Signup is limited to ten attempts per IP per 15 minutes. The MongoDB migration and live connection still require your own `MONGODB_URI`; adding a URI does not automatically import JSON files.

Membership pricing defaults to Nigerian naira: Starter ₦17,000, Standard ₦15,000, Premium ₦29,000 and VIP ₦40,000 monthly. Annual billing costs ten monthly payments. Management can change all four monthly prices in Admin → Pricing. Changes are validated, stored in MongoDB settings and audited. New inquiries store a server-generated price quote; existing quotes and confirmed memberships keep their recorded prices. Legacy pending inquiries without a price quote use the current rate on confirmation. Product/shop prices are separate from membership pricing.

## Data structure and validation

Each MongoDB collection now has a schema under `backend/schemas/`. See [schema documentation](backend/schemas/README.md) for field types, required fields, defaults, constraints, indexes and migration behavior. The application applies defaults and validates every stored insert/import/update. MongoDB also enforces strict collection validation. Unknown fields are rejected, and validation failures return HTTP 400 with field-specific errors. Installing validators does not rewrite existing records; future writes must satisfy the schema.

## Additional administrators

Sign in to gym management and open Administrators. Enter a unique username (3?32 characters, starting with a letter), email and a 12?128 character password with confirmation. Usernames and emails are normalized to lowercase and unique among administrators. The original management email is reserved. New administrators can sign in on the same management page using their username or email. All administrators can view member records, change pricing, confirm memberships and create additional administrators. Public member signup never grants admin access.

Administrator accounts have their own MongoDB collection, schema and unique indexes. Passwords use randomly salted scrypt hashes, are never returned to the browser, and cannot be viewed after creation. Creation records the acting administrator; admin sign-ins and management actions record the individual account ID and email. The environment account is identified as environment-owner in audit history. No real staff accounts are automatically created by the implementation or tests.

The original management account's dashboard portrait is stored locally as `backend/data/owner-profile.jpg` (ignored by Git). It is served through `/api/admin/profile/photo` only to that account after authentication, with no-store caching. Other administrators get an initial avatar until they upload their own photo. The dashboard shows a 96 � 96 px circular portrait, using CSS to frame the original photo. Preserve this private file when deploying or moving the application.

All administrators can use Change picture below their avatar. JPEG, PNG and WebP images are accepted up to 5 MB, with dimensions at least 96 x 96 pixels and at most 20 megapixels. Both browser and server validate uploads. The server verifies actual image contents, rejects damaged/animated/unsupported files, applies orientation, strips metadata and saves a 512 x 512 JPEG. Replacement photos are stored in MongoDB profilePhotos, survive server restarts, and are served only to the signed-in account with no-store caching. Invalid uploads preserve the previous photo. No administrator can select another account ID for photo access or changes. Successful changes appear in the audit log.

## Connected signup and member dashboard

Join buttons now open a combined signup/plan-selection flow with password and confirmation fields. Signup creates a signed-in member session. The chosen membership is submitted through an authenticated route that takes the member identity from that session, never from submitted email/userId fields. On success, signup and sign-in open the personal Dashboard. If the membership submission fails after signup, the UI retains the created account/session and lets the member retry the request without creating another account.

The dashboard reads `/api/member/dashboard`, showing only memberships linked to the authenticated account ID. It shows pending approval, active/scheduled/expired status, start/end dates and days remaining for active plans. It refreshes on focus, every minute and on request. Existing members can request another plan without registering again. The illustrative Alex dashboard has been replaced; the existing device booking diary remains separate.

Older email-only inquiries are not automatically exposed to a newly registered account. Management can use **Link member account** on an accepted legacy inquiry after checking the applicant. Approval also links a matching registered account automatically. No email-verification service is currently configured, so management must verify the applicant before linking legacy records.
