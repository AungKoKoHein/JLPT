export const p = text => ({type:'p',text,lang:'my'});
export const h = text => ({type:'h3',text,lang:'my'});
export const b = text => ({type:'bullet',text,lang:'my'});
export const table = (headers,rows) => ({type:'table',headers,rows});
export const notes = (...items) => [{type:'h3',text:'日本語ノート',lang:'ja'},...items.map(text => ({type:'bullet',text,lang:'ja'}))];
export const section = (text,...blocks) => [{type:'h2',text,lang:'my'},...blocks];
export const foundations = (...items) => section('အရင်သိထားရမည့် Technical Terms',...items.map(b));
export const summary = (...items) => [{type:'h2',text:'日本語総まとめ',lang:'ja'},...items.map(text => ({type:'bullet',text,lang:'ja'}))];
