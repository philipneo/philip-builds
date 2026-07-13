#!/usr/bin/env python3
"""Build-time ingestion for the Neo Labs structured public corpus.

Converts approved public pages into structured JSON chunks with stable IDs.
This is step 1 of the Secure RAG production roadmap ("structured content"),
implemented honestly: a manual, build-time script over an explicit allowlist
of public pages — not a live pipeline, and nothing under private/ is readable
by design.

Usage:  python3 scripts/build_corpus.py [--check]
Output: ai-lab/corpus-explorer/corpus.json  (pretty JSON, for humans)
        ai-lab/corpus-explorer/corpus.js    (globalThis.PBS_CORPUS, file://-safe)

Stdlib only. No network access. Deterministic apart from the generated date.
"""
from html.parser import HTMLParser
import datetime
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "ai-lab", "corpus-explorer")

# Explicit corpus approval: only these public pages are ever ingested.
APPROVED_PAGES = [
    ("index.html", "Home"),
    ("ai-lab/index.html", "AI Lab"),
    ("ai-lab/secure-rag/index.html", "Secure RAG prototype"),
    ("ai-lab/retrieval-evals/index.html", "Retrieval Eval Harness"),
    ("case-studies/index.html", "Case studies"),
    ("case-studies/secure-rag/index.html", "Secure RAG case study"),
    ("portfolio/index.html", "Portfolio"),
    ("start-project/index.html", "Start a project"),
]

SKIP_CONTENT_TAGS = {"script", "style", "noscript"}
TEXT_TAGS = {"p", "li", "dd", "dt"}
HEADING_TAGS = {"h1", "h2", "h3"}
MIN_CHARS = 60


class SectionExtractor(HTMLParser):
    """Collects heading + text content for each <section> that has an id."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.sections = []          # [{anchor, title, parts}]
        self.section_stack = []     # indexes into self.sections, or None for id-less
        self.skip_depth = 0
        self.heading_tag = None
        self.text_tag_depth = 0

    def _current(self):
        for idx in reversed(self.section_stack):
            if idx is not None:
                return self.sections[idx]
        return None

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_CONTENT_TAGS:
            self.skip_depth += 1
            return
        if tag == "section":
            attr = dict(attrs)
            # Stable anchor: the section id, or the aria-labelledby heading id.
            anchor = attr.get("id") or attr.get("aria-labelledby")
            if anchor:
                self.sections.append(
                    {"anchor": anchor, "title": "", "title_done": False, "parts": []}
                )
                self.section_stack.append(len(self.sections) - 1)
            else:
                self.section_stack.append(None)
            return
        if self._current() is None:
            return
        if tag in HEADING_TAGS and not self.heading_tag and not self._current()["title_done"]:
            self.heading_tag = tag
        elif tag in TEXT_TAGS:
            self.text_tag_depth += 1
            self._current()["parts"].append("")

    def handle_endtag(self, tag):
        if tag in SKIP_CONTENT_TAGS:
            self.skip_depth = max(0, self.skip_depth - 1)
            return
        if tag == "section":
            if self.section_stack:
                self.section_stack.pop()
            return
        if tag == self.heading_tag:
            self.heading_tag = None
            current = self._current()
            if current is not None and current["title"]:
                current["title_done"] = True
        elif tag in TEXT_TAGS and self.text_tag_depth:
            self.text_tag_depth -= 1

    def handle_data(self, data):
        section = self._current()
        if section is None or self.skip_depth:
            return
        if self.heading_tag and not section["title"]:
            section["title"] = " ".join(data.split())
        elif self.heading_tag:
            section["title"] = " ".join((section["title"] + " " + data).split())
        elif self.text_tag_depth and section["parts"]:
            section["parts"][-1] += data


def slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "page"


def page_slug(page):
    return slugify(page.replace("/index.html", "").replace(".html", "")) or "home"


def build_chunks():
    chunks = []
    for page, page_title in APPROVED_PAGES:
        path = os.path.join(ROOT, page)
        with open(path, encoding="utf-8") as handle:
            html = handle.read()
        parser = SectionExtractor()
        parser.feed(html)
        for section in parser.sections:
            text = " ".join(
                " ".join(part.split()) for part in section["parts"] if part.strip()
            ).strip()
            if len(text) < MIN_CHARS:
                continue
            chunk_id = f"{page_slug(page)}--{slugify(section['anchor'])}"
            chunks.append({
                "id": chunk_id,
                "page": page,
                "page_title": page_title,
                "anchor": section["anchor"],
                "title": section["title"] or section["anchor"],
                "text": text,
                "chars": len(text),
                "content_sha1": hashlib.sha1(text.encode("utf-8")).hexdigest()[:12],
            })
    return chunks


def make_corpus(generated=None):
    chunks = build_chunks()
    ids = [c["id"] for c in chunks]
    if len(ids) != len(set(ids)):
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        sys.exit(f"Duplicate chunk ids: {dupes}")

    return {
        "meta": {
            "generated": generated or datetime.date.today().isoformat(),
            "script": "scripts/build_corpus.py",
            "boundary": "Approved public pages only. private/ is excluded by construction and is not readable by this script's allowlist.",
            "pages": [{"page": p, "title": t} for p, t in APPROVED_PAGES],
            "chunk_count": len(chunks),
            "total_chars": sum(c["chars"] for c in chunks),
        },
        "chunks": chunks,
    }


def normalized(corpus):
    value = json.loads(json.dumps(corpus))
    value.get("meta", {}).pop("generated", None)
    return value


def main():
    check = sys.argv[1:] == ["--check"]
    if sys.argv[1:] and not check:
        sys.exit("Usage: python3 scripts/build_corpus.py [--check]")

    json_path = os.path.join(OUT_DIR, "corpus.json")
    corpus = make_corpus()

    if check:
        try:
            with open(json_path, encoding="utf-8") as handle:
                committed = json.load(handle)
        except (OSError, json.JSONDecodeError) as error:
            sys.exit(f"Corpus artifact unavailable or invalid: {error}")
        if normalized(committed) != normalized(corpus):
            old = {chunk["id"]: chunk for chunk in committed.get("chunks", [])}
            new = {chunk["id"]: chunk for chunk in corpus["chunks"]}
            drifted = sorted(
                set(old) ^ set(new) |
                {chunk_id for chunk_id in set(old) & set(new) if old[chunk_id] != new[chunk_id]}
            )
            sys.exit("Corpus drift detected: " + ", ".join(drifted or ["metadata"]))
        print(f"Corpus in sync: {len(corpus['chunks'])} chunks from {len(APPROVED_PAGES)} pages")
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as handle:
        json.dump(corpus, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    js_path = os.path.join(OUT_DIR, "corpus.js")
    with open(js_path, "w", encoding="utf-8") as handle:
        handle.write("/* Generated by scripts/build_corpus.py — do not edit by hand. */\n")
        handle.write("globalThis.PBS_CORPUS = ")
        json.dump(corpus, handle, indent=2, ensure_ascii=False)
        handle.write(";\n")

    print(f"{len(corpus['chunks'])} chunks from {len(APPROVED_PAGES)} pages "
          f"({corpus['meta']['total_chars']} chars) -> {os.path.relpath(json_path, ROOT)}")


if __name__ == "__main__":
    main()
