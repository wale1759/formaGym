# Release workflow

The local repository has two branches:

- `main` holds the baseline / approved release.
- `production` holds changes for review and validation before they are merged into `main`.

Use plan → review → implement for future changes. Agree on the plan before implementation. Discuss additions outside that plan separately.

Work on `production`, run `npm run lint`, `npm test`, and `npm run build`, then review `git diff main...production`. After the user approves the release, merge `production` into `main`. This task does not publish a remote repository, merge into main, or deploy a website. A hosting target and Git remote have not been configured.

Runtime configuration belongs in ignored `backend/.env` and `frontend/.env`, or the hosting service's environment settings. Follow `.env.example` for variable names. Credentials, MongoDB data, uploaded personal photos, dependencies and generated builds stay out of Git. When deploying, keep MongoDB access configured and run the Express backend with the built frontend. Secure cookies require HTTPS and NODE_ENV=production. Sessions currently live in server memory and require sign-in again after a restart.

The approved plan prices are Starter NGN 15,000, Standard NGN 17,000, Premium NGN 29,000 and VIP NGN 40,000. For an existing database with the reversed Starter/Standard default prices, run `npm run pricing:correct --workspace backend`. The command is idempotent, preserves other customized prices and old quotes, and records an audit event. It changes only the exact reversed default pair, rather than overwriting manual pricing changes.

Deferred by the user: email verification and password recovery. Manual membership approval and the sample class schedule remain in place. New external services require a separate approved plan.

## Vercel frontend and backend projects

The existing deployment uses two Vercel projects from this repository:

- Frontend root directory: `frontend`; framework Vite; build `npm run build`; output `dist`.
- Backend root directory: `backend`; framework Express; entry `index.js`, which now exports the Express app as default. Vercel manages the listener; the local `npm start` listener is used only outside Vercel.

The frontend's `vercel.json` forwards `/api/*` to the existing backend domain `https://backend-nu-two-k8s5zqa1ya.vercel.app`. Browser requests remain on the frontend origin, including the HttpOnly authentication cookies. The Vite development proxy is only for local development and does not configure production routing. If the backend domain changes, update this rewrite before redeploying the frontend.

In the **backend project's** Vercel environment settings, configure `MONGODB_URI`, `MONGODB_DB=forma_fitness`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the intended Production/Preview environments. Never prefix these with VITE_ or put them in the frontend project's build configuration. Local ignored `.env` files are not uploaded from Git. Redeploy the backend after environment changes. Verify the Vercel database user can create/update collection validators and indexes, and configure Atlas network access for the backend's deployment network. The required network entries depend on your Vercel networking setup; a local computer's IP allowlist is insufficient for remote functions.

Deploy the backend first and verify `/api/health` returns JSON 200. Then `/api/ready` must return JSON 200 to confirm MongoDB access. Deploy the frontend and check both endpoints again through the frontend domain to validate the rewrite. A function-invocation failure before `/api/health` means a backend startup/packaging problem; inspect backend Runtime Logs rather than changing database credentials blindly. A JSON 503 from `/api/ready` means the function started but database configuration/connectivity still needs attention.

Important remaining deployment limitation: member/admin sessions and login rate limits currently live in process memory. Vercel can run multiple instances and restart them, so sessions can be lost or unrecognized across requests. A separately reviewed persistence change is needed before relying on this authentication setup for a public production launch. This routing fix does not introduce new authentication services or change your Atlas access policy.

### Create a database-backed owner account

The administrator schema is in `backend/schemas/administrators.js`. An `_id` alone is not an account: email, username, salted hash, role, application ID and timestamps are required.

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in local `backend/.env` (password: 12–128 characters). Optionally set `ADMIN_USERNAME` (defaults to `gym-owner`) and `ADMIN_MONGODB_ID` (defaults to the owner ObjectId supplied for this project). Run from the repository root:

```sh
npm run admin:setup --workspace backend
```

The command validates the existing schema, creates a uniquely salted scrypt hash, and inserts into `forma_fitness.administrators`. It never prints credentials or replaces an existing account. The record uses application ID `environment-owner` to preserve the owner's profile association. Do not paste a plaintext password into Atlas or commit `.env`.

The deployed backend still needs `MONGODB_URI` and `MONGODB_DB` configured in Vercel's Production environment. A local `.env` is not uploaded. Once this database account exists, it can sign in using its email or username without the owner environment variables on Vercel. If `ADMIN_EMAIL` is configured there, the existing environment-owner login takes precedence for that email, so keep its password consistent or remove both owner variables to use database authentication.

### Persistent management sessions

Admin sessions now live in MongoDB `adminSessions`, shared across backend instances and redeployments. Only a SHA-256 digest of each random 256-bit token is stored; the token stays in the HTTP-only cookie. Sessions expire after eight hours, are checked on every admin request, and are deleted on logout. Signing in again from the same browser rotates its session. Expired records are rejected immediately and removed when encountered or during later sign-ins. An expiry index supports cleanup; it is not a TTL index because the project stores timestamps as ISO strings.

Deploy the updated backend with access to the same MongoDB database. Collection validation and indexes are installed automatically. Existing memory-only admin sessions cannot migrate: administrators must sign in once after deployment. No new session secret environment variable is required. Rate-limit counters still use instance memory.

### Member dashboard reliability

Member sessions now use the shared MongoDB `memberSessions` collection, following the same token hashing, eight-hour expiry, rotation and logout rules as admin sessions. Both signup and signin await session persistence before returning success. This keeps dashboard access available when later requests reach different backend instances. Existing memory-only member sessions require a fresh signin after deployment. Rate-limit counters still use instance memory.

Management can select **Review pending memberships** from the dashboard to open the pending queue. Confirming a pending request records its dates and links an existing member account; the member dashboard then shows the accepted plan and expiry. A second confirmation is rejected. Deploy frontend and backend changes together to make these updates live.

### Owner-only administrator creation

Only the authenticated gym owner (the reserved application identity `environment-owner`) can create administrators. This identity works with either the environment owner login or the database-backed owner created by `admin:setup`. Other administrators receive HTTP 403 from `POST /api/admin/administrators`, even if they submit owner flags or IDs. The dashboard hides their creation form while retaining the administrator list and their existing management permissions. Existing sessions are subject to this rule on each request; no account migration is needed.

### Subscriber-only instructor booking

Instructor profiles and session requests now live in the member dashboard. Public navigation and the landing-page instructor section no longer show the profiles; the legacy `#Trainers` route points members to their dashboard. The protected instructor catalogue requires an approved, currently active subscription on every request, for every membership tier. Instructor names/descriptions come from `backend/instructors.js`.

Members submit instructor ID, session date and one of the configured times. The backend derives identity from the session and keeps the request pending. All instructor sessions last 45 minutes and use Nigeria's `Africa/Lagos` timezone (WAT, UTC+1); `startsAt`/`endsAt` are stored as UTC ISO timestamps. The full session must fit within an active subscription. `shared/gym.js` centralises the gym timezone and the initial four session times. These are request times, not live availability promises.

Both the owner and other administrators can open **Instructor bookings** and accept requests. Approval rechecks subscription coverage and rejects past/already accepted requests. Unique MongoDB indexes prevent an instructor or a member having two confirmed sessions in the same time slot, including concurrent approvals. Duplicate member requests return their existing record. Each request and acceptance is recorded in the activity log. Members can view only their own instructor requests and refresh to see approval status.

The new `instructorBookings` collection is separate from existing class `bookings`. Its schema, indexes and audit action enums are installed by the normal database initialization; no existing account or class data is deleted or migrated. Public class requests remain available, while the old public personal-training submission path is rejected. Existing class records retain their stored date/time values; confirm historical timezone interpretation before any data migration. Current interface schedules and admin timestamps now display Nigeria time.

Deploy the backend and frontend together from the reviewed production branch. Existing owner-only administrator creation, member sessions, membership approvals/upgrades, password controls and the hero video remain supported. Instructor session cancellation, rejection, calendar management and email notifications are outside this update.
