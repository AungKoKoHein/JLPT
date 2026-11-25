"""Import all questions and policy images from the user-supplied AWS PDF.

Usage: python scripts/import-aws-practice.py <pdf>
Requires PyMuPDF (the existing .tmp-python install is supported).
No answer keys are inferred from the source.
"""
import collections
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tmp-python'))
import pymupdf

source = Path(sys.argv[1])
doc = pymupdf.open(source)
texts = [page.get_text() for page in doc]
offsets = []
text = ''
for page_text in texts:
    offsets.append(len(text))
    text += page_text + '\n'
headers = list(re.finditer(r'Topic (\d+)\s*\nQuestion #(\d+)\s*\n', text))
out = ROOT / 'public' / 'practice-aws'
out.mkdir(parents=True, exist_ok=True)
questions = []

def clean(value):
    return re.sub(r'\s+', ' ', value).strip()

for index, header in enumerate(headers):
    end = headers[index + 1].start() if index + 1 < len(headers) else len(text)
    body = text[header.end():end].strip()
    options = list(re.finditer(r'^([A-F])\.[ \t]*(?:\n)?', body, re.M))
    number = int(header[2])
    labels = [match[1] for match in options]
    source_note = None
    if number == 125 and labels == ['A', 'B', 'C', 'D', 'D']:
        source_note = 'The PDF labels its last two options D. The final option is labeled E here to give each choice a unique letter.'
    else:
        assert labels == list('ABCDEF'[:len(options)]), (number, labels)
    assert 4 <= len(options) <= 6, (number, labels)
    prompt = clean(body[:options[0].start()])
    choices = [clean(body[match.end():options[j + 1].start() if j + 1 < len(options) else len(body)]) for j, match in enumerate(options)]
    count_match = re.search(r'\(Choose (two|three)\.\)', prompt, re.I)
    count = {'two': 2, 'three': 3}[count_match[1].lower()] if count_match else 1
    page_numbers = [i + 1 for i, offset in enumerate(offsets) if offset < end and offset + len(texts[i]) > header.start()]
    item = {'id': f'aws-saa-c03-{number}', 'number': number, 'topic': f'Topic {header[1]}',
            'sourcePage': page_numbers[0], 'sourcePages': page_numbers, 'prompt': [prompt],
            'choices': choices, 'selectCount': count, 'answers': None, 'promptImages': [], 'choiceImages': {}}
    if source_note:
        item['sourceIssue'] = source_note
    # Associate each non-watermark image with its containing question and option.
    for page_number in page_numbers:
        page = doc[page_number - 1]
        blocks = page.get_text('dict')['blocks']
        lines = [(line['bbox'], ''.join(span['text'] for span in line['spans']))
                 for block in blocks if block['type'] == 0 for line in block['lines']]
        starts = [(bbox[1], int(match[1])) for bbox, value in lines if (match := re.fullmatch(r'Question #(\d+)', value.strip()))]
        for block in blocks:
            if block['type'] != 1 or (block['width'], block['height']) == (180, 25):
                continue
            y = block['bbox'][1]
            preceding = [entry for entry in starts if entry[0] < y]
            owner = max(preceding)[1] if preceding else (questions[-1]['number'] if questions else None)
            if owner != number:
                continue
            filename = f'question-{number}-{len(item["promptImages"]) + len(item["choiceImages"]) + 1}.{block["ext"]}'
            (out / filename).write_bytes(block['image'])
            asset = {'src': f'/practice-aws/{filename}', 'alt': f'Policy diagram for question {number}'}
            q_y = max((v[0] for v in starts if v[1] == number), default=0)
            option_lines = [(bbox[1], match[1]) for bbox, value in lines
                            if q_y < bbox[1] < block['bbox'][3] and (match := re.match(r'^([A-F])\.\s*', value))]
            if option_lines:
                letter = max(option_lines)[1]
                asset['alt'] = f'Option {letter} policy for question {number}'
                item['choiceImages'][letter] = asset
            else:
                item['promptImages'].append(asset)
    assert prompt and all(choice or chr(65 + j) in item['choiceImages'] for j, choice in enumerate(choices)), number
    questions.append(item)

assert [q['number'] for q in questions] == list(range(1, 685)), 'Question sequence must contain exactly 1–684'
assert sum(len(q['promptImages']) + len(q['choiceImages']) for q in questions) == 11
bank = {'title': source.name, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'sourcePageCount': len(doc), 'questions': questions}
(ROOT / 'src' / 'awsPracticeBank.json').write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'questions': len(questions), 'selectionCounts': dict(collections.Counter(q['selectCount'] for q in questions)), 'images': 11, 'sourceIssues': [q['number'] for q in questions if q.get('sourceIssue')]}))
