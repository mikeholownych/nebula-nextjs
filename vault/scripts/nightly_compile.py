#!/usr/bin/env python3
"""
Nightly vault compile pass.
Reads vault/raw/, compares against last-compiled watermark,
builds an LLM prompt for any new/changed files,
then writes entity/concept page updates and commits diffs.
"""

import os, sys, json, hashlib, datetime, subprocess, textwrap

VAULT   = os.path.expanduser("~/nebula/vault")
RAW     = os.path.join(VAULT, "raw")
WTRMRK  = os.path.join(VAULT, ".compile_watermark.json")

def sha(path):
    return hashlib.md5(open(path, "rb").read()).hexdigest()

def load_watermark():
    if os.path.exists(WTRMRK):
        return json.load(open(WTRMRK))
    return {}

def save_watermark(wm):
    json.dump(wm, open(WTRMRK, "w"), indent=2)

def get_raw_files():
    out = []
    for root, dirs, files in os.walk(RAW):
        for f in sorted(files):
            p = os.path.join(root, f)
            out.append(p)
    return out

def find_changed(raw_files, watermark):
    changed = []
    for p in raw_files:
        h = sha(p)
        rel = os.path.relpath(p, RAW)
        if watermark.get(rel) != h:
            changed.append((rel, p, h))
    return changed

def read_vault_pages():
    pages = {}
    for folder in ["entities", "concepts"]:
        d = os.path.join(VAULT, folder)
        if not os.path.exists(d):
            continue
        for f in os.listdir(d):
            if f.endswith(".md"):
                p = os.path.join(d, f)
                pages[f"{folder}/{f}"] = open(p).read()
    return pages

def read_index():
    p = os.path.join(VAULT, "INDEX.md")
    return open(p).read() if os.path.exists(p) else ""

def build_prompt(changed_files, existing_pages, index_content):
    raw_content = ""
    for rel, path, _ in changed_files:
        content = open(path).read()
        raw_content += f"\n\n--- raw/{rel} ---\n{content}"

    existing = ""
    for k, v in existing_pages.items():
        existing += f"\n\n--- {k} ---\n{v}"

    prompt = textwrap.dedent(f"""
    You are the vault compiler for Nebula Components.

    VAULT RULES:
    1. One lesson per file, with a one-line summary at the top.
    2. Update the existing page instead of creating a duplicate.
    3. Delete notes that turn out to be wrong.
    4. Never edit /raw. Keep sources and compiled pages separate.
    5. Every compiled page links back to the raw source it came from.

    NEW/CHANGED RAW FILES TO PROCESS:
    {raw_content}

    EXISTING COMPILED PAGES (for context — update in place, don't duplicate):
    {existing}

    CURRENT INDEX.md:
    {index_content}

    TASK:
    For each concrete thing found in the raw files (a client, competitor, tool, person),
    create or update a page in entities/. For each idea, strategy, or lesson, create or
    update a page in concepts/.

    Output ONLY a JSON object with this shape:
    {{
      "pages": {{
        "entities/filename.md": "full file content",
        "concepts/filename.md": "full file content"
      }},
      "index_additions": [
        "- [[slug]] — one-line description"
      ],
      "summary": "one paragraph of what changed and why"
    }}

    Only include pages that actually changed. If nothing in a raw file maps to a new
    or updated page, leave pages empty. Output raw JSON only — no markdown fences.
    """).strip()
    return prompt

def call_llm(prompt):
    """Call the LLM via the Hermes Python API if available, else skip."""
    try:
        import anthropic
        client = anthropic.Anthropic()
        msg = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        return msg.content[0].text
    except Exception as e:
        return json.dumps({
            "pages": {},
            "index_additions": [],
            "summary": f"LLM call failed: {e}. Run manually."
        })

def apply_updates(result_json):
    diffs = []
    try:
        data = json.loads(result_json)
    except json.JSONDecodeError as e:
        return [f"JSON parse error: {e}\nRaw output:\n{result_json[:500]}"]

    for rel_path, content in data.get("pages", {}).items():
        full_path = os.path.join(VAULT, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        old = open(full_path).read() if os.path.exists(full_path) else ""
        if old == content:
            continue
        open(full_path, "w").write(content)
        # Simple diff summary
        old_lines = set(old.splitlines())
        new_lines = set(content.splitlines())
        added   = [f"+ {l}" for l in new_lines - old_lines if l.strip()][:10]
        removed = [f"- {l}" for l in old_lines - new_lines if l.strip()][:10]
        diffs.append(f"\n### {rel_path}\n" + "\n".join(removed + added))

    # Append index additions (dedup)
    if data.get("index_additions"):
        idx_path = os.path.join(VAULT, "INDEX.md")
        idx = open(idx_path).read() if os.path.exists(idx_path) else ""
        additions = [a for a in data["index_additions"] if a.split("[[")[-1].split("]]")[0] not in idx]
        if additions:
            open(idx_path, "a").write("\n" + "\n".join(additions) + "\n")
            diffs.append(f"\n### INDEX.md additions\n" + "\n".join(f"+ {a}" for a in additions))

    return diffs, data.get("summary", "No summary.")

def git_commit(msg):
    os.chdir(os.path.expanduser("~/nebula"))
    r = subprocess.run(
        ["git", "add", "-f", "vault/"],
        capture_output=True, text=True
    )
    r2 = subprocess.run(
        ["git", "commit", "-m", msg],
        capture_output=True, text=True
    )
    return r2.stdout.strip() + r2.stderr.strip()

def main():
    now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    print(f"=== Vault nightly compile — {now} ===\n")

    raw_files = get_raw_files()
    if not raw_files:
        print("vault/raw/ is empty — nothing to compile.")
        print("Drop source files into vault/raw/ to feed the brain.")
        return

    watermark = load_watermark()
    changed   = find_changed(raw_files, watermark)

    if not changed:
        print(f"No changes in vault/raw/ since last compile. ({len(raw_files)} files checked)")
        return

    print(f"Changed files: {len(changed)}")
    for rel, _, _ in changed:
        print(f"  • {rel}")

    existing = read_vault_pages()
    index    = read_index()
    prompt   = build_prompt(changed, existing, index)

    print("\nCalling LLM compile pass...")
    raw_result = call_llm(prompt)

    result = apply_updates(raw_result)
    if isinstance(result, list):
        # Error path
        print("\n".join(result))
        return

    diffs, summary = result

    if not diffs:
        print("\nNo page changes produced.")
    else:
        print(f"\n{len(diffs)} page(s) updated:")
        for d in diffs:
            print(d)

    print(f"\nSummary: {summary}")

    # Update watermark
    new_wm = {os.path.relpath(p, RAW): h for _, p, h in changed}
    watermark.update(new_wm)
    # Also keep unchanged files in watermark
    for p in raw_files:
        rel = os.path.relpath(p, RAW)
        if rel not in watermark:
            watermark[rel] = sha(p)
    save_watermark(watermark)

    # Commit
    if diffs:
        commit_msg = f"vault nightly compile {now[:10]}: {len(diffs)} page(s) updated"
        git_out = git_commit(commit_msg)
        print(f"\nGit: {git_out}")
    else:
        print("\nNothing committed (no page changes).")

if __name__ == "__main__":
    main()
