# Live preview review

Reviewed on 3 November 2026 (Australia/Brisbane).

## Scope

The protected frontend preview and its isolated backend preview were reviewed. Production releases and production data were not used. The user approved temporary member accounts and a membership request in forma_fitness_preview, with removal of those exact records afterward.

Frontend: https://frontend-balwjfnpr-sanmiafolabi1759-1000s-projects.vercel.app

Backend: https://backend-1vpo80mo2-sanmiafolabi1759-1000s-projects.vercel.app

## Verified behavior

- Nine public screens rendered: Home, Membership, Equipment, Shop, Workouts, Nutrition, Bookings, Signin and Signup.
- The mobile menu opened at 390 pixels wide; the membership page had no horizontal page overflow at that width.
- Browser signup created a member session and opened the personal dashboard.
- The member cookie used Secure, HttpOnly, SameSite=Strict and the /api path.
- Reload restored the session. Sign-out removed access; signing in restored the dashboard.
- A member request remained pending. Submitted email/userId fields did not replace the session-derived identity.
- A second member could not see the first member's request.
- Unauthenticated member/admin routes returned 401. A member without an approved active plan received 403 for the instructor catalog. A member session could not read administrator activity.
- Unknown API routes returned JSON 404 responses. The tested .env and backend/.env paths returned 404 without exposing environment secrets.
- No browser page errors or HTTP 5xx responses were observed during the successful browser flow.

## Remaining observations

The API returns X-Powered-By: Express and does not set a general X-Content-Type-Options header. This is a small hardening opportunity; it was not an observed authentication bypass or data leak. Profile-photo responses already set nosniff in source.

The live shop displays ????? before the rating rather than stars. This is a cosmetic placeholder issue, confirmed in the deployed page.

## Limits

This was a targeted review, not an exhaustive penetration test. Administrator login/approval, photo uploads, confirmed instructor bookings and concurrent live approval races were not exercised. Local automated tests cover additional behavior, but that is separate evidence from this live review. No load testing, payment processing or email delivery was attempted.

The backend preview remains public only at the explicitly approved preview domain. Its exception has no automatic expiry and must be removed manually when preview testing is finished. Frontend Vercel Authentication remains enabled.

## Cleanup

Cleanup completed. The successful run removed two generated accounts, one membership request, two sessions and eight related activity records. An earlier interrupted browser run also had its one generated account, session and two activity records removed. Both disposable protected cleanup deployments were removed afterward. The cleanup route was never added to the normal preview or production source. No production data or other preview users were deleted.
