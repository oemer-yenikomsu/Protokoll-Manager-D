"""Einmalig: HTML aus ENTWICKLUNGSANLEITUNG.md erzeugen (optional)."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
MD = HERE / 'ENTWICKLUNGSANLEITUNG.md'
OUT = HERE / 'index.html'

md = MD.read_text(encoding='utf-8')
# JSON-escape for embedding in script
import json
md_json = json.dumps(md)

OUT.write_text(f'''<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Entwicklungsanleitung – Protokoll-Manager</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    @page {{ margin: 2cm; }}
    body {{
      margin: 0;
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #000;
      background: #f0f0f0;
    }}
    .toolbar {{
      position: sticky;
      top: 0;
      z-index: 10;
      background: #fff;
      border-bottom: 1px solid #ccc;
      padding: 0.5rem 1rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }}
    .toolbar button {{
      font-family: inherit;
      font-size: 10pt;
      padding: 0.35rem 0.85rem;
      border: 1px solid #888;
      background: #fff;
      cursor: pointer;
    }}
    .toolbar button:hover {{ background: #e8e8e8; }}
    .toolbar .hint {{ font-size: 9pt; color: #555; margin-left: auto; }}
    .page {{
      max-width: 21cm;
      margin: 1rem auto 2rem;
      padding: 2cm 2.2cm;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    }}
    #doc h1 {{ font-size: 18pt; margin: 0 0 12pt; border-bottom: 1pt solid #000; padding-bottom: 6pt; }}
    #doc h2 {{ font-size: 14pt; margin: 18pt 0 8pt; }}
    #doc h3 {{ font-size: 12pt; margin: 14pt 0 6pt; }}
    #doc p, #doc li {{ margin: 0 0 6pt; }}
    #doc ul, #doc ol {{ margin: 0 0 8pt; padding-left: 1.2cm; }}
    #doc table {{ border-collapse: collapse; width: 100%; margin: 8pt 0 12pt; font-size: 10pt; }}
    #doc th, #doc td {{ border: 1pt solid #000; padding: 4pt 6pt; text-align: left; vertical-align: top; }}
    #doc th {{ background: #f0f0f0; font-weight: bold; }}
    #doc pre, #doc code {{
      font-family: Consolas, "Courier New", monospace;
      font-size: 9pt;
      background: #f5f5f5;
      border: 1pt solid #ddd;
    }}
    #doc pre {{ padding: 8pt; overflow-x: auto; white-space: pre-wrap; margin: 8pt 0; }}
    #doc code {{ padding: 1pt 3pt; }}
    #doc hr {{ border: none; border-top: 1pt solid #ccc; margin: 14pt 0; }}
    #doc a {{ color: #0563c1; }}
    @media print {{
      body {{ background: #fff; }}
      .toolbar {{ display: none !important; }}
      .page {{ box-shadow: none; margin: 0; max-width: none; padding: 0; }}
    }}
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" id="btnWord">Word-Datei herunterladen</button>
    <button type="button" id="btnPdf">Als PDF speichern (Drucken)</button>
    <span class="hint">Nur für Entwicklung — nicht in der Web-App verlinkt</span>
  </div>
  <div class="page">
    <article id="doc"></article>
  </div>
  <script id="md-data" type="application/json">{md_json}</script>
  <script>
    const md = JSON.parse(document.getElementById('md-data').textContent);
    document.getElementById('doc').innerHTML = marked.parse(md);

    document.getElementById('btnPdf').onclick = () => window.print();

    document.getElementById('btnWord').onclick = () => {{
      const body = document.getElementById('doc').innerHTML;
      const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>Entwicklungsanleitung Protokoll-Manager</title>
        <style>body{{font-family:Calibri,Arial,sans-serif;font-size:11pt;}}
        table{{border-collapse:collapse;}} td,th{{border:1px solid #000;padding:4px;}}
        pre,code{{font-family:Consolas,monospace;font-size:9pt;background:#f5f5f5;}}</style></head>
        <body>${{body}}</body></html>`;
      const blob = new Blob(['\\ufeff', html], {{ type: 'application/msword' }});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ENTWICKLUNGSANLEITUNG.doc';
      a.click();
      URL.revokeObjectURL(a.href);
    }};
  </script>
</body>
</html>
''', encoding='utf-8')
print('Written', OUT)
