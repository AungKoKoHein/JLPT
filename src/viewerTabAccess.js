import { routesForLevel, levelFromPath, studyTabFromPath } from './studyRoutes.js';

export const viewerTabGroups = [
  {level:'n3',label:'JLPT N3',tabs:['Vocab','Grammar','Kanji','Listening','Reading','Mock exam','Practice']},
  {level:'n2',label:'JLPT N2',tabs:['Vocab','Grammar','Kanji','Reading','Mock exam']},
  {level:'aws',label:'AWS',tabs:['Part 1','Part 2','Part 3','Part 4','Practice']},
].map(group=>({...group,tabs:group.tabs.map(label=>({label,path:routesForLevel(group.level)[label],key:routesForLevel(group.level)[label].slice(1).replaceAll('/','-')}))}));
const knownKeys=new Set(viewerTabGroups.flatMap(group=>group.tabs.map(tab=>tab.key)));
export function validateTabAccess(value) {
  if(!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).some(key=>!['mode','tabs'].includes(key)) || !['all','selected'].includes(value.mode)) throw new Error('Choose all tabs or selected tabs.');
  if(value.tabs!==undefined && (!value.tabs || typeof value.tabs!=='object' || Array.isArray(value.tabs) || Object.entries(value.tabs).some(([key,allowed])=>!knownKeys.has(key)||typeof allowed!=='boolean'))) throw new Error('Invalid tab permissions.');
  return value.mode==='all'?{mode:'all'}:{mode:'selected',tabs:Object.fromEntries(Object.entries(value.tabs||{}).filter(([,allowed])=>allowed))};
}
export function effectiveTabAccess(value) {
  if(value===undefined || value===null) return {mode:'all'}; // Existing viewers keep their access.
  try { return validateTabAccess(value); } catch { return {mode:'selected',tabs:{}}; }
}
export function canViewTab(value,level,label) {
  const tab=viewerTabGroups.find(group=>group.level===level)?.tabs.find(tab=>tab.label===label);
  if(!tab) return false;
  const policy=effectiveTabAccess(value);
  return policy.mode==='all' || policy.tabs[tab.key]===true;
}
export function canViewPath(value,path) { return canViewTab(value,levelFromPath(path),studyTabFromPath(path)); }
export function permittedTabs(value) { return viewerTabGroups.flatMap(group=>group.tabs.filter(tab=>canViewTab(value,group.level,tab.label)).map(tab=>({...tab,level:group.level,subject:group.label}))); }
export function tabAccessSummary(value) {
  const policy=effectiveTabAccess(value);
  if(policy.mode==='all') return 'All tabs';
  const tabs=permittedTabs(policy);
  return tabs.length ? tabs.map(tab=>`${tab.subject}: ${tab.label}`).join(' · ') : 'No tabs assigned';
}
