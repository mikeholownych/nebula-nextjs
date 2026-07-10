#!/usr/bin/env python3
"""Publish lead magnet markdown files as simple static HTML pages."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
MAGNET_DIR = BASE / "lead_magnets"
PUBLIC_DIR = BASE / "public" / "lead-magnets"
CONFIG = BASE / "growth_system" / "hormozi_lead_magnet_vault.json"


def md_to_html(md: str) -> str:
    lines = md.splitlines()
    out: list[str] = []
    in_table = False
    for raw in lines:
        line = raw.rstrip()
        if not line:
            if in_table:
                out.append("</tbody></table>")
                in_table = False
            continue
        if line.startswith("# "):
            out.append(f"<h1>{html.escape(line[2:])}</h1>")
        elif line.startswith("## "):
            out.append(f"<h2>{html.escape(line[3:])}</h2>")
        elif line.startswith("|") and line.endswith("|"):
            cells = [c.strip() for c in line.strip("|").split("|")]
            if all(set(c) <= {"-", ":"} for c in cells):
                continue
            if not in_table:
                out.append("<table><tbody>")
                in_table = True
            out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in cells) + "</tr>")
        elif re.match(r"^\d+\. ", line):
            out.append(f"<p class='num'>{inline(line)}</p>")
        elif line.startswith("- "):
            out.append(f"<p class='bullet'>• {inline(line[2:])}</p>")
        else:
            out.append(f"<p>{inline(line)}</p>")
    if in_table:
        out.append("</tbody></table>")
    return "\n".join(out)


def inline(text: str) -> str:
    escaped = html.escape(text)
    escaped = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"(https?://[^\s<]+)", r"<a href='\1'>\1</a>", escaped)
    return escaped


def page(title: str, body_html: str) -> str:
    return f"""<!doctype html>
<html lang='en'>
<head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width, initial-scale=1'>
<title>{html.escape(title)} — Nebula Components</title>
<style>
body{{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#08090b;color:#f4f1ea;margin:0;line-height:1.6}}
main{{max-width:820px;margin:0 auto;padding:56px 22px 80px}}
a{{color:#8ee6ff}} h1{{font-size:clamp(2.2rem,7vw,4.5rem);line-height:.95;letter-spacing:-.06em;margin:0 0 24px}} h2{{margin-top:38px;color:#f8d57e}}
p{{font-size:1.05rem;color:#d8d2c3}} strong{{color:#fff}} table{{width:100%;border-collapse:collapse;margin:18px 0;background:#111318;border:1px solid #2b2f36}}td{{border:1px solid #2b2f36;padding:12px;vertical-align:top}}.num,.bullet{{background:#101217;border-left:3px solid #f8d57e;padding:10px 14px}}.cta{{margin-top:44px;padding:22px;border:1px solid #f8d57e;background:#15130b}}.cta a{{display:inline-block;margin-top:10px;background:#f8d57e;color:#08090b;text-decoration:none;font-weight:800;padding:12px 16px;border-radius:8px}}
</style>
</head>
<body><main>{body_html}<div class='cta'><strong>Want the full fix shipped?</strong><br><a href='https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02'>Get the $147 Fix Pack</a></div></main></body>
</html>
"""


def slug_for(path: str) -> str:
    return Path(path).stem.replace("_", "-") + ".html"


def main() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    vault = json.loads(CONFIG.read_text())
    pages = []
    for magnet in vault["magnets"]:
        src = Path(magnet["file"])
        md = src.read_text()
        dest = PUBLIC_DIR / slug_for(src.name)
        dest.write_text(page(magnet["title"], md_to_html(md)))
        pages.append({**magnet, "public_path": str(dest), "url_path": f"/lead-magnets/{dest.name}"})
    (PUBLIC_DIR / "index.json").write_text(json.dumps(pages, indent=2) + "\n")
    print(json.dumps({"published": len(pages), "dir": str(PUBLIC_DIR)}, indent=2))


if __name__ == "__main__":
    main()
