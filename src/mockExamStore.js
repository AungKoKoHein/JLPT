import { onValue, push, ref, remove, set } from 'firebase/database';
import { database } from './firebase.js';

export const localExamRecords = import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const eventName = 'mock-exam-records-changed';
const storageKey = uid => `jlpt:local-mock-exams:${uid}`;
export const examRecordPath = uid => localExamRecords
  ? `mockExamRecords/${uid}/${crypto.randomUUID()}`
  : `mockExamRecords/${uid}/${push(ref(database, `mockExamRecords/${uid}`)).key}`;

function readLocal(uid) {
  return JSON.parse(localStorage.getItem(storageKey(uid)) || '{}');
}
function writeLocal(uid, records) {
  localStorage.setItem(storageKey(uid), JSON.stringify(records));
  window.dispatchEvent(new Event(eventName));
}
export async function saveExamRecord(path, record) {
  if (!localExamRecords) return set(ref(database, path), record);
  const [, uid, id] = path.split('/');
  writeLocal(uid, { ...readLocal(uid), [id]: record });
}
export async function deleteExamRecord(uid, id) {
  if (!localExamRecords) return remove(ref(database, `mockExamRecords/${uid}/${id}`));
  const records = readLocal(uid);
  delete records[id];
  writeLocal(uid, records);
}
export function subscribeExamRecords(uid, onRecords, onError) {
  const deliver = records => onRecords(Object.entries(records || {}).map(([id, record]) => ({ ...record, id })));
  if (!localExamRecords) return onValue(ref(database, `mockExamRecords/${uid}`), snapshot => deliver(snapshot.val()), onError);
  const update = () => { try { deliver(readLocal(uid)); } catch (error) { onError(error); } };
  const storageUpdate = event => { if (event.key === storageKey(uid) || event.key === null) update(); };
  window.addEventListener(eventName, update);
  window.addEventListener('storage', storageUpdate);
  update();
  return () => {
    window.removeEventListener(eventName, update);
    window.removeEventListener('storage', storageUpdate);
  };
}
