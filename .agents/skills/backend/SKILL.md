---
name: backend
description: Inspect, plan, build, and improve backend features for beginner web projects, including APIs, database design, authentication, authorization, and integrations. Choose an architecture and database from project evidence and requirements, and include security and quality checks throughout. Use for backend or data work.
---

# Backend

Build backend features for junior developers who know basic web development. Support MongoDB and other databases and frameworks. Do not assume MERN, a relational database, or a particular hosting provider.

## Inspect and clarify

Read project instructions and inspect the existing server, dependencies, API routes, database models or schema, migrations, tests, configuration, and nearby code relevant to the request. Identify whether the repository is frontend-only, backend-only, fullstack, or unclear from the available evidence; identify how its backend connects to any frontend. State the classification briefly when it affects the plan.

Understand the user actions, data, access rules, integrations, and failure cases needed for this feature. Ask enough short, useful questions to resolve decisions that change system behavior or safety. Reuse facts already in the prompt or repository.

## Choose the simplest suitable design

Recommend one approach based on the data shape, query needs, current stack, experience, security, operational complexity, and stated budget. Give the reason in one or two plain sentences. Mention up to two relevant alternatives when they help the beginner understand the tradeoff; do not force them to choose routine implementation details.

Decide from the needs, not from a favorite technology:

- Choose a document database when flexible, nested documents match the data and access patterns.
- Choose a relational database when relationships, constraints, and multi-record transactions are central.
- Prefer the existing database when it fits the feature. Do not propose a database migration without a concrete reason and an approved plan.
- Select identifiers based on database support, distributed generation needs, index behavior, and exposure. Do not claim UUIDs are inherently insecure or always slow. Explain relevant alternatives briefly when the choice matters; do not turn every technical detail into a question for the user.

Keep architecture simple enough to understand and operate. Explain what can safely wait instead of adding layers for hypothetical scale.

## Design security into the feature

Plan and implement authorization at the server and data access point for every protected record and action. A hard-to-guess ID is not authorization. Validate and constrain inputs; handle errors without exposing secrets or sensitive internals; keep credentials in environment or platform secret storage; consider abuse limits for public or expensive actions; and protect uploads, sessions, and integrations when relevant.

For authentication, consider registration, login, logout, password recovery, session/token storage, expiry, role/ownership checks, rate limits, and error behavior as appropriate to the actual app. Use maintained framework or provider features when suitable. Never invent a security guarantee or claim compliance from a checklist.

For important current security guidance, consult current official documentation and reputable primary security sources. Separate code evidence from live behavior that has not been tested.

## Build and verify

For a new project or substantial feature, first agree on a short plan covering endpoints or operations, data model, validation, access rules, key failure cases, and checks. Wait for approval of that plan before implementation. Then build in small logical steps with brief progress updates.

Reuse the repository's conventions. Implement the feature so it satisfies its requirements, not as a draft to be rescued by a later review. As each part is built, check its behavior and security boundary using available tests or tools. For authorization, consider tests with different users or roles. Run only appropriate checks and report exactly what was verified.

Before calling the work complete, check the feature against its agreed behavior, contract, data constraints, and security risks. Fix discovered issues when in scope. State any remaining uncertainty or check that could not be run. The user can request a separate, deeper review at any time.

If `../frontend/SKILL.md` or `../deployment/SKILL.md` is available, read it when the feature needs UI or deployment coordination. If either is absent, continue with the relevant checks in this skill: define the API contract for the UI, keep secrets in server or provider configuration, and account for migrations and deployment settings before release. Do not claim a sibling skill was applied when it was not available.

## Handoff

Explain the change briefly, the checks actually performed, required configuration without revealing secret values, and any remaining step in plain language.
