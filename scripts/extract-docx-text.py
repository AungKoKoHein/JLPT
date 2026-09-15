from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

source = Path(__file__).resolve().parents[2] / "upload" / "N3 Vocab.docx"
target = Path(__file__).resolve().parents[1] / "source" / "n3-vocab.txt"
ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

with ZipFile(source) as archive:
    root = ET.fromstring(archive.read("word/document.xml"))
paragraphs = []
for paragraph in root.findall(".//w:p", ns):
    text = "".join(node.text or "" for node in paragraph.findall(".//w:t", ns)).strip()
    if text:
        paragraphs.append(text)

target.parent.mkdir(parents=True, exist_ok=True)
target.write_text("\n".join(paragraphs) + "\n", encoding="utf-8")
print(f"Wrote {len(paragraphs)} clean paragraphs to {target}")
