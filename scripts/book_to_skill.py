#!/usr/bin/env python3
"""Book to Skill - mechanical extractor (from The Next New Thing, HQqX4rF1nDM).

Turns a public-domain book text into structured "raw material" that an agent
then curates into a real SKILL.md. This script does the deterministic part
(chapters, key claims, quotable lines); the LLM does the transformation.

Usage:
  python3 scripts/book_to_skill.py <book.txt> --title "Scientific Advertising" \
      --author "Claude C. Hopkins" --out /tmp/book_raw_scientific.md

Output: a markdown "raw material" file with:
  - Chapter index (number + title)
  - Per chapter: key claims (sentences with numbers, imperatives, absolutes)
  - Top quotable lines (short, self-contained, principle-bearing)

Design rules:
  - stdlib only (runs on any box, no network)
  - Deterministic - same input, same output
  - NEVER invents content: only extracts the source text
  - The agent's job is the synthesis into SKILL.md (curation, not generation)

Heuristics (tuned on Scientific Advertising, 1923):
  - Chapters: lines matching r'^\s*Chapter\s+(\d+)' plus the next non-empty line
    as the title (unless it's a page footer).
  - Key claims: sentences containing a digit, or starting with a
    rule-like verb ("Never", "Always", "Remember", "The", "People", "We").
  - Quotables: short sentences (6-32 words) with an imperative or an
    absolute ("never", "always", "only", "best", "must", "proved").
"""

import argparse
import re
import sys
from pathlib import Path

CHAPTER_RE = re.compile(r"^\s*Chapter\s+(\d+)\s*$", re.IGNORECASE)
TITLE_SKIP = re.compile(
    r"^(the |of |and |or |but |for |with |from |this |that |when |what |how |why |which |you |your |ads? |an |in |on |at |by )",
    re.IGNORECASE,
)
ABSOLUTES = ("never", "always", "only", "best", "must", "proved", "forget", "remember", "no guesswork")
NUM_RE = re.compile(r"\d")
SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")


def clean(line: str) -> str:
    return re.sub(r"^\s*[-–]\s*", "", line).strip()


FOOTER_RE = re.compile(
    r"(galletti|scientificadvertising\.com|^\s*[-–]?\s*\d+\s*[-–]?\s*$|^\s*page\s+\d+\s*$)",
    re.IGNORECASE,
)


def is_footer(line: str) -> bool:
    return bool(FOOTER_RE.search(line))


def split_sentences(text: str):
    return [s.strip() for s in SENT_SPLIT.split(text) if len(s.strip()) > 2]


def extract(text: str):
    lines = text.splitlines()
    chapters = []  # (num, title, body_lines)
    cur = None
    for i, raw in enumerate(lines):
        m = CHAPTER_RE.match(raw)
        if m:
            # title = next non-empty, non-footer line
            title = ""
            for j in range(i + 1, min(i + 4, len(lines))):
                t = clean(lines[j])
                if t and not re.match(r"^\s*[-–]?\s*\d+\s*[-–]?\s*$", t) and "ScientificAdvertising.com" not in t:
                    title = t
                    break
            if cur:
                chapters.append(cur)
            cur = [int(m.group(1)), title, []]
        elif cur is not None:
            if not is_footer(raw):
                cur[2].append(raw)
    if cur:
        chapters.append(cur)
    return chapters


def key_claims(body: str):
    claims = []
    for sent in split_sentences(body):
        s = sent.lower()
        if NUM_RE.search(sent) or s.startswith(("never", "always", "remember", "people", "we ", "no ", "the ")):
            if 8 < len(sent) < 300:
                claims.append(sent)
    return claims[:14]


def quotables(body: str):
    out = []
    for sent in split_sentences(body):
        s = sent.lower()
        wc = len(sent.split())
        if 6 <= wc <= 32 and any(a in s for a in ABSOLUTES):
            out.append(sent)
    return out[:12]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("book", help="Path to the book text file")
    ap.add_argument("--title", required=True)
    ap.add_argument("--author", default="")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    text = Path(args.book).read_text(errors="replace")
    chapters = extract(text)
    if not chapters:
        print(f"ERROR: no chapters found in {args.book} - is this a book-format text?", file=sys.stderr)
        sys.exit(1)

    out = [f"# Raw material: {args.title}", ""]
    out.append(f"- Author: {args.author}")
    out.append(f"- Chapters detected: {len(chapters)}")
    out.append("- This file is EXTRACTION ONLY - curate it into SKILL.md, don't paste it whole.")
    out.append("")
    out.append("## Chapter index")
    out.append("")
    out.append("| # | Title |")
    out.append("|---|-------|")
    for num, title, _ in chapters:
        out.append(f"| {num} | {title} |")
    out.append("")

    for num, title, body in chapters:
        body_text = " ".join(body)
        claims = key_claims(body_text)
        quots = quotables(body_text)
        if not claims and not quots:
            continue
        out.append(f"## Chapter {num}: {title}")
        out.append("")
        if claims:
            out.append("Key claims:")
            for c in claims:
                out.append(f"- {c}")
            out.append("")
        if quots:
            out.append("Quotable lines:")
            for q in quots:
                out.append(f"> {q}")
            out.append("")

    Path(args.out).write_text("\n".join(out))
    print(f"Wrote {len(out)} lines -> {args.out}")
    print(f"Chapters: {len(chapters)}")


if __name__ == "__main__":
    main()
