# pathey — Smart Model Router (Antigravity Skill)

Routes tasks to the cheapest/best free model per your diagram:

| Category | Model | Quota |
|---|---|---|
| Lightweight / fast (default) | Gemini Flash | 1,500/day |
| Content + copy | Mistral | 1B tokens/month |
| Heavy coding | DeepSeek V3 | 5M tokens (signup) |
| Complex reasoning (sparingly) | Gemini Pro | 100/day |

## Install

1. Copy this whole `pathey/` folder into your project's skills directory:
   ```
   <your-project-root>/.agents/skills/pathey/
   ```
2. Set your OpenRouter key as an environment variable (Antigravity will pass
   this through to the script when it runs):
   ```
   export OPENROUTER_API_KEY="sk-or-..."
   ```
3. Install the two Python deps the script needs:
   ```
   pip install requests pyyaml
   ```

## Use it

Inside Antigravity, just type something like:

- "Route this: fix the navbar CSS spacing"
- "Smart route — write the signup API endpoint"
- "Pathey, design the auth flow"

The agent reads `SKILL.md`, matches your phrase/task to a category, and runs
`scripts/route.py` for you. You'll see:

```
→ Using Gemini Flash because task matched 'Lightweight / fast tasks'
<actual model output>
```

## Customize

Open `references/model_map.yaml` to:
- change which model owns a category
- add/remove trigger keywords
- adjust quota numbers
No code edits needed — the script reads this file fresh every run.

## Run it standalone (without Antigravity)

```
python scripts/route.py --task "Fix a CSS spacing bug in the navbar"
python scripts/route.py --task "Design the auth flow" --category reasoning
```

## How escalation works

If the chosen model's API call errors out, pathey automatically retries once
using the `escalation.fallback_category` set in `model_map.yaml` (default:
Gemini Pro) — as long as Pro still has quota left for the day.
