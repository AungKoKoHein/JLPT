"""Import the supplied 26-test PDF without losing furigana, tables or underlines.

Run with PyMuPDF available: python scripts/import-n3-practice.py <PDF path>
Question pages stay as images; the original answer tables supply grading.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "practice-n3"
OUT.mkdir(parents=True, exist_ok=True)
doc = pymupdf.open(sys.argv[1])
norm = lambda value: unicodedata.normalize("NFKC", value)
starts = [1,17,33,47,62,86,102,117,130,143,158,172,187,201,216,230,242,254,267,280,294,308,329,342,357,370,383]
sets = []
issues = []

def key_entries(page):
    words = page.get_text("words")
    entries = {}
    for w in words:
        text = norm(w[4]).strip()
        match = re.fullmatch(r"\[?(\d{1,2})\]", text)
        if not match:
            continue
        number = int(match[1])
        center = (w[0] + w[2]) / 2
        candidates = [v for v in words if re.fullmatch(r"[1-9]", norm(v[4]).strip())
                      and 3 < v[1] - w[1] < 48
                      and abs((v[0]+v[2])/2-center) < 18]
        candidates.sort(key=lambda v: (v[1]-w[1], abs((v[0]+v[2])/2-center)))
        answer = int(norm(candidates[0][4])) if candidates else None
        entries[number] = answer
    return entries

def image(page_number):
    filename = f"page-{page_number:03}.webp"
    target = OUT / filename
    if not target.exists():
        page = doc[page_number-1]
        # PNG is supported natively by MuPDF and keeps Japanese text sharp.
        filename = f"page-{page_number:03}.png"
        target = OUT / filename
        if not target.exists():
            page.get_pixmap(matrix=pymupdf.Matrix(1.5,1.5), alpha=False).save(target)
    return f"/practice-n3/{filename}"

for category_index, (start, stop) in enumerate(zip(starts, starts[1:]), 1):
    key_pages = [p for p in range(start, stop) if len(re.findall(r"\[\s*\d+\s*\]",norm(doc[p-1].get_text()))) > 25]
    assert len(key_pages) == 2, (category_index, key_pages)
    vocabulary_key, grammar_key = key_pages
    grammar_keys = [grammar_key] + ([grammar_key+1] if category_index == 22 else [])
    vocab = key_entries(doc[vocabulary_key-1])
    grammar = {}
    for page_num in grammar_keys:
        grammar.update(key_entries(doc[page_num-1]))
    if category_index == 22:
        # Headers 28–33 are on PDF page 327; their answer row continues on 328.
        continuation = [int(norm(w[4])) for w in doc[327].get_text("words") if re.fullmatch(r"[1-4]",norm(w[4]))][:6]
        assert len(continuation) == 6
        grammar.update(dict(zip(range(28,34),continuation)))
    source_pages = [p for p in range(start, vocabulary_key) if len(doc[p-1].get_text().strip()) > 20]
    # The booklet restarts numbering for grammar. Locate the first grammar Q1.
    grammar_start = None
    for p in source_pages:
        if p <= start+2:
            continue
        text = norm(doc[p-1].get_text())
        if re.search(r"[\[「]\s*1\s*[\]」]",text) or ("文法" in text and "文字・語彙" not in text):
            grammar_start = p
            break
    # N3-21 uses bare question numbers and a separate grammar cover.
    if category_index == 22:
        grammar_start = 315
    if grammar_start is None:
        grammar_start = start+3
    printed = re.search(r"[NＮ]\s*[3３]\s*[-－]\s*(\d+)",doc[start-1].get_text())
    printed_label = f"N3-{printed[1]}" if printed else f"N3-{category_index}"
    questions = []
    for section, entries, first, last in [("Vocabulary",vocab,start,grammar_start-1),("Grammar & reading",grammar,grammar_start,vocabulary_key-1)]:
        pages = [p for p in source_pages if first <= p <= last]
        count = 51 if category_index == 22 and section == "Vocabulary" else 35 if section == "Vocabulary" else 39
        last_found_page = first
        for number in range(1,count+1):
            found = []
            for p in pages:
                text = norm(doc[p-1].get_text())
                if re.search(r"(?:[\[「]\s*"+str(number)+r"(?!\d)\s*[\]」]?|(?:^|\n)\s*"+str(number)+r"(?:\.|\s+(?=[^\d\s])))",text):
                    found.append(p)
            if found:
                last_found_page = found[0]
            answer = entries.get(number)
            issue = None
            if answer not in [1,2,3,4]:
                issue = f"The PDF answer key {'prints '+str(answer) if answer else 'has no readable answer'} for this question. Review the source key; this item is not scored."
            if not found:
                issue = (issue+" " if issue else "") + "The question number could not be located in the PDF text. Use the source page controls to review this section."
            if issue:
                issues.append({"set":category_index,"section":section,"number":number,"note":issue})
            questions.append({"id":f"n3-{category_index}-{section.split()[0].lower()}-{number}","number":number,"topic":section,"prompt":f"{section} · Question {number}","choices":["①","②","③","④"],"answer":answer-1 if answer in [1,2,3,4] else None,"sourcePage":found[0] if found else last_found_page,"sourcePages":[{"number":p,"src":image(p)} for p in pages],"keyPages":[{"number":p,"src":image(p)} for p in ([vocabulary_key] if section == "Vocabulary" else grammar_keys)],"sourceIssue":issue,"explanation":"Answer transcribed from the PDF answer key. The PDF does not provide an explanation for this question."})
    sets.append({"id":f"n3-{category_index}","title":f"N3-{category_index}","printedLabel":printed_label,"sourceRange":f"{start}–{stop-1}","questions":questions})
    print(f"N3-{category_index}: {len(questions)} questions; source label {printed_label}; pages {start}-{stop-1}")

(ROOT/"src"/"n3PracticeBank.json").write_text(json.dumps(sets,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8",newline="\n")
(ROOT/"docs"/"n3-practice-import.json").write_text(json.dumps({"source":Path(sys.argv[1]).name,"sets":len(sets),"questions":sum(len(s["questions"]) for s in sets),"issues":issues},ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="\n")
print(f"Import complete; {len(issues)} source issues recorded.")
