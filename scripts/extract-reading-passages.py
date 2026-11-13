"""Extract base-font reading passages from the supplied N3 collection.

Usage: python scripts/extract-reading-passages.py path/to/collection.pdf
Question text and grading remain linked to the reviewed practice bank.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
bank = json.loads((ROOT / 'src/n3PracticeBank.json').read_text(encoding='utf-8'))
doc = pymupdf.open(sys.argv[1])
normalize = lambda s: re.sub(r'\s+', '', unicodedata.normalize('NFKC', s))
heading = re.compile(r'^(?:[*＊\s]*)(?:問題\s*)?(VII|VI|IV|V)(?![IVX])(?:\s*[:：(（]|$)')
anchor = re.compile(r'^\s*(?:[［\[「【]\s*(\d+)\s*[］\]」】]|(2[4-9]|3[0-9])(?:\s|$))')
output = []
issues = []
for category in bank:
    if category['id'] in ['n3-2', 'n3-17', 'n3-22']:
        continue
    first = next(q['sourcePage'] for q in category['questions'] if q['topic'] == 'Grammar & reading' and q['number'] == 1)
    last = min(p['number'] for q in category['questions'] for p in q['keyPages'])
    chunks = []
    current = None
    for page_num in range(first, last):
        for block in doc[page_num-1].get_text('dict')['blocks']:
            for line in block.get('lines', []):
                text = ''.join(s['text'] for s in line['spans'] if s['size'] >= 9).strip()
                if not text or re.fullmatch(r'\d+|N3.*', text):
                    continue
                match = heading.match(unicodedata.normalize('NFKC', text))
                if match:
                    current = {'section': match[1], 'lines': [], 'numbers': [], 'pages': []}
                    chunks.append(current)
                    continue
                if current is None:
                    continue
                if re.fullmatch(r'[（(]\s*[1-4１-４]\s*[）)]', text):
                    current = {'section': current['section'], 'lines': [], 'numbers': [], 'pages': []}
                    chunks.append(current)
                    continue
                current['lines'].append(text)
                if page_num not in current['pages']:
                    current['pages'].append(page_num)
                match = anchor.match(text)
                if match and 24 <= int(match[1] or match[2]) <= 39:
                    current['numbers'].append(int(match[1] or match[2]))
    passages = []
    pending = []
    for chunk in chunks:
        if not chunk['numbers']:
            pending.extend(chunk['lines'])
            continue
        text = '\n'.join(pending + chunk['lines'])
        pending = []
        questions = [dict(q) for q in category['questions'] if q['topic'] == 'Grammar & reading' and q['number'] in chunk['numbers'] and q['sourcePage'] in chunk['pages']]
        # Match with whitespace ignored, but retain source line breaks in passages.
        compact = ''
        positions = []
        for i, char in enumerate(text):
            for c in normalize(char):
                compact += c
                positions.append(i)
        removed = set()
        matched_questions = []
        for q in questions:
            if q.get('individualItem'):
                # The old importer sometimes attached the next passage to D.
                q['choices'] = list(q['choices'])
                q['choices'][-1] = re.split(r'\s+(?:[*＊]+\s*)?(?:(?:問題\s*)?[IVXⅠⅡⅢⅣⅤⅥⅦ]+\s*)?[（(][1-4１-４][）)]\s+', q['choices'][-1], maxsplit=1)[0].strip()
            else:
                begin = next((i for i, line in enumerate(chunk['lines']) if (m := anchor.match(line)) and int(m[1] or m[2]) == q['number']), None)
                if begin is None:
                    continue
                end_line = next((i for i in range(begin+1, len(chunk['lines'])) if anchor.match(chunk['lines'][i])), len(chunk['lines']))
                question_text = ' '.join(chunk['lines'][begin:end_line])
                markers = list(re.finditer('[①②③④]', question_text))
                if len(markers) != 4 or [m[0] for m in markers] != list('①②③④'):
                    continue
                q['prompt'] = question_text[:markers[0].start()].strip()
                q['choices'] = [question_text[m.end():markers[i+1].start() if i<3 else len(question_text)].strip() for i,m in enumerate(markers)]
                if not all(q['choices']) or any(len(c)>350 for c in q['choices']):
                    continue
                q['individualItem'] = True
                q.pop('questionImage', None)
            prompt = normalize(q['prompt'])
            start = compact.find(prompt)
            end_choice = normalize(q['choices'][-1])
            end = compact.find(end_choice, start + len(prompt)) if start >= 0 else -1
            if start < 0 or end < 0:
                issues.append([category['id'], q['number'], 'question text not matched'])
                continue
            removed.update(range(positions[start], positions[end + len(end_choice) - 1] + 1))
            matched_questions.append(q)
        cleaned = ''.join(c for i, c in enumerate(text) if i not in removed)
        # Unconverted questions are rendered separately with their source crop.
        # They must not appear inside the readable passage as answer text.
        cleaned = re.sub(r'(?:^|\n)\s*[［\[「【]\s*\d{2}\s*[］\]」】].*?(?=(?:\n\s*[［\[「【]\s*\d{2}\s*[］\]」】])|\Z)', '', cleaned, flags=re.S)
        # Any remaining question anchors belong to image-only or unmatched items.
        # Keep their source text available instead of inventing a transcription.
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
        cleaned = re.sub(r'^.*?(?:一つ選びなさい。|ひとつ選びなさい。)\s*', '', cleaned, count=1) if '選びなさい。' in cleaned[:180] else cleaned
        # Rejoin fragments split around the small ruby spans in the PDF.
        paragraphs = []
        for line in cleaned.splitlines():
            line = line.strip()
            if not line:
                continue
            if re.fullmatch(r'-{5,}', line):
                paragraphs.append('')
                continue
            previous = paragraphs[-1] if paragraphs else ''
            if not previous or re.search(r'[。！？]$|@|先生$|様$', previous) or re.match(r'[（(]注|[●◎☆]|宛名|差出人|日時|件名|tel\.', line):
                paragraphs.append(line)
            else:
                paragraphs[-1] += line
        cleaned = '\n'.join(paragraphs)
        if not matched_questions or len(cleaned) < 50:
            continue
        passages.append({'id': f"{category['id']}-reading-{len(passages)+1}",
            'title': f"{category['title']} · {chunk['section']} · {len(passages)+1}",
            'type': {'IV':'Short passage','V':'Mid-size passage','VI':'Long passage','VII':'Information retrieval'}[chunk['section']],
            'text': cleaned, 'sourcePages': chunk['pages'],
            'questions': matched_questions})
    if passages:
        output.append({'id': category['id'], 'title': category['title'], 'sourceRange': category['sourceRange'], 'passages': passages})
(ROOT/'src/pdfReadingPassages.json').write_text(json.dumps(output, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'sets':len(output),'passages':sum(len(s['passages']) for s in output),'questions':sum(len(p['questions']) for s in output for p in s['passages']),'unmatched':issues}, ensure_ascii=False))
