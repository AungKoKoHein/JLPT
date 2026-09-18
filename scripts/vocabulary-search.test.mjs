import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesVocabulary } from '../src/vocabularySearch.js';

test('matches written terms and continuous readings across annotations', () => {
  const card = { term: 'お酒（さけ）を飲（の）む', meaning: 'drink alcohol' };
  for (const query of ['お酒を飲む', 'おさけをのむ', 'のむ', 'サケ', 'alcohol']) {
    assert.equal(matchesVocabulary(card, query), true, query);
  }
  assert.equal(matchesVocabulary({ term: '冷蔵庫(れいぞうこ)' }, 'ﾚｲｿﾞｳｺ'), true);
});

test('examples and chapter metadata cannot produce a vocabulary match', () => {
  const card = { term: '本（ほん）', meaning: 'book', exampleJapanese: '読む', exampleMyanmar: 'example only', title: 'chapter only' };
  for (const query of ['読む', 'example only', 'chapter only']) {
    assert.equal(matchesVocabulary(card, query), false);
  }
});
