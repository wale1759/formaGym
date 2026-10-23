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
