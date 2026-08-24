#!/usr/bin/env python3
"""Dependency-free structural audit for the ConcreteCalc static site."""

from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


DOMAIN = "https://concretecalc.com.au"
HOST = "concretecalc.com.au"
GA_ID = "G-XNWWCK3HP0"
ADSENSE_ID = "ca-pub-2538773959178920"
FEEDBACK_LINK = (
    '<a href="https://docs.google.com/forms/d/e/'
    '1FAIpQLScxyUrVePNMWdyJCDl1hrzjDwCQ-Joa4It31sBDZK63A17-kw/'
    'viewform?usp=pp_url&amp;entry.364081786=concretecalc.com.au" '
    'target="_blank" rel="noopener noreferrer">Feedback</a>'
)
FEEDBACK_FAB = FEEDBACK_LINK.replace('<a href=', '<a class="feedback-fab" href=')
PRIVACY_PAGE = "privacy/index.html"
MONETISED_PAGES = {
    "index.html",
    "concrete-slab-calculator/index.html",
    "post-hole-calculator/index.html",
    "footing-calculator/index.html",
    "column-calculator/index.html",
    "circular-slab-calculator/index.html",
    "bags-vs-readymix/index.html",
}
AD_FREE_INDEXED_PAGES = {
    "about/index.html",
    "contact/index.html",
    "methodology/index.html",
    PRIVACY_PAGE,
}
PRIVACY_FORBIDDEN_MARKERS = (
    "pagead2.googlesyndication.com",
    "googletagmanager.com",
    "googlefc",
    "fundingchoicesmessages.google.com",
)


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.h1_count = 0
        self.titles: list[str] = []
        self.descriptions: list[str] = []
        self.canonicals: list[str] = []
        self.robots: list[str] = []
        self.links: list[str] = []
        self.json_ld: list[str] = []
        self._in_head = False
        self._in_title = False
        self._title_parts: list[str] = []
        self._in_json_ld = False
        self._json_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        values = {key.lower(): value or "" for key, value in attrs}
        if tag == "head":
            self._in_head = True
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "title" and self._in_head:
            self._in_title = True
            self._title_parts = []
        elif tag == "meta" and values.get("name", "").lower() == "description":
            self.descriptions.append(values.get("content", "").strip())
        elif tag == "meta" and values.get("name", "").lower() == "robots":
            self.robots.append(values.get("content", "").strip().lower())
        elif tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonicals.append(values.get("href", "").strip())
        elif tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._in_json_ld = True
            self._json_parts = []

        for attribute in ("href", "src"):
            if values.get(attribute):
                self.links.append(values[attribute])

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self._title_parts.append(data)
        if self._in_json_ld:
            self._json_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "head":
            self._in_head = False
        elif tag == "title" and self._in_title:
            self.titles.append("".join(self._title_parts).strip())
            self._in_title = False
        elif tag == "script" and self._in_json_ld:
            self.json_ld.append("".join(self._json_parts).strip())
            self._in_json_ld = False


def expected_canonical(root: Path, page: Path) -> str:
    relative = page.relative_to(root).as_posix()
    if relative == "index.html":
        route = "/"
    elif relative.endswith("/index.html"):
        route = "/" + relative[: -len("index.html")]
    else:
        route = "/" + relative
    return DOMAIN + route


def local_target(root: Path, page: Path, reference: str) -> Path | None:
    reference = reference.strip()
    if not reference or reference.startswith("#"):
        return None

    parsed = urlparse(reference)
    if parsed.scheme in {"mailto", "tel", "javascript", "data"}:
        return None
    if parsed.netloc and parsed.netloc.lower() != HOST:
        return None
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return None
    if not parsed.path:
        return None

    path = unquote(parsed.path)
    candidate = root / path.lstrip("/") if path.startswith("/") else page.parent / path
    candidate = candidate.resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return candidate

    if candidate.is_dir() or path.endswith("/"):
        candidate = candidate / "index.html"
    elif not candidate.exists() and not candidate.suffix:
        candidate = candidate / "index.html"
    return candidate


def sitemap_urls(path: Path) -> set[str]:
    tree = ET.parse(path)
    return {
        (element.text or "").strip()
        for element in tree.getroot().iter()
        if element.tag.rsplit("}", 1)[-1] == "loc" and (element.text or "").strip()
    }


def main() -> int:
    root = Path(__file__).resolve().parents[4]
    pages = sorted(
        page
        for page in root.rglob("*.html")
        if ".git" not in page.parts and ".agents" not in page.parts
    )
    errors: list[str] = []
    canonical_to_pages: dict[str, list[str]] = defaultdict(list)
    title_to_pages: dict[str, list[str]] = defaultdict(list)
    indexable_canonicals: set[str] = set()
    noindex_canonicals: set[str] = set()

    for page in pages:
        relative = page.relative_to(root).as_posix()
        source = page.read_text(encoding="utf-8", errors="replace")
        parser = PageParser()
        parser.feed(source)

        feedback_count = source.count(FEEDBACK_LINK)
        if feedback_count != 1:
            errors.append(
                f"{relative}: expected one canonical feedback link, found {feedback_count}"
            )
        feedback_fab_count = source.count(FEEDBACK_FAB)
        if feedback_fab_count != 1:
            errors.append(
                f"{relative}: expected one floating feedback link, found {feedback_fab_count}"
            )

        if parser.h1_count != 1:
            errors.append(f"{relative}: expected one H1, found {parser.h1_count}")
        if len(parser.titles) != 1 or not parser.titles[0]:
            errors.append(f"{relative}: expected one non-empty title")
        else:
            title_to_pages[parser.titles[0]].append(relative)
        if len(parser.descriptions) != 1 or not parser.descriptions[0]:
            errors.append(f"{relative}: expected one non-empty meta description")
        if len(parser.canonicals) != 1:
            errors.append(f"{relative}: expected one canonical, found {len(parser.canonicals)}")
        else:
            canonical = parser.canonicals[0]
            canonical_to_pages[canonical].append(relative)
            expected = expected_canonical(root, page)
            if canonical != expected:
                errors.append(f"{relative}: canonical {canonical!r} should be {expected!r}")

            robots = parser.robots[0] if len(parser.robots) == 1 else ""
            robot_tokens = {token.strip() for token in robots.split(",")}
            if "noindex" in robot_tokens:
                noindex_canonicals.add(canonical)
            else:
                indexable_canonicals.add(canonical)

        if len(parser.robots) != 1:
            errors.append(f"{relative}: expected one robots meta tag")

        if relative == PRIVACY_PAGE:
            for marker in PRIVACY_FORBIDDEN_MARKERS:
                if marker in source.lower():
                    errors.append(
                        f"{relative}: privacy page contains consent-dependent marker {marker!r}"
                    )
        else:
            if GA_ID not in source:
                errors.append(f"{relative}: missing GA measurement ID {GA_ID}")

        if relative in MONETISED_PAGES:
            if ADSENSE_ID not in source:
                errors.append(f"{relative}: missing AdSense publisher ID {ADSENSE_ID}")
        elif ADSENSE_ID in source:
            errors.append(f"{relative}: ad-free page contains AdSense publisher ID {ADSENSE_ID}")

        if relative not in MONETISED_PAGES and relative not in AD_FREE_INDEXED_PAGES:
            robots = parser.robots[0] if parser.robots else ""
            if "noindex" not in {token.strip() for token in robots.split(",")}:
                errors.append(f"{relative}: archived worked example must be noindex")

        if "/methodology/" not in source:
            errors.append(f"{relative}: missing methodology link")

        for index, payload in enumerate(parser.json_ld, start=1):
            try:
                json.loads(payload)
            except json.JSONDecodeError as exc:
                errors.append(f"{relative}: JSON-LD block {index} is invalid: {exc.msg}")

        for reference in parser.links:
            target = local_target(root, page, reference)
            if target is not None and not target.exists():
                errors.append(f"{relative}: missing local target {reference!r}")

    for canonical, owners in canonical_to_pages.items():
        if len(owners) > 1:
            errors.append(f"duplicate canonical {canonical!r}: {', '.join(owners)}")
    for title, owners in title_to_pages.items():
        if len(owners) > 1:
            errors.append(f"duplicate title {title!r}: {', '.join(owners)}")

    try:
        sitemap = sitemap_urls(root / "sitemap.xml")
    except (ET.ParseError, OSError) as exc:
        errors.append(f"sitemap.xml: cannot parse: {exc}")
        sitemap = set()
    for url in sorted(indexable_canonicals - sitemap):
        errors.append(f"sitemap.xml: missing canonical {url}")
    for url in sorted(sitemap - indexable_canonicals):
        if url in noindex_canonicals:
            errors.append(f"sitemap.xml: noindex canonical must be excluded {url}")
        else:
            errors.append(f"sitemap.xml: URL has no matching indexable page canonical {url}")

    if errors:
        print(f"FAIL: {len(errors)} validation issue(s)")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        f"PASS: {len(pages)} pages; titles, descriptions, H1s, canonicals, "
        "JSON-LD, feedback links, ad/tracking/privacy rules, internal targets, and indexable sitemap parity are valid."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
