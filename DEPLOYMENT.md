# Release workflow

The local repository has two branches:

- `main` holds the baseline / approved release.
- `production` holds changes for review and validation before they are merged into `main`.

Use plan → review → implement for future changes. Agree on the plan before implementation. Discuss additions outside that plan separately.

Work on `production`, run `npm run lint`, `npm test`, and `npm run build`, then review `git diff main...production`. After the user approves the release, merge `production` into `main`. This task does not publish a remote repository, merge into main, or deploy a website. A hosting target and Git remote have not been configured.

Runtime configuration belongs in ignored `backend/.env` and `frontend/.env`, or the hosting service's environment settings. Follow `.env.example` for variable names. Credentials, MongoDB data, uploaded personal photos, dependencies and generated builds stay out of Git. When deploying, keep MongoDB access configured and run the Express backend with the built frontend. Secure cookies require HTTPS and NODE_ENV=production. Sessions currently live in server memory and require sign-in again after a restart.

The approved plan prices are Starter NGN 15,000, Standard NGN 17,000, Premium NGN 29,000 and VIP NGN 40,000. For an existing database with the reversed Starter/Standard default prices, run `npm run pricing:correct --workspace backend`. The command is idempotent, preserves other customized prices and old quotes, and records an audit event. It changes only the exact reversed default pair, rather than overwriting manual pricing changes.

Deferred by the user: email verification and password recovery. Manual membership approval and the sample class schedule remain in place. New external services require a separate approved plan.
