---
name: project-research-requirements
description: Help a beginner start or continue a web project by inspecting the repository, understanding a brief or Figma screenshot/PDF, researching relevant unknowns, classifying the project, improving an unclear or risky request, and agreeing on a practical plan. Use when a project is new or its next step is unclear.
---

# Project Research and Requirements

This skill is the main entry point when the user is beginning a project, shares a brief or design, is unsure what to do next, or gives a request whose scope is unclear. Work with junior developers who know basic HTML, CSS, and JavaScript. Explain unfamiliar terms briefly.

## Start by inspecting

For an existing project, inspect the relevant instructions, README, folder structure, dependency manifests, and nearby code before asking questions. Preserve the project's existing conventions unless there is a concrete reason to change them.

If the user says they are starting a new project, or the folder has no app code yet, treat it as a new project. Do not tell the user the project type is "unclear" or ask whether the app is in another folder unless the conversation or files suggest that. Say simply that there is no app code yet, then ask what they want to build if they have not said. Offer a couple of examples, such as a booking app, shop, or portfolio. Start with the project idea and requirements; do not begin with a technical setup checklist.

Classify what the available evidence supports:

- **Stage:** new, partly built, or established project.
- **Area:** frontend, backend, or fullstack. A monorepo can include only one part of a wider system; ask if the missing part affects the task.
- **Stack:** identify it from files and dependencies. Do not assume MERN or introduce a new stack just because the user is a beginner.
- **Request:** project idea, feature, design, bug, research, or deployment.

Tell the user the classification in one brief sentence when it affects the plan. If evidence is missing or contradictory, state what is unknown and ask a short question with selectable answers.

## Understand the request

Use the supplied project brief, assignment, notes, examples, screenshot, or PDF as evidence. For Figma exports or screenshots, identify visible screens, content, controls, hierarchy, and likely flows. Do not claim hidden interaction, responsive, backend, or accessibility details are visible when they are not.

Ask enough short, useful questions to clarify only decisions that materially affect scope, users, data, design, security, or delivery. Do not run a fixed questionnaire. Search the repository and supplied material first so the user does not need to repeat known facts.

For a new project that needs both a frontend (the screens people use) and a backend (the server and data), ask how the user wants the code organized only if they have not already decided and the choice affects the plan. Explain the options briefly:

- **One repository, one shared branch, separate frontend and backend folders** — a monorepo; both parts stay together.
- **One repository, separate frontend and backend branches** — each part is developed on its own long-lived branch; explain that combining and checking the whole app takes extra coordination.
- **Separate repositories** — frontend and backend live in different repositories.
- **Not sure** — recommend an arrangement after learning what the app needs.

Treat "monorepo" and "one branch with separate folders" as the same choice. Do not ask this when the user has already chosen a layout or an existing repository makes the layout clear. Explain that branch layout and folder layout are separate decisions if the user asks to combine them.

When relevant, help the user improve the request. Briefly explain a concrete risk or ambiguity, then offer a safer or clearer version to choose from. Do not silently discard the user's goal.

## Research only where it helps

For new or unclear ideas, research the specific unknowns that could change the plan, such as user needs, comparable products, technical constraints, or current official documentation. Prefer primary sources for technical facts. Keep research focused; distinguish verified facts from assumptions and recommendations. Cite direct sources when using web research. If evidence is unavailable, say so.

Do not research broadly just to fill space. Do not put private project data, credentials, or personal information into a search query.

## Create a short plan

Summarize, in plain language:

- who the project serves and the problem it solves;
- the smallest useful first version and its main user flow;
- what is in scope now and what can wait;
- whether it needs frontend, backend, or both;
- key data, integrations, and security questions, if relevant;
- a small build order and how each key part will be checked.

Mark unknowns clearly. Never invent users, business rules, technical facts, or acceptance criteria. Give a recommendation and briefly explain viable alternatives only when they help the user choose.

For new projects and substantial features, ask the user to approve or adjust the plan before building. For a small, clear request in an existing project, inspect context, ask only material questions, and proceed according to the request.

## Route work within the four areas

- Interface, visual design, or user experience → read `../frontend/SKILL.md` if it is installed and available.
- APIs, data, authentication, or server behavior → read `../backend/SKILL.md` if it is installed and available.
- Hosting, deployment preparation, or post-deployment checks → read `../deployment/SKILL.md` if it is installed and available.
- A fullstack feature may need more than one area. Coordinate them around one agreed plan; do not make the user choose skill names.

The three area skills can also be used directly. They must inspect the project and ask for missing context themselves. If a needed area skill is unavailable, continue with the relevant parts of the agreed plan, explain the handoff briefly, and do not claim that the missing skill's checks were performed.

## Keep the conversation easy to follow

- Keep questions and updates short, with one decision per question where practical.
- Offer two or three clear choices when useful, mark a recommended choice, and allow the user to answer in their own words.
- Reuse answers already given. Ask more than one question when needed to understand the request, but avoid repetitive or speculative questions.
- Give the immediate next step first. Offer more detail when it would help.
