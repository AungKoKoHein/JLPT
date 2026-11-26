import React from 'react';

const isJapaneseNotes = block => ['h2','h3','h4'].includes(block?.type) && /日本語(?:ノート|総まとめ)/.test(block.text || '');

function renderBlocks(blocks, prefix = 'block') {
  const result = [];
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    const key = `${prefix}-${index}`;
    if (block.type === 'bullet') {
      const items = [block];
      while (blocks[index + 1]?.type === 'bullet') items.push(blocks[++index]);
      result.push(<ul key={key}>{items.map((item, itemIndex) => <li key={itemIndex} lang={item.lang}>{item.text}</li>)}</ul>);
    } else if (block.type === 'table') {
      result.push(<div className="aws-chapter-table" key={key} role="region" aria-label={block.headers.join(' / ')} tabIndex={0}><table><thead><tr>{block.headers.map((text, i) => <th scope="col" key={i}>{text}</th>)}</tr></thead><tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((text, j) => <td key={j}>{text}</td>)}</tr>)}</tbody></table></div>);
    } else if (['h2','h3','h4'].includes(block.type)) {
      const Heading = {h2:'h3',h3:'h4',h4:'h5'}[block.type];
      result.push(<Heading className={`aws-chapter-${block.type}`} key={key} lang={block.lang}>{block.text}</Heading>);
    } else result.push(<p key={key} lang={block.lang}>{block.text}</p>);
  }
  return result;
}

export default function AwsChapterBody({ blocks }) {
  const groups = [];
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    // Keep each section's Japanese revision notes together, after its explanation.
    if (isJapaneseNotes(block)) {
      const notes = [block];
      while (blocks[index + 1]?.lang === 'ja' && !['h2','h3','h4'].includes(blocks[index + 1]?.type)) notes.push(blocks[++index]);
      groups.push(<section className="aws-chapter-japanese" lang="ja" key={index}>{renderBlocks(notes, `notes-${index}`)}</section>);
    } else {
      const body = [block];
      while (blocks[index + 1] && !isJapaneseNotes(blocks[index + 1])) body.push(blocks[++index]);
      groups.push(<React.Fragment key={index}>{renderBlocks(body, `body-${index}`)}</React.Fragment>);
    }
  }
  return <div className="aws-chapter-body" lang="my">{groups}</div>;
}
