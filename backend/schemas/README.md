# Project data schemas

`backend/schemas/` defines the persisted MongoDB document structure. Every collection has its own file. `index.js` compiles the schemas, applies application defaults, normalizes email/name fields and installs MongoDB collection validators. `common.js` holds reusable field definitions.

| Collection | Required business fields | Types and validation | Defaults |
| --- | --- | --- | --- |
| profilePhotos | id, data, contentType | Account ID; bounded base64 image data; JPEG only after server decoding/resizing | contentType: image/jpeg |
| administrators | username, email, role, salt, hash, createdBy, signInCount | Unique lowercase username 3?32 characters; unique email; admin role; salted scrypt credentials; creator email and sign-in metadata | role: admin; signInCount: 0 |
| users | name, email, role, salt, hash, signInCount | Name 2–80 characters; normalized email up to 254 characters; role is member; salt is 32 lowercase hex characters; scrypt hash is 128 lowercase hex characters; nonnegative whole sign-in count | role: member; signInCount: 0 |
| memberships | email, plan, billing, startDate, status, currency | Starter/Standard/Premium/VIP; monthly/yearly; valid date; pending/confirmed; confirmed records additionally require confirmedBy, confirmedAt, expiresAt and price | status: pending; currency: NGN |
| bookings | email, item, date, time, waitlist, status | Item 1–200 characters; real calendar date; 24-hour HH:mm time; boolean waitlist; confirmed/waitlisted | waitlist: false; status derives from waitlist |
| orders | email, name, address, city, items, status | 1–100 items; each requires name, whole quantity 1–20 and size S/M/L/XL; name/address/city length limits | status: demo-order-received; item size: M |
| contacts | email, name, message, status | Name 2–80 characters; message 1–5,000 characters; new/resolved | status: new |
| subscriptions | email, status | Newsletter subscriptions, separate from gym plans; subscribed/unsubscribed | status: subscribed |
| activity | actor, actorId, email, action, target, details | Actor guest/anonymous/member/admin; action allowlist; bounded string metadata; no request bodies or passwords | actor: guest; optional identity and metadata strings: empty |
| settings | id, prices, currency | Only membership-pricing ID; exactly four plan names; each amount a whole naira value 1–100,000,000; optional updatedBy admin email | NGN; Starter 15,000; Standard 17,000; Premium 29,000; VIP 40,000 |

All documents require a nonempty string `id`, `createdAt` and `updatedAt`. The application generates UUIDs and UTC ISO timestamp strings. Insert/import preserves supplied valid timestamps; updates refresh updatedAt. Date-only values use YYYY-MM-DD. MongoDB uses an internal `_id` in addition to the application id. Existing string IDs and dates remain compatible with the frontend and legacy import.

Unknown fields are rejected, including plaintext password and confirmPassword fields. Nested order items and pricing objects also reject unknown fields. Defaults are applied only when a field is absent, not when null or malformed. AJV does not coerce incoming data types. MongoDB receives the same structural schema, with application-only default annotations removed; direct MongoDB writes must supply required fields explicitly because MongoDB does not apply these defaults.

Application validation checks calendar validity and requires membership expiry after start. MongoDB independently checks types, patterns, bounds, allowed fields and conditional confirmation requirements. Historical USD amounts can be retained on imported memberships; all new quotes and current pricing use NGN. Active, scheduled and expired membership labels are derived from confirmation status and dates rather than stored as independent states.

Unique indexes enforce application IDs in every collection, normalized user emails, and separate administrator emails/usernames. Additional indexes support creation-time sorting, member activity, membership email/status/expiry and booking lookup. MongoDB does not enforce foreign keys: the confirmation route links userId when a matching account exists. Membership acceptance also supports applicants without a website account. Public input never controls roles, confirmed status or quoted prices. Schema validation complements authentication and route authorization; it does not replace them.

Validators are created or updated on the application's first database connection, with strict/error enforcement. The database user needs permission to create collections/indexes and update collection validators (`collMod`). No live connection is required to edit or unit-test the definitions. Sessions and the configured administrator credentials remain outside these collections: sessions are in memory and the original administrator is configured using server environment variables. Additional administrators are stored in the administrators collection.

Existing MongoDB records are not automatically rewritten or deleted when validators are installed. Updates must satisfy the current structure. The JSON migration preflights every document against the schemas before importing any records, preserves original files, and adds defaults/timestamps. Invalid legacy records must be corrected before migration rather than silently discarded.

Validation failures return HTTP 400 with field paths in `errors`. Error output contains field/rule names, never submitted values or password hashes. Database-connection errors remain sanitized. Run `npm test` for defaults, malformed data, API flows, migration, and direct MongoDB validation tests; tests use an isolated temporary database.
