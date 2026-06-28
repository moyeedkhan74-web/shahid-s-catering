---
name: pathey
description: >
  Smart multi-model router for website-project tasks. Trigger this skill when the
  user says things like "route this", "route properly", "use routing", "smart route",
  "choose best model", "follow diagram", "use the right model", "according to rules",
  "apply routing", "router:", "model router", "pathey", or when a task clearly falls
  into one of these buckets: (1) lightweight/fast tasks like checking page loads,
  quick bug fixes, CSS tweaks, simple HTML, periodic checks, (2) content/copy like
  page copy, error messages, README docs, blog posts, (3) heavy coding like writing
  components, API integrations, backend routes, database queries, test generation,
  or (4) complex reasoning like system architecture, complex logic planning, auth
  flow design, SEO strategy, hard debugging. Use this skill to pick the best free
  model for the task and run it instead of always defaulting to the main agent model.
---

# Pathey — Smart Model Router

You are acting as an intelligent router for this website project. Your job is to
look at the task, decide which category it belongs to, and delegate the actual
work to the best-suited model via OpenRouter — instead of doing it yourself with
the default model.

## Step 1 — Classify the task

Match the task against these four categories (same as the project's routing diagram):

| Category | Examples | Model |
|---|---|---|
| **Lightweight / fast** (default) | checking page loads, quick bug fixes, CSS tweaks, simple HTML structure, periodic site checks | `google/gemini-3.5-flash` |
| **Content + copy** | page copy, error messages, README docs, blog posts | `mistralai/mistral-large` |
| **Heavy coding** | writing components, API integrations, backend routes, database queries, test generation | `deepseek/deepseek-chat` |
| **Complex reasoning** (use sparingly — limited quota) | system architecture, complex logic planning, auth flow design, SEO strategy, hard/stubborn debugging | `google/gemini-2.5-pro` |

If nothing matches clearly, default to **Lightweight / fast** (Gemini Flash) — never
default to Pro, it has the tightest quota (100/day).

## Step 2 — Run the router script

Execute:

```bash
python scripts/route.py --task "<the user's full task text, verbatim>"
```

This will:
- classify the task (you can also pass `--category` yourself if you're confident,
  e.g. `--category coding`)
- look up the right model + quota in `references/model_map.yaml`
- check local usage tracking (`.pathey_usage.json`) so Pro's 100/day cap isn't blown
- call the model through OpenRouter
- auto-escalate once to Gemini Pro if the first call fails or errors out
- print the result prefixed with `→ Using [Model Name] because <reason>`

## Step 3 — Relay the result

Take the script's output and present it to the user as-is, keeping the
`→ Using [Model Name] because...` line at the top so they always know which
model did the work.

## Notes

- Requires `OPENROUTER_API_KEY` to be set in the environment (see references/model_map.yaml
  for where keys/quotas are configured).
- Quotas are tracked per calendar day (Flash/Pro) or per calendar month (Mistral) in
  `.pathey_usage.json`, created automatically next to the script on first run.
- Edit `references/model_map.yaml` any time to change which model handles which
  category, or to adjust quota ceilings — no code changes needed.
