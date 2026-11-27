import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import set from '../src/n3Listening201612.json' with {type:'json'};
import {listeningCollections} from '../src/listeningCollections.js';
import {routesForLevel,studyTabFromPath} from '../src/studyRoutes.js';

test('all three listening sets have complete ordered tracks, source pages and illustrations',()=> {
  assert.equal(listeningCollections.length,3);
  const paths=new Set();
  for(const collection of listeningCollections) {
    assert.deepEqual(collection.sections.map(s=>s.questions.length),[6,6,3,4,9]);
    let end=0;
    for(const section of collection.sections) {
      if(section.intro) {
        assert.ok(section.intro.start>=end && section.intro.end>section.intro.start);
        assert.ok(fs.statSync(`public/${section.intro.audio}`).size>1000);
        end=section.intro.end;
      }
      for(const q of section.questions) {
        assert.ok(q.start>=end && q.end>q.start && q.end<=collection.duration);
        end=q.end;
        assert.equal(paths.has(q.audio),false); paths.add(q.audio);
        assert.ok(fs.statSync(`public/${q.audio}`).size>10000);
        assert.ok(collection.pdfPages.includes(q.pdfPage));
        assert.equal(q.answer,null);
        assert.equal(q.options.length,section.number<=3?4:3);
        if(q.image) assert.ok(fs.statSync(`public/${q.image}`).size>1000);
      }
    }
    assert.equal(collection.sections.flatMap(s=>s.questions).filter(q=>q.image).length,collection.id==='n3-2016-12'?5:6);
    assert.ok(fs.statSync(`public/${collection.pdf}`).size>1000);
  }
  assert.equal(paths.size,84);
});

test('the supplied 2016 N3 audio and PDF provide 28 sequential listening questions',()=> {
  assert.equal(routesForLevel('n3').Listening,'/n3/listening');
  assert.equal(studyTabFromPath('/n3/listening/'),'Listening');
  assert.equal(routesForLevel('n2').Listening,undefined);
  assert.deepEqual(set.sections.map(s=>s.questions.length),[6,6,3,4,9]);
  assert.deepEqual(set.pdfPages,[15,16,17,18]);
  const all=set.sections.flatMap(s=>s.questions);
  assert.equal(new Set(all.map(q=>q.id)).size,28);
  let end=0;
  for(const section of set.sections) for(const [index,q] of section.questions.entries()) {
    assert.equal(q.number,index+1);
    assert.equal(q.section,section.number);
    assert.ok(q.start>=end && q.end>q.start && q.end<=set.duration);
    end=q.end;
    assert.equal(q.options.length,section.number<=3?4:3);
    assert.equal(q.answer,null,'No answer keys are invented');
    assert.ok(fs.statSync(`public/${q.audio}`).size>10000);
    if(section.number<=2) assert.ok(q.options.every(Boolean));
    else assert.ok(q.options.every(text=>text===''),'Audio-only choices are not invented');
  }
  const pictures=all.filter(q=>q.image);
  assert.equal(pictures.length,5);
  for(const q of pictures) { assert.ok(q.imageAlt); assert.ok(fs.statSync(`public/${q.image}`).size>1000); }
  assert.ok(fs.statSync(`public/${set.pdf}`).size>1000);
  assert.ok(fs.statSync(`public/${set.audio}`).size>19000000);
});
