"""Parse the supplied answer notes; unresolved entries require reviewed overrides."""
import difflib
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
text = source.read_text(encoding='utf-8-sig')
bank = json.loads((ROOT / 'src/awsPracticeBank.json').read_text(encoding='utf-8'))['questions']
headers = [m for m in re.finditer(r'^(?:\s*|IMP>+)(\d{1,3})([\].])\s*', text, re.M) if m[2] == ']' or int(m[1]) >= 51]
entries = {}
for i, match in enumerate(headers):
    number = int(match[1])
    body = text[match.end():headers[i+1].start() if i+1 < len(headers) else len(text)].strip()
    if number == 215 and number in entries and 'experienced a breach' in body:
        number = 315  # The source notes repeat 215; this prompt matches PDF question 315.
    if number in entries and not re.search(r'[A-Za-z]', body):
        continue
    assert number not in entries, f'Duplicate heading: {number}'
    entries[number] = body

normalize = lambda value: re.sub(r'\W', '', value.lower())
resolved = {}
for number, body in entries.items():
    question = bank[number-1]
    labels = sorted(set(re.findall(r'^\s*([A-F])[.)]\s+', body, re.M)))
    explicit = []
    for line in re.findall(r'^\s*(?:Answers?|Correct answers?)\s*[:\-]?\s*(.*)', body, re.I | re.M):
        values = re.findall(r'\b([A-F])[.)](?:\s|$)', line)
        if not values:
            values = re.findall(r'\b([A-F])\b', line.split('because')[0].split(':')[0])
        if len(set(values)) == question['selectCount']:
            explicit = sorted(set(values))
            break
    values = explicit or (labels if len(labels) == question['selectCount'] else [])
    if not values:
        matches = [chr(65+i) for i, choice in enumerate(question['choices']) if len(normalize(choice)) > 20 and normalize(choice) in normalize(body)]
        if len(matches) == question['selectCount']:
            values = matches
    if not values:
        answer_line = re.search(r'^\s*ans\s*[-:]\s*\.?\s*(.+)', body, re.I | re.M)
        if answer_line:
            scores = [difflib.SequenceMatcher(None, normalize(answer_line[1]), normalize(choice)).ratio() for choice in question['choices']]
            if max(scores) > .75:
                values = [chr(65 + scores.index(max(scores)))]
    if values and len(values) == question['selectCount'] and all(ord(letter)-65 < len(question['choices']) for letter in values):
        resolved[number] = {'answers': values, 'answerSource': source.name}

missing = [question['number'] for question in bank if question['number'] not in resolved]
(ROOT / '.tmp-python/aws-key-entries.json').write_text(json.dumps(entries, ensure_ascii=False), encoding='utf-8')
(ROOT / '.tmp-python/aws-key-auto.json').write_text(json.dumps(resolved), encoding='utf-8')
(ROOT / '.tmp-python/aws-key-missing.json').write_text(json.dumps(missing), encoding='utf-8')
print(f'Parsed {len(resolved)} keys; {len(missing)} need review: {missing}')
overrides_path = ROOT / 'src/awsAnswerOverrides.json'
if overrides_path.exists():
    overrides = json.loads(overrides_path.read_text(encoding='utf-8'))
    for number, override in overrides.items():
        resolved[int(number)] = override
    assert set(resolved) == set(range(1, 685)), 'Every question requires a key'
    for number, entry in resolved.items():
        question = bank[number-1]
        assert len(entry['answers']) == question['selectCount'], number
        assert len(set(entry['answers'])) == len(entry['answers']), number
        assert all(letter in 'ABCDEF'[:len(question['choices'])] for letter in entry['answers']), number
    result = {'source': source.name, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'answers': {str(n): resolved[n] for n in sorted(resolved)}}
    (ROOT / 'src/awsAnswerKeys.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote all {len(resolved)} keys.')
