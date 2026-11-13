"""Preserve actual PDF underline positions without changing question text or keys."""
import json
import re
import sys
import unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
doc = pymupdf.open(sys.argv[1])
bank = json.loads((ROOT/'src/n3PracticeBank.json').read_text(encoding='utf-8'))
cache = {}
def normalized_chars(text):
    return [(c, i) for i, char in enumerate(text) for c in unicodedata.normalize('NFKC', char) if not c.isspace()]

def page_chars(number):
    if number in cache:
        return cache[number]
    page = doc[number-1]
    rules = []
    for drawing in page.get_drawings():
        r = drawing['rect']
        if r.width > 5 and r.height < 2:
            rules.append(r)
        for item in drawing['items']:
            if item[0] == 'l' and abs(item[1].y-item[2].y) < 1 and abs(item[1].x-item[2].x) > 5:
                rules.append(pymupdf.Rect(min(item[1].x,item[2].x), item[1].y, max(item[1].x,item[2].x), item[2].y+0.5))
    result = []
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines', []):
            line_text = ''.join(c['c'] for s in line['spans'] if s['size'] >= 9 for c in s['chars']).strip()
            if re.fullmatch(r'\d+', line_text) and (line['bbox'][1] < 45 or line['bbox'][1] > page.rect.height - 50):
                continue
            for span in line['spans']:
                if span['size'] < 9:
                    continue
                for char in span['chars']:
                    r = pymupdf.Rect(char['bbox'])
                    underlined = any(abs(rule.y0-r.y1) < 3 and min(rule.x1,r.x1)-max(rule.x0,r.x0) > r.width*.35 for rule in rules)
                    result.extend((c, underlined) for c, _ in normalized_chars(char['c']))
    cache[number] = result
    return result

output = {}
matched = 0
unmatched = []
for category in bank:
    for question in category['questions']:
        if not question.get('individualItem'):
            continue
        mapped = normalized_chars(question['prompt'])
        needle = ''.join(c for c, _ in mapped)
        if not needle:
            continue
        page = question['sourcePage']
        chars = page_chars(page)
        haystack = ''.join(c for c, _ in chars)
        start = haystack.find(needle)
        if start < 0 and page < len(doc):
            chars = chars + page_chars(page+1)
            start = ''.join(c for c, _ in chars).find(needle)
        if start < 0:
            for source_page in question['sourcePages']:
                chars = page_chars(source_page['number'])
                start = ''.join(c for c, _ in chars).find(needle)
                if start >= 0:
                    break
        if start < 0:
            unmatched.append(question['id'])
            continue
        matched += 1
        indexes = sorted(set(mapped[i][1] for i in range(len(mapped)) if chars[start+i][1]))
        ranges = []
        for i in indexes:
            if ranges and question['prompt'][ranges[-1]['end']:i].isspace():
                ranges[-1]['end'] = i+1
            elif ranges and ranges[-1]['end'] == i:
                ranges[-1]['end'] = i+1
            else:
                ranges.append({'start':i,'end':i+1})
        if ranges:
            output[question['id']] = {'prompt':question['prompt'], 'underlines':ranges}
(ROOT/'src/practicePresentation.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'matchedPrompts':matched,'underlinedPrompts':len(output),'unmatched':unmatched,'firstQuestion':output.get('n3-1-vocabulary-1')} ,ensure_ascii=False))
