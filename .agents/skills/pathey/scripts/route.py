#!/usr/bin/env python3
import argparse, datetime, json, os, sys
from pathlib import Path
import requests, yaml
from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
CONFIG_PATH = SKILL_DIR / "references" / "model_map.yaml"
USAGE_PATH = SCRIPT_DIR / ".pathey_usage.json"
ENV_PATH = SKILL_DIR / ".env"
load_dotenv(ENV_PATH)

def load_config():
    with open(CONFIG_PATH) as f: return yaml.safe_load(f)

def load_usage():
    return json.loads(USAGE_PATH.read_text()) if USAGE_PATH.exists() else {}

def save_usage(u):
    USAGE_PATH.write_text(json.dumps(u, indent=2))

def period_key(period):
    t = datetime.date.today()
    return t.isoformat() if period=="day" else t.strftime("%Y-%m") if period=="month" else "total"

def check_quota(cat_name, cat_cfg, usage):
    q = cat_cfg.get("quota", {}); limit = q.get("limit"); period = q.get("period","day")
    key = period_key(period); bucket = usage.setdefault(cat_name, {}); count = bucket.get(key,0)
    if limit and count >= limit: return False, count, limit
    bucket[key] = count+1; usage[cat_name] = {key: bucket[key]}; return True, bucket[key], limit

def classify(task, config):
    tl = task.lower()
    for n,c in config["categories"].items():
        for kw in c.get("keywords",[]):
            if kw in tl: return n
    for n,c in config["categories"].items():
        if c.get("is_default"): return n
    return next(iter(config["categories"]))

def get_key(cat_cfg):
    k = os.environ.get(cat_cfg["api_key_env"])
    if not k: print(f"ERROR: {cat_cfg['api_key_env']} not set"); sys.exit(1)
    return k

def call_google(model, task, key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    r = requests.post(url, headers={"x-goog-api-key": key, "Content-Type":"application/json"},
        json={"contents":[{"parts":[{"text":task}]}]}, timeout=120)
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]

def call_deepseek(model, task, key):
    r = requests.post("https://api.deepseek.com/chat/completions",
        headers={"Authorization":f"Bearer {key}","Content-Type":"application/json"},
        json={"model":model,"messages":[{"role":"user","content":task}]}, timeout=120)
    r.raise_for_status(); return r.json()["choices"][0]["message"]["content"]

def call_mistral(model, task, key):
    r = requests.post("https://api.mistral.ai/v1/chat/completions",
        headers={"Authorization":f"Bearer {key}","Content-Type":"application/json"},
        json={"model":model,"messages":[{"role":"user","content":task}]}, timeout=120)
    r.raise_for_status(); return r.json()["choices"][0]["message"]["content"]

def call_groq(model, task, key):
    r = requests.post("https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization":f"Bearer {key}","Content-Type":"application/json"},
        json={"model":model,"messages":[{"role":"user","content":task}]}, timeout=60)
    r.raise_for_status(); return r.json()["choices"][0]["message"]["content"]

CALLERS = {"google":call_google,"deepseek":call_deepseek,"mistral":call_mistral,"groq":call_groq}

def call_cat(cat_cfg, task): return CALLERS[cat_cfg["provider"]](cat_cfg["model"], task, get_key(cat_cfg))

def run(task, forced):
    config = load_config(); usage = load_usage()
    cat_name = forced or classify(task, config)
    if cat_name not in config["categories"]: print(f"ERROR: unknown category '{cat_name}'"); sys.exit(1)
    cat_cfg = config["categories"][cat_name]
    ok,used,limit = check_quota(cat_name, cat_cfg, usage)
    if not ok:
        print(f"Quota exhausted for {cat_cfg['model_display_name']}. Using default.")
        for n,c in config["categories"].items():
            if c.get("is_default"): cat_name,cat_cfg=n,c; break
        check_quota(cat_name, cat_cfg, usage)
    save_usage(usage)
    print(f"-> Using {cat_cfg['model_display_name']} because task matched '{cat_cfg['label']}'")
    try:
        print(call_cat(cat_cfg, task)); return
    except Exception as e:
        esc = config.get("escalation",{}); ff = esc.get("fast_fallback")
        if ff and ff["provider"] != cat_cfg.get("provider"):
            print(f"Warning: {cat_cfg['model_display_name']} failed. Trying {ff['model_display_name']}...")
            try:
                k = os.environ.get(ff["api_key_env"])
                if not k: raise RuntimeError(f"{ff['api_key_env']} not set")
                print(CALLERS[ff["provider"]](ff["model"], task, k)); return
            except Exception as e2: print(f"Fast fallback failed: {e2}")
        fb = esc.get("fallback_category")
        if not fb or fb==cat_name: print(f"ERROR: {e}"); sys.exit(1)
        fb_cfg = config["categories"][fb]; usage2=load_usage()
        ok2,_,_ = check_quota(fb, fb_cfg, usage2); save_usage(usage2)
        if not ok2: print("ERROR: all fallbacks exhausted"); sys.exit(1)
        print(f"Escalating to {fb_cfg['model_display_name']}...")
        try: print(call_cat(fb_cfg, task))
        except Exception as e3: print(f"ERROR: {e3}"); sys.exit(1)

def main():
    p = argparse.ArgumentParser(); p.add_argument("--task", required=True); p.add_argument("--category", default=None)
    a = p.parse_args(); run(a.task, a.category)

if __name__ == "__main__": main()
