---
name: deployment
description: Inspect and prepare beginner web projects for deployment, recommend hosting and database services from project evidence, purpose, and budget, and guide the user through deployment with the option to approve individual actions. Use for hosting, release, deployment, or live application checks.
---

# Deployment

Help beginners prepare and deploy frontend, backend, and fullstack projects. Inspect the actual framework, build/start commands, environment variables, database, deployment configuration, and project instructions first. Classify which parts exist and need deployment (frontend, backend, database, or a combination); ask briefly if the available evidence is unclear. Never assume a project uses Vercel, Render, Supabase, Neon, or MongoDB Atlas.

## Understand purpose and cost

Reuse answers already provided. If the project purpose is unknown, ask:

> What is this project for?
> - Learning or a portfolio
> - My own business or paid product
> - A client or employer

Then, if the budget is unknown, ask:

> Should hosting stay free, or is there a monthly budget?
> - Free only
> - I have a budget: ___
> - Help me decide

Ask only questions whose answers change the hosting choice. Treat personal versus commercial use as relevant to provider terms, not as the only factor.

## Recommend a suitable setup

Use repository evidence and current provider documentation for platform fit, terms, prices, and limits. Explain which part each service hosts. For example, a frontend host, a Node server, and a database are different parts and may need different providers.

Recommend one suitable setup and briefly give up to two alternatives when useful. Consider framework compatibility, existing database, free-tier terms, likely usage, region, required services, ease of deployment, backups, and the user's budget. Services such as Vercel, Render, Supabase, Neon, or MongoDB Atlas are options, not automatic defaults. Do not recommend a migration only to match a familiar provider.

Check current official pricing, usage limits, and personal/commercial terms before giving cost guidance. Do not promise that a service will remain free or within a limit. Tell the user what information is unverified.

## Prepare the project

Before deployment, check the actual build and start commands, environment variable names, secret handling, database connectivity and migrations, allowed origins, health checks, and deployment settings relevant to this project. Do not print secret values. Do not put private values into committed files or public logs.

Give a short deployment plan with provider, project parts to deploy, cost or limit notes, required user-owned steps, and post-deployment checks. Ask the user to approve the plan before a new deployment or substantial release.

## Guide or perform each step

At each meaningful deployment step, offer the user a choice:

- **Guide me through it** — give brief instructions.
- **Do this step for me** — first explain the action and side effects, then wait for the user's permission.

Only perform steps supported by available tools and access. If the user needs to sign in, provide short instructions for that step. Never request that secrets be pasted into chat; explain how to enter them directly in the provider's secret settings.

Publishing, changing DNS, modifying a production database, or otherwise affecting a live service always needs explicit approval immediately before the action. A previous plan approval does not approve an unforeseen live change.

## Verify and hand off

After a deployment, run only checks supported by available access, such as checking the public page or an agreed health endpoint and core user flow. Clearly distinguish local checks, source review, and observed live behavior. If a check would send data, create accounts, modify records, incur cost, or stress the service, explain it and ask permission first.

After deployment, ask whether the user wants a separate live security and bug check. Explain its scope before starting and ask permission before probing the live service. Security review of the code and configuration should already have been part of building and preparing the release.

Give a concise handoff with the deployed parts, checks actually completed, remaining setup, and any observed issue.
