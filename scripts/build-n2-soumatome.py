"""Build the reviewed N2 Kanji catalog and optional original-page assets.

python scripts/build-n2-soumatome.py <KANJIDIC2.xml> [<source PDF>]
Character order and Myanmar glosses are reviewed files, not unreviewed OCR.
"""
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
read = lambda name: json.loads((ROOT / 'migrations' / name).read_text(encoding='utf-8'))
manifest = read('n2-soumatome-pages.json')
meanings = read('n2-soumatome-myanmar.json')
words = read('n2-soumatome-study-words.json')
dictionary = {entry.findtext('literal'): entry for entry in ET.parse(sys.argv[1]).getroot().findall('character')}
week_titles = ['みる①', 'つかう①', 'よむ①', 'かく', 'つかう②', 'みる②', 'よむ②', 'しる']
chapters = []
source_numbers = []
for week in range(1, 9):
    chapter_id = f'n2-soumatome-week-{week}'
    chapter = {'id': chapter_id, 'number': str(week), 'title': f'第{week}週 · {week_titles[week-1]}', 'studyTab': 'Kanji', 'groupCardsByLesson': True, 'sections': [], 'cards': []}
    for day in range(1, 8):
        pages = [page for page in manifest['pages'] if page['week'] == week and page['day'] == day]
        section_page = min(page['pdfPage'] for page in pages) - 1
        title = f'{day}日目' if day < 7 else 'コラム'
        section = {'page': section_page, 'title': title, 'sourcePages': [{'number': page['pdfPage'], 'src': f'/kanji-n2/soumatome-page-{page["pdfPage"]:03}.jpg'} for page in pages]}
        chapter['sections'].append(section)
        for page in pages:
            if not page['kanji']:
                continue
            glosses = meanings[str(page['pdfPage'])].split('|')
            study_words = words[str(page['pdfPage'])].split('|')
            assert len(glosses) == len(study_words) == len(page['kanji'])
            for offset, (kanji, gloss, word) in enumerate(zip(page['kanji'], glosses, study_words)):
                number = page['firstNumber'] + offset
                entry = dictionary[kanji]
                readings = entry.findall('.//reading')
                on = list(dict.fromkeys(r.text for r in readings if r.get('r_type') == 'ja_on'))
                kun = list(dict.fromkeys(r.text.replace('.', '') for r in readings if r.get('r_type') == 'ja_kun'))
                assert on or kun, (number, kanji)
                assert kanji in word and gloss
                chapter['cards'].append({'id': f'n2-soumatome-{number:03}', 'sourceNumber': number, 'kanji': kanji, 'meaning': gloss, 'strokes': int(entry.findtext('misc/stroke_count')), 'page': section_page, 'lesson': title, 'readings': [{'kanji': kanji, 'on': '・'.join(on), 'kun': '・'.join(kun)}], 'studyWord': word, 'examples': [], 'sourceReferences': [{'book': manifest['source'], 'page': page['pdfPage'], 'number': number}], 'readingSource': 'KANJIDIC2'})
                source_numbers.append(number)
    chapters.append(chapter)
assert source_numbers == list(range(1, 740))
assert len({card['kanji'] for chapter in chapters for card in chapter['cards']}) == 739
catalog = {'source': manifest['source'], 'baselineKanjiChapters': chapters}
(ROOT / 'migrations/n2-soumatome-catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
if len(sys.argv) > 2:
    sys.path.insert(0, str(ROOT / '.tmp-python'))
    import pymupdf
    pdf_path = Path(sys.argv[2])
    doc = pymupdf.open(pdf_path)
    out = ROOT / 'public/kanji-n2'
    out.mkdir(parents=True, exist_ok=True)
    for page in manifest['pages']:
        number = page['pdfPage']
        pix = doc[number-1].get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6))
        (out / f'soumatome-page-{number:03}.jpg').write_bytes(pix.tobytes('jpg', jpg_quality=83))
    catalog['sourceSha256'] = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    (ROOT / 'migrations/n2-soumatome-catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Built 739 Kanji cards in 8 weekly chapters / 56 sections.')
