"""Gera a versão de apresentação dos escopos comerciais para as calculadoras.

Uso: python3 scripts/build-escopos.py <pasta com os "Escopo *.html">

Mantém o layout de cada HTML e remove só o que é do closer: o seletor
Apresentação/Closer, os blocos internos (.only-closer), a assinatura (.sig),
o script do seletor e os campos editáveis.
"""

import re
import sys
from pathlib import Path

SOURCES = {
    "bpo": "Escopo BPO.html",
    "cfo": "Escopo CFO.html",
    "oxy": "Escopo Oxy+gênio.html",
    "assessoria": "Escopo Assessoria.html",
    "coordenador": "Escopo coordenador.html",
    "estrategico": "Escopo Diagnóstico Estratégico.html",
    "tributario": "Escopo Diagnóstico Tributário.html",
    "turnaround": "Escopo Turnaround.html",
}

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "escopos"


def remove_divs(html: str, class_pattern: str) -> str:
    """Remove cada <div> cuja classe casa com o padrão, junto com o conteúdo aninhado."""
    opener = re.compile(r'<div\b[^>]*class="[^"]*' + class_pattern + r'[^"]*"[^>]*>')
    tag = re.compile(r"<(/?)div\b[^>]*>")
    while m := opener.search(html):
        depth = 0
        for t in tag.finditer(html, m.start()):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                html = html[: m.start()] + html[t.end():]
                break
        else:
            raise ValueError(f"<div> sem fechamento para {class_pattern}")
    return html


def to_presentation(html: str) -> str:
    html = remove_divs(html, r"\bmodeswitch\b")
    html = remove_divs(html, r"\bonly-closer\b")
    html = remove_divs(html, r"\bsig\b")
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S)
    html = re.sub(r'\s(contenteditable|spellcheck)="[^"]*"', "", html)
    return html


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src_dir = Path(sys.argv[1]).expanduser()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for key, name in SOURCES.items():
        html = to_presentation((src_dir / name).read_text(encoding="utf-8"))
        body = html[html.find("<body"):]
        for leftover in ("only-closer", "modeswitch", 'class="sig"', "<script"):
            if leftover in body:
                raise ValueError(f"{name}: sobrou '{leftover}'")
        (OUT_DIR / f"{key}.html").write_text(html, encoding="utf-8")
        print(f"{key}.html  {len(html) // 1024} KB")


if __name__ == "__main__":
    main()
