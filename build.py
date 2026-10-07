"""Build Open Outcry into single self-contained pages.

dist/index.html     complete page: open it in a browser or host it as is (Vercel, any static host)
dist/artifact.html  the same page without the html/head wrapper, for publishing as a claude.ai artifact
"""
from pathlib import Path

root = Path(__file__).parent
src = root / "src"
shell = (src / "shell.html").read_text()
page = (shell
        .replace("/*STYLE*/", (src / "style.css").read_text())
        .replace("/*BANK*/", (src / "bank.js").read_text())
        .replace("/*APP*/", (src / "app.js").read_text()))

dist = root / "dist"
dist.mkdir(exist_ok=True)
(dist / "artifact.html").write_text(page)

split = page.index('<div id="app">')
head, body = page[:split], page[split:]
full = ("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
        + head + "</head>\n<body>\n" + body + "</body>\n</html>\n")
(dist / "index.html").write_text(full)

for name in ("index.html", "artifact.html"):
    print(dist / name, (dist / name).stat().st_size, "bytes")
