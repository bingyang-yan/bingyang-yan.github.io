"""Refresh the Work publications from Notion before publishing.

Share the Publications database with a Notion integration, set NOTION_TOKEN
in the environment, then run python3 publications/sync.py from the repo.
Install cwebp to convert Notion covers into local, permanent WebP files.
"""

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
SOURCE = "1c17cf09-07d0-81d1-b01f-000bbfe1b67a"
NOTION_SITE = "https://bryce-yan.notion.site"

HOSTED_PDF_FILENAMES = {
    "1c17cf0907d08138bc20c7563df77864": "CNN24.pdf",
    "1c17cf0907d0816abb40c198091f3274": "PPO25.pdf",
    "3997cf0907d080d7bd6afc51cfaf924e": "Thesis26.pdf",
}


def rich_text(properties, name):
    prop = properties.get(name, {})
    return prop.get(prop.get("type"), [])


def plain_text(properties, name):
    return "".join(item["plain_text"] for item in rich_text(properties, name)).strip()


def https_url(value):
    if not value:
        return ""
    url = urlsplit(value)
    return value if url.scheme == "https" and url.hostname else ""


def query_pages(token):
    cursor = None
    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        request = Request(
            f"https://api.notion.com/v1/data_sources/{SOURCE}/query",
            data=json.dumps(body).encode(),
            headers={
                "Authorization": f"Bearer {token}",
                "Notion-Version": "2025-09-03",
                "Content-Type": "application/json",
            },
        )
        with urlopen(request, timeout=30) as response:
            result = json.load(response)
        yield from (
            page for page in result["results"]
            if page["object"] == "page" and not page.get("archived") and not page.get("in_trash")
        )
        if not result["has_more"]:
            return
        cursor = result["next_cursor"]


def store_cover(page, staging):
    cover = page.get("cover") or {}
    url = https_url(cover.get(cover.get("type"), {}).get("url"))
    if not url:
        return ""
    with urlopen(url, timeout=60) as response:
        contents = response.read()
    digest = hashlib.sha256(contents).hexdigest()[:16]
    page_id = page["id"].replace("-", "")
    relative = Path("covers") / f"{page_id}-{digest}.webp"
    if not (ROOT / relative).exists():
        photo = staging / "cover-input"
        photo.write_bytes(contents)
        subprocess.run([
            "cwebp", "-quiet", "-q", "84", "-resize", "1000", "0",
            str(photo), "-o", str(staging / relative.name),
        ], check=True)
    return relative.as_posix()


def publication(page, staging):
    properties = page["properties"]
    title = plain_text(properties, "Title")
    if not title:
        return None
    links = []
    seen = set()
    for item in rich_text(properties, "Resources"):
        url = https_url(item.get("href"))
        label = item["plain_text"].strip()
        if url and label and url not in seen:
            links.append({"label": label, "url": url})
            seen.add(url)
    doi = plain_text(properties, "DOI")
    doi_url = https_url(doi) or (f"https://doi.org/{doi}" if re.fullmatch(r"10\.\d{4,9}/\S+", doi) else "")
    if doi_url and doi_url not in seen:
        links.append({"label": "DOI", "url": doi_url})
    page_id = page["id"].replace("-", "")
    filename = HOSTED_PDF_FILENAMES.get(page_id, f"{page_id}.pdf")
    pdf = Path("pdfs") / filename
    has_pdf_link = any(link["label"].casefold() == "pdf" for link in links)
    if not has_pdf_link and (ROOT / pdf).is_file():
        links.insert(0, {"label": "PDF", "url": pdf.as_posix()})
    return {
        "title": title,
        "authors": plain_text(properties, "Authors"),
        "venue": (properties.get("Journal", {}).get("select") or {}).get("name", ""),
        "type": (properties.get("Type", {}).get("select") or {}).get("name", ""),
        "date": (properties.get("Publication Date", {}).get("date") or {}).get("start", "")[:10],
        "description": " ".join(plain_text(properties, "Abstract").split()),
        "url": f"{NOTION_SITE}/p/{page_id}",
        "cover": store_cover(page, staging),
        "links": links,
    }


def main():
    token = os.environ.get("NOTION_TOKEN")
    if not token:
        raise SystemExit("Set NOTION_TOKEN to refresh Publications.")
    with TemporaryDirectory(dir=ROOT) as temporary:
        staging = Path(temporary)
        records = [record for page in query_pages(token) if (record := publication(page, staging))]
        records.sort(key=lambda record: record["title"].casefold())
        records.sort(key=lambda record: record["date"], reverse=True)
        data = staging / "data.json"
        data.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        covers = ROOT / "covers"
        covers.mkdir(exist_ok=True)
        for image in staging.glob("*.webp"):
            image.replace(covers / image.name)
        data.replace(ROOT / data.name)


if __name__ == "__main__":
    main()
