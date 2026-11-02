---
name: frontend
description: Inspect, plan, build, and improve frontend pages and features for beginner web projects. Create a product-appropriate design direction and design system, interpret supplied Figma screenshots/PDFs, and build accessible, responsive interfaces with security and quality checks. Use for frontend or visual user experience work.
---

# Frontend

Build frontend work for junior developers who know basic HTML, CSS, and JavaScript. Adapt to the repository's actual framework and existing conventions; do not assume React, Tailwind, or MERN.

## Inspect and clarify

Read applicable project instructions and inspect the relevant pages, components, styles, assets, package files, and tests before proposing changes. Identify whether the repository is frontend-only, backend-only, fullstack, or unclear from the available evidence, and whether this request touches the frontend. State the classification briefly when it affects the plan. Identify existing UI patterns and preserve a coherent established design system.

Understand the user, purpose, main action, target devices, and acceptance criteria from the request and code. Ask enough short, useful questions to fill gaps that would change the design or behavior. Do not ask about details that can be inferred from the project.

If the prompt asks for a choice that would create a usability, accessibility, or security problem, name the specific concern in plain language and offer a safer option while preserving the user's goal.

## Design with intent

When a design system already exists, follow it. When a Figma screenshot or PDF is supplied, use it as a reference for the visible layout and styling, and ask about behavior that the image cannot show.

When no design direction is established, ask a concise question informed by the product and audience. Offer two or three meaningfully different directions, each with a short, concrete description, and recommend one. For example:

> Which direction fits this learning dashboard?
> - Clear and calm — recommended for frequent study sessions
> - Bright and playful
> - Compact and practical

Search the local design catalog tags for the product type, audience, and task; use `rg` when available or scan the headings if it is not. Select one or two relevant directions, then choose a small, varied set of matching real examples from the page-reference library. Vary the number and combination across requests to reduce the chance that different projects draw on the same examples; keep the picks relevant and do not promise a unique set. Summarize only the useful traits in a sentence or two, link the pages, and use them to shape the two or three design choices you offer. Do not list the full catalog or make the user research it.

The catalog contains starting points, not templates or rules. Adapt recommendations to the user's audience, project constraints, existing UI, and supplied Figma or screenshot. Do not copy a reference page's exact layout, copy, branding, assets, or code. A link is not proof that a design works for this project's users. Live visual inspection is always opt-in. If a reference may have changed or live details would materially improve the design decision, ask whether the user wants browser inspection and explain that it may take extra time and tokens. Follow [the live reference inspection guide](references/live-reference-inspection.md) for the user's choice and fallback. Text search alone does not count as visual inspection.

Read [the product design catalog](references/design-catalog.md) for matching directions and [the real-page references](references/page-references.md) for examples. If neither is relevant, say so briefly and use repository and user-provided evidence instead. Browse live pages only after the user opts in or explicitly asks for live research. When opted in, find a small number of relevant references and explain the traits to adapt. Avoid generic default layouts and interchangeable AI-looking pages. Make choices about hierarchy, typography, color, spacing, content, and interaction that fit this product. Do not rely on arbitrary bans on particular fonts, colors, or styles.

Before coding, make a compact design brief from evidence in the request or repository: audience and main task; one visual direction; type and color roles; layout and spacing approach; and one product-specific detail that makes the interface recognizable. Keep this to a few bullets. Do not generate a separate mockup unless requested; move from the approved direction to implementation to save time.

For a new project or several connected screens, include a small design-system note in the plan. After the user approves the plan, save the agreed rules in `design-system/MASTER.md` if that file does not already exist. For a single small change, keep the brief in the conversation and follow the existing project system.

Before handoff, check the page against this quick design review:

- Does the first screen make the product and main action clear?
- Do typography, color, spacing, and layout support this product's audience and content?
- Is there a deliberate visual detail tied to the product? Use cards, gradients, and pill buttons only when they fit the product and content.
- Are the content and controls plausible for the real task, including loading, empty, success, and error states where needed?
- Does the result remain readable and usable at narrow and wide widths?

Treat these as prompts to inspect the actual interface, not as a style recipe. Keep the design consistent with supplied references and project conventions.

For multi-screen work, define only the design rules needed to keep the screens consistent: semantic color and type roles, spacing, components, interaction states, and responsive behavior. Keep the system small enough for the user to maintain.

## Build and check as you go

After the user approves a plan for a new project or substantial feature, build in small logical steps. Give brief progress updates. Do not ask permission for routine coding choices already covered by the plan and repository conventions; ask when a new material choice or side effect appears.

Build the requested UI with:

- clear hierarchy and realistic content;
- semantic controls, labels, and keyboard behavior;
- responsive layouts and visible focus;
- loading, empty, success, and error feedback where the interaction needs them;
- motion that supports the task and respects reduced-motion settings;
- existing project components and dependencies where suitable.

Include security in frontend decisions: do not expose secrets in client code, do not trust client-side validation as authorization, and handle user-controlled content safely according to the framework. If `../backend/SKILL.md` is available, read it for API and access-control coordination. If it is not installed, agree on the API contract and treat all protected data and actions as requiring server-side authorization.

Check each key part while building using the project's available checks. Review responsive behavior, essential states, keyboard access, console/build results where available, and the requested acceptance criteria. Do not claim checks passed unless they were run. Fix problems before presenting the feature as complete; report any remaining gap plainly.

## Handoff

Give a brief result: what changed, what was checked, and any important remaining issue. Offer further review on request. For a fullstack feature, coordinate backend and deployment checks through their area skills.
