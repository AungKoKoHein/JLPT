"""Extract section directions from the original PDF without changing question data."""
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tmp-python'))
import pymupdf

doc = pymupdf.open(sys.argv[1])
bank = json.loads((ROOT / 'src/n3PracticeBank.json').read_text(encoding='utf-8'))
normalize = lambda text: unicodedata.normalize('NFKC', text)
heading = re.compile(r'問題\s*([IVX]+|\d+)')
roman = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10}
canonical = lambda label: str(roman.get(label, label))
ending = re.compile(r'(?:なさい|ください)[。．.]')
pages = {}
page_lines = {}
for number, page in enumerate(doc, 1):
    lines = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            text = ''.join(span['text'] for span in line['spans'] if span['size'] >= 9).strip()
            if text:
                lines.append(text)
    page_lines[number] = lines
for number, original_lines in page_lines.items():
    lines = original_lines + page_lines.get(number + 1, [])[:8]
    entries = []
    for index, line in enumerate(original_lines):
        match = heading.search(normalize(line))
        if not match:
            continue
        text = line
        for continuation in lines[index + 1:index + 9]:
            if ending.search(text) and re.search(r'[。．.]\s*$', text) and not continuation.startswith('答え'):
                break
            if heading.search(normalize(continuation)) or re.match(r'^[［\[「]\s*\d+', normalize(continuation)):
                break
            text += continuation
        if ending.search(text):
            # Stop before passage text when the final PDF line contains both.
            end = list(ending.finditer(text))[-1]
            if end:
                text = text[:end.end()]
            entries.append((canonical(match[1]), re.sub(r'\s+', ' ', text).strip()))
    pages[number] = entries

output = {}
missing = []
for category in bank:
    groups = {}
    for question in category['questions']:
        problem = heading.search(normalize(question.get('problem', '')))
        if not problem:
            continue
        section = 'vocabulary' if question['topic'] == 'Vocabulary' else 'grammar'
        key = f"{category['id']}:{section}:{canonical(problem[1])}"
        groups.setdefault(key, []).append(question)
    for key, questions in groups.items():
        first = questions[0]
        problem = key.rsplit(':', 1)[1]
        allowed = sorted({page['number'] for q in questions for page in q.get('sourcePages', [])})
        candidates = [(page, text) for page in allowed if page <= first['sourcePage']
                      for label, text in pages[page] if label == problem]
        if not candidates:
            candidates = [(page, text) for page in allowed for label, text in pages[page] if label == problem][:1]
        if candidates:
            output[key] = candidates[-1][1]
        else:
            missing.append({'key': key, 'page': first['sourcePage']})

(ROOT / 'src/practiceInstructions.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sections': len(output), 'missing': missing}, ensure_ascii=False))
