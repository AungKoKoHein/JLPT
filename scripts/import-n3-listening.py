"""Import the supplied December 2016 N3 listening set for local study.

Usage: python scripts/import-n3-listening.py <mp3> <pdf> <reviewed-timings.json>
Requires PyMuPDF and PyAV. Timings are reviewed against locally generated speech
segments; speech recognition output is not presented as an official transcript.
The source files are read without modification. Only listening PDF pages 15–18
and the original question illustrations are included in the app.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tmp-python'))
import pymupdf
import av


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('audio', type=Path)
    parser.add_argument('pdf', type=Path)
    parser.add_argument('timings', type=Path)
    args = parser.parse_args()
    timing = json.loads(args.timings.read_text(encoding='utf-8'))
    collection_id = timing.get('id', 'n3-2016-12')
    pdf_pages = timing.get('pdfPages', [15,16,17,18])
    layout = timing.get('layout')
    if timing.get('layoutFile'):
        layout = json.loads((args.timings.parent / timing['layoutFile']).read_text(encoding='utf-8'))
    target = ROOT / 'public/listening' / collection_id
    target.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.audio, target / 'full-recording.mp3')
    pdf = pymupdf.open(args.pdf)
    excerpt = pymupdf.open()
    for page_number in pdf_pages:
        excerpt.insert_pdf(pdf, from_page=page_number-1, to_page=page_number-1)
    excerpt.save(target / 'listening-questions.pdf', garbage=4, deflate=True)

    # Preserve actual embedded question pictures, including the arrow markers.
    if layout:
        for image in layout['images']:
            pdf[image['page']-1].get_pixmap(matrix=pymupdf.Matrix(2,2),clip=pymupdf.Rect(image['rect']),alpha=False).save(target / f"{image['id']}.png")
    else:
        image_rects = [(15, 's1-q1', 0)] + [(18, f's4-q{i+1}', i) for i in range(4)]
        for page_number, name, image_index in image_rects:
            page = pdf[page_number-1]
            bbox = page.get_image_info()[image_index]['bbox']
            page.get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=pymupdf.Rect(bbox), alpha=False).save(target / f'{name}.png')

    def options(page_number, top, bottom):
        text = pdf[page_number-1].get_text(clip=pymupdf.Rect(35, top, 575, bottom))
        import re
        rows = re.split(r'(?m)^\s*[1-4]\.\s*', text)[1:]
        return [' '.join(row.split()) for row in rows]

    printed = {} if layout else {
        (1,1): ['アウ', 'アエ', 'イウ', 'イエ'],
        (1,2): options(15,500,593), (1,3): options(15,624,717),
        (1,4): options(16,92,184), (1,5): options(16,216,308),
        (1,6): options(16,339,432),
        (2,1): options(16,537,629), (2,2): options(16,660,753),
        (2,3): options(17,92,184), (2,4): options(17,216,308),
        (2,5): options(17,339,432), (2,6): options(17,463,554),
    }
    page_map = {(1,1):15,(1,2):15,(1,3):15,(1,4):16,(1,5):16,(1,6):16,
                (2,1):16,(2,2):16,(2,3):17,(2,4):17,(2,5):17,(2,6):17}
    directions = {
        1:'まず質問を聞いてください。それから話を聞いて、問題用紙の1から4の中から、最もよいものを一つえらんでください。',
        2:'まず質問を聞いてください。そのあと、問題用紙を見てください。読む時間があります。それから話を聞いて、1から4の中から、最もよいものを一つえらんでください。',
        3:'問題用紙に何もいんさつされていません。まず話を聞いてください。それから、質問とせんたくしを聞いて、1から4の中から、最もよいものを一つえらんでください。',
        4:'えを見ながら質問を聞いてください。やじるし（➡）の人は何と言いますか。1から3の中から、最もよいものを一つえらんでください。',
        5:'問題用紙に何もいんさつされていません。まず文を聞いてください。それから、そのへんじを聞いて、1から3の中から、最もよいものを一つえらんでください。',
    }
    section_names = {1:'課題理解',2:'ポイント理解',3:'概要理解',4:'発話表現',5:'即時応答'}
    sections = []
    intervals = []
    for section in timing['sections']:
        number = section['number']
        intro = section.get('intro')
        result = {'number':number,'title':section_names[number],'directions':directions[number],'questions':[]}
        if intro:
            result['intro'] = {**intro,'audio':f'listening/{collection_id}/s{number}-intro.mp3'}
            intervals.append((f's{number}-intro', intro['start'], intro['end']))
        for item in section['questions']:
            q = item['number']
            identity = f's{number}-q{q}'
            imported = layout['questions'].get(identity, {}) if layout else {}
            choices = imported.get('options', printed.get((number,q), [''] * (4 if number<=3 else 3)))
            assert len(choices)==(4 if number<=3 else 3), (number,q,choices)
            question = {**item,'id':identity,'section':number,'options':choices,
                        'audio':f'listening/{collection_id}/{identity}.mp3',
                        'pdfPage':imported.get('page', layout['sectionPages'][str(number)] if layout else page_map.get((number,q),17 if number==3 else 18)),
                        'answer':None}
            if imported.get('pages'):
                question['pdfPages']=imported['pages']
            has_image = any(image['id']==identity for image in layout['images']) if layout else (number,q)==(1,1) or number==4
            if has_image:
                question['image']=f'listening/{collection_id}/{identity}.png'
                question['imageAlt']=f'問題{number}・{q}番の問題用紙の図。' + ('矢印の人の発話を選んでください。' if number==4 else '図の選択肢を見てください。')
            if imported.get('printedChoices'):
                question['printedChoices']=True
            result['questions'].append(question)
            intervals.append((identity,item['start'],item['end']))
        sections.append(result)

    # Stream-copy original MP3 frames; no lossy re-encoding or audio upload.
    for name, start, end in intervals:
        assert 0 <= start < end <= timing['duration']
        with av.open(str(args.audio)) as source:
            stream = source.streams.audio[0]
            source.seek(max(0,int((start-1)/stream.time_base)),stream=stream)
            with av.open(str(target / f'{name}.mp3'),'w',format='mp3') as output:
                out_stream = output.add_stream_from_template(stream)
                origin = None
                for packet in source.demux(stream):
                    if packet.pts is None:
                        continue
                    seconds = float(packet.pts * stream.time_base)
                    if seconds < start:
                        continue
                    if seconds >= end:
                        break
                    if origin is None:
                        origin = packet.pts
                    packet.pts -= origin
                    if packet.dts is not None:
                        packet.dts -= origin
                    packet.stream = out_stream
                    output.mux(packet)
        print(f'{name}: {start:.2f}–{end:.2f}s',flush=True)

    manifest = {'id':collection_id,'title':timing.get('title','2016年12月 · JLPT N3'),'duration':timing['duration'],
                'audio':f'listening/{collection_id}/full-recording.mp3',
                'pdf':f'listening/{collection_id}/listening-questions.pdf','sourcePdf':args.pdf.name,
                'sourceAudio':args.audio.name,'pdfPages':pdf_pages,
                'sourceAudioSha256':hashlib.sha256(args.audio.read_bytes()).hexdigest(),
                'sourcePdfSha256':hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
                'sections':sections}
    filename = collection_id.replace('-', '')[2:]
    (ROOT/f'src/n3Listening{filename}.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


if __name__ == '__main__':
    main()
