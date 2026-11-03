# Hosted database connection investigation

The backend's Production MongoDB settings were updated with the user's approval from the working local configuration. MONGODB_DB is forma_fitness. Preview settings were preserved. Connection strings and passwords are not recorded here.

## Observations

- Local Node 24.12.0 can connect and ping MongoDB.
- The Production backend starts and serves /api/health, but /api/ready returns 503.
- Sanitized diagnostics identify ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR during the encrypted connection setup. DNS resolves; no password-authentication failure was observed in these connection attempts.
- An ephemeral HMAC comparison confirmed that the deployed MongoDB URI exactly matches the working local URI. Neither the URI nor its comparison fingerprint was printed.
- The user confirmed that the cluster is running and the same Atlas project has an active 0.0.0.0/0 entry.

## Read-only hosted comparisons

| Runtime | TLS library | Variations | Result |
| --- | --- | --- | --- |
| Node 24.22.2 | OpenSSL 3.5.8 | Default, IPv4, TLS 1.2, IPv4 with TLS 1.2 | Same TLS alert for all four |
| Node 22.23.4 | OpenSSL 3.5.8 | Default, IPv4, TLS 1.2, IPv4 with TLS 1.2 | Same TLS alert for all four |

The same four variations were also tested from Vercel region iad1 on Node 24.22.2; all failed with the same TLS alert. The production region lhr1 also fails. These results do not establish the exact infrastructure cause. They show that changing the Node major version, forcing IPv4 or selecting TLS 1.2 did not resolve the observed failure.

Diagnostic deployments are protected, are not promoted to the live domains, use read-only database pings, and are removed afterward. Temporary source/package changes are restored automatically. Certificate verification remains enabled. The normal application does not contain the temporary probe endpoint.

## Useful support evidence

The production hostname is backend-nu-two-k8s5zqa1ya.vercel.app. The failing production function region is lhr1. The Atlas SRV hostname is cluster0.pc3bopl.mongodb.net. Share the sanitized TLS error and comparison table with Atlas/Vercel support if platform-side investigation is needed; do not share connection strings, database passwords, authentication cookies or Vercel bypass tokens.

Do not disable certificate verification as a workaround. The phrase TLSV1 in the alert name does not establish that the client used obsolete TLS 1.0; explicitly tested TLS 1.2 connections produced the same alert.

All temporary diagnostic deployments have been removed. The live backend remains on its original Node 24 runtime and lhr1 region; no insecure TLS options were applied. The Atlas connector is unavailable because organization policy disables AI client access, so Atlas-side network settings and logs could not be independently inspected through that connector.

## Next investigation step

An Organization Owner can select the organization containing Cluster0, open Organization Settings > App Connections, enable AI client access, select Read, and save. This permits read-only investigation under the authorizing user's existing Atlas permissions. It does not itself fix the application's TLS failure. Connected tools cannot change this organization setting.

Official instructions: https://www.mongodb.com/docs/mcp-server/remote-mcp/manage-ai-client-access/

## Support request draft (not sent)

Our Vercel backend cannot complete a TLS connection to Atlas cluster0.pc3bopl.mongodb.net. The same MongoDB URI connects successfully locally on Node 24.12.0, and we verified that the deployed URI matches without exposing it. The owner confirms the cluster is running with an active 0.0.0.0/0 access-list entry in its project.

Hosted read-only pings return ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR on Node 22 and 24, in lhr1 and iad1, using default settings, IPv4, TLS 1.2, and IPv4 with TLS 1.2. Certificate verification remains enabled. Please investigate the TLS handshake failures and advise which sanitized timestamps or platform logs are needed.

## Verified Atlas inspection after access was enabled (2026-11-04)

Atlas access now succeeds. FormaGym project 6adb3e8e669f116f040fdd5d contains the matching Cluster0 hostname. Cluster0 is IDLE, not paused, on MongoDB 8.0.36 in AWS EU_WEST_3, with no OPEN alerts.

The verified network access list contains four individual IPv4 addresses and two Render CIDR ranges. It does NOT contain 0.0.0.0/0. This supersedes the earlier user-reported access-list observation. A network access mismatch is now the leading explanation for the hosted connection failures; it remains unconfirmed until hosted readiness passes after an appropriate access change.

No Atlas settings were changed. Prefer Vercel static egress IPs if available. Allowing 0.0.0.0/0 broadens network access and requires explicit user approval or a user-applied change. The earlier instruction to enable AI client access is now complete.

## Resolution (2026-11-04)

The user explicitly approved adding 0.0.0.0/0 to the FormaGym project network access list. The Atlas tool confirmed the entry was added, with comment: Approved by owner for Vercel backend connectivity. Existing entries were preserved.

Immediately afterward, https://backend-nu-two-k8s5zqa1ya.vercel.app/api/ready returned HTTP 200 with {"status":"ok","database":"mongodb"}. This confirms live application database readiness after the network access change. No redeployment, credential change, or TLS workaround was needed. The verified successful readiness check resolves the previously observed hosted connection failure.

The approved entry permits network connection attempts from any IPv4 address; database authentication and TLS remain required. A future move to fixed Vercel egress addresses would allow narrowing this entry.
