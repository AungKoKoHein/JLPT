import React, { useId } from 'react';
import { effectiveTabAccess, viewerTabGroups } from './viewerTabAccess.js';

export default function ViewerTabPermissions({value,onChange,disabled=false}) {
  const prefix=useId();
  const policy=effectiveTabAccess(value);
  const selected=policy.tabs||{};
  function changeTab(key,checked) { onChange({mode:'selected',tabs:{...selected,[key]:checked}}); }
  return <fieldset className="viewer-tab-permissions" disabled={disabled}>
    <legend>Allowed study tabs</legend>
    <div className="viewer-access-mode"><label><input type="radio" name={`${prefix}-mode`} checked={policy.mode==='all'} onChange={()=>onChange({mode:'all'})} /> All tabs</label><label><input type="radio" name={`${prefix}-mode`} checked={policy.mode==='selected'} onChange={()=>onChange({mode:'selected',tabs:{}})} /> Selected tabs only</label></div>
    {policy.mode==='selected' && <div className="viewer-tab-groups">{viewerTabGroups.map(group=> {
      const all=group.tabs.every(tab=>selected[tab.key]);
      return <div key={group.level} className="viewer-tab-group"><div><strong>{group.label}</strong><button type="button" onClick={()=>onChange({mode:'selected',tabs:{...selected,...Object.fromEntries(group.tabs.map(tab=>[tab.key,!all]))}})}>{all?'Clear subject':'Select subject'}</button></div><div className="viewer-tab-options">{group.tabs.map(tab=><label key={tab.key}><input type="checkbox" checked={Boolean(selected[tab.key])} onChange={event=>changeTab(tab.key,event.target.checked)} />{tab.label}</label>)}</div></div>;
    })}</div>}
    <p>{policy.mode==='all'?'Can open every study tab.':'Only checked tabs will be available. With none selected, the viewer cannot open any study tab.'}</p>
  </fieldset>;
}
