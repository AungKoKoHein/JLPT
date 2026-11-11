"""Split the PDF bank into individual prompts and choices (run after import)."""
import json
import re
import sys
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
bank_path = ROOT / 'src/n3PracticeBank.json'
bank = json.loads(bank_path.read_text(encoding='utf-8'))
doc = pymupdf.open(sys.argv[1])
anchor = re.compile(r'^\s*[［\[「〔]\s*(\d+)\s*[］\]」〕]')
header = re.compile(r'問題\s*([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩIVX１２３４５６７８９\d]+)')

def lines(page):
    # Omit small ruby readings, retaining the base Japanese sentence.
    highlights = [a.rect for a in page.annots() if a.type[1] == 'Highlight']
    result = []
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            chars = [c for s in line['spans'] if s['size'] >= 9 for c in s['chars']]
            text = ''.join(c['c'] for c in chars).strip()
            marked = []
            for c in chars:
                if c['c'] in '①②③④':
                    rect = pymupdf.Rect(c['bbox'])
                    if any((rect & h).get_area() > rect.get_area() * .5 for h in highlights):
                        marked.append('①②③④'.index(c['c']))
            if text:
                result.append((text, marked, line['bbox']))
    return result

converted = 0
for category in bank:
    for topic in dict.fromkeys(q['topic'] for q in category['questions']):
        questions = [q for q in category['questions'] if q['topic'] == topic]
        records = []
        problem = 'Ⅰ'
        source_pages = {p['number']: p for q in category['questions'] for p in q['sourcePages']}
        for page in sorted(source_pages.values(), key=lambda p: p['number']):
            for text, marked, bounds in lines(doc[page['number'] - 1]):
                if match := header.search(text):
                    problem = match[1]
                records.append((text, page['number'], problem, marked, bounds))
        starts = []
        for i, (text, _, _, _, _) in enumerate(records):
            match = anchor.match(text)
            if not match:
                match = re.match(r'^\s*((?:[5-9]|[1-9]\d))\s+(?=[^\d\s])', text)
            if not match and category['id'] == 'n3-22':
                normalized = text.translate(str.maketrans('０１２３４５６７８９．', '0123456789.'))
                match = re.match(r'^\s*(\d+)\s*[.、]', normalized)
                if match and re.search(r'\d\s*[.、]', normalized[match.end():]):
                    match = None
            if match:
                starts.append((i, int(match[1])))
        # Vocabulary and grammar can share the same landscape PDF page.
        # Split at the numbering restart, rather than dropping half that page.
        boundary = next((i for j, (i, n) in enumerate(starts) if n == 1 and any(previous >= 20 for _, previous in starts[:j])), None)
        if boundary is not None:
            starts = [(i, n) for i, n in starts if (i < boundary if topic == 'Vocabulary' else i >= boundary)]
        for q in questions:
            candidates = [(i, n) for i, n in starts if n == q['number']]
            if len(candidates) != 1:
                continue
            start = candidates[0][0]
            stop = next((i for i, _ in starts if i > start), boundary if topic == 'Vocabulary' and boundary else len(records))
            chunk = []
            marked_answers = []
            for text, _, _, marked, _ in records[start:stop]:
                if header.search(text):
                    break
                marked_answers.extend(marked)
                # Ignore page numbers and blank-page furniture.
                if re.fullmatch(r'\d+|N3.*|選びなさい。', text):
                    continue
                chunk.append(text)
            if len(marked_answers) == 1:
                q['answer'] = marked_answers[0]
                q['answerSource'] = 'PDF highlight'
                q['sourceIssue'] = None
                q['explanation'] = 'The correct choice is highlighted in the source PDF.'
            q['problem'] = '問題' + records[start][2]
            q['sourcePage'] = records[start][1]
            if q['sourcePage'] not in [p['number'] for p in q['sourcePages']]:
                q['sourcePages'].append(source_pages[q['sourcePage']])
                q['sourcePages'].sort(key=lambda p: p['number'])
            if q.get('sourceIssue'):
                q['sourceIssue'] = re.sub(r'The question number could not be located.*', '', q['sourceIssue']).strip() or None
            if not q.get('individualItem'):
                page = doc[q['sourcePage'] - 1]
                origin = records[start][4]
                right_column = page.rect.width > page.rect.height and origin[0] > page.rect.width / 2
                left = page.rect.width / 2 if right_column else 0
                right = page.rect.width if right_column or page.rect.width <= page.rect.height else page.rect.width / 2
                bottom = page.rect.height - 30
                for next_i, _ in starts:
                    record = records[next_i]
                    if next_i > start and record[1] == q['sourcePage'] and left <= record[4][0] < right and record[4][1] > origin[1]:
                        bottom = min(bottom, record[4][1] - 3)
                clip = pymupdf.Rect(left + 20, max(0, origin[1] - 8), right - 15, bottom)
                filename = f"{q['id']}.png"
                page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), clip=clip, annots=False).save(ROOT / 'public/practice-n3' / filename)
                q['questionImage'] = '/practice-n3/' + filename
            text = ' '.join(chunk)
            markers = list(re.finditer('[①②③④]', text))
            groups = [markers[i:i+4] for i in range(len(markers)-3) if [m[0] for m in markers[i:i+4]] == list('①②③④')]
            if not groups and category['id'] == 'n3-22':
                text = text.translate(str.maketrans('０１２３４５６７８９．', '0123456789.'))
                markers = list(re.finditer(r'([1-4])\s*[.、]', text))
                groups = [markers[i:i+4] for i in range(len(markers)-3) if [m[1] for m in markers[i:i+4]] == list('1234')]
            if not groups:
                markers = list(re.finditer(r'(?<!\S)([1-4])\s+(?=[^\d\s])', text))
                groups = [markers[i:i+4] for i in range(len(markers)-3) if [m[1] for m in markers[i:i+4]] == list('1234')]
            if len(groups) != 1:
                continue
            options = groups[0]
            choices = [text[m.end():options[j+1].start() if j < 3 else len(text)].strip() for j, m in enumerate(options)]
            # Long trailing passages belong to subsequent reading questions.
            if not all(choices) or any(len(c) > 350 for c in choices):
                continue
            q['prompt'] = text[:options[0].start()].strip()
            q['choices'] = choices
            q['problem'] = '問題' + records[start][2]
            q['sourcePage'] = records[start][1]
            q['individualItem'] = True
            q.pop('questionImage', None)
            converted += 1

items = [q for category in bank for q in category['questions']]
for q in items:
    if q.get('individualItem'):
        unused_crop = ROOT / 'public/practice-n3' / f"{q['id']}.png"
        if unused_crop.is_file():
            unused_crop.unlink()
bank_path.write_text(json.dumps(bank, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'{sum(bool(q.get("individualItem")) for q in items)} text items; '
      f'{sum(bool(q.get("questionImage")) for q in items)} question crops; '
      f'{sum(not q.get("individualItem") and not q.get("questionImage") for q in items)} awaiting review')
