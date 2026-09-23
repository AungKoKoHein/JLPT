import TextField from "./TextField.jsx";
import React, { useEffect, useRef, useState } from "react";

export default function DeleteDialog({ type, options, selectedId, onSelect, onClose, onDelete, saving, canDelete, error }) {
  const dialog = useRef(null);
  const [query, setQuery] = useState("");
  const [deleteContents, setDeleteContents] = useState(false);
  const isContainer = ["group", "chapter", "subchapter"].includes(type);
  useEffect(() => { setDeleteContents(false); }, [selectedId, type]);
  const [chapterFilter, setChapterFilter] = useState("");
  const [subchapterFilter, setSubchapterFilter] = useState("");
  const title = ({ group: "group title", chapter: "chapter", subchapter: "subchapter", card: "flashcard", kanji: "kanji card", exercise: "exercise" })[type];
  const selected = options.find((option) => option.id === selectedId);
  const hasLocationFilters = type === "card" || type === "kanji" || type === "exercise";
  const chapters = [...new Map(options.filter((option) => option.chapterId).map((option) => [option.chapterId, { id: option.chapterId, label: option.chapterLabel }])).values()];
  const subchapters = [...new Map(options.filter((option) => option.subchapterId && (!chapterFilter || option.chapterId === chapterFilter)).map((option) => [option.subchapterId, { id: option.subchapterId, label: option.subchapterLabel }])).values()];
  const filtered = options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())
    && (!chapterFilter || option.chapterId === chapterFilter)
    && (!subchapterFilter || option.subchapterId === subchapterFilter));
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog className="delete-dialog" ref={dialog} aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}>
    <form onSubmit={(event) => { event.preventDefault(); if (selected && !saving && canDelete) onDelete(isContainer && deleteContents); }}>
      <header className="delete-heading"><div><p className="eyebrow">Manage study content</p><h2 id="delete-title">Delete {title}</h2></div><button type="button" className="delete-close" aria-label="Close delete dialog" onClick={onClose} disabled={saving}>?</button></header>
      <div className="delete-body">
        <p id="delete-description">Choose the {title} you want to remove.</p>
        <label className="delete-search">Find an item<TextField fullWidth variant="outlined" size="small" autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title}s`} /></label>
        {hasLocationFilters && <div className="delete-filters">
          <label>Chapter<select value={chapterFilter} onChange={(event) => { setChapterFilter(event.target.value); setSubchapterFilter(""); }}>
            <option value="">All chapters</option>
            {chapters.map((chapter) => <option value={chapter.id} key={chapter.id}>{chapter.label}</option>)}
          </select></label>
          <label>Subchapter<select value={subchapterFilter} onChange={(event) => setSubchapterFilter(event.target.value)}>
            <option value="">All subchapters</option>
            {subchapters.map((subchapter) => <option value={subchapter.id} key={subchapter.id}>{subchapter.label}</option>)}
          </select></label>
        </div>}
        <div className="delete-options" role="radiogroup" aria-label={`Select ${title}`}>
          {filtered.map((option) => <label className={`delete-option ${selectedId === option.id ? "is-selected" : ""}`} key={option.id}><input type="radio" name="delete-item" value={option.id} checked={selectedId === option.id} onChange={() => onSelect(option.id)} disabled={saving} /><span>{option.label}</span></label>)}
          {!filtered.length && <p className="delete-empty">{options.length ? "No matching items." : "No items available to delete."}</p>}
        </div>
        {selected && <p className="delete-selection"><strong>Selected:</strong> {selected.label}</p>}
        {isContainer && <label className="delete-contents"><input type="checkbox" checked={deleteContents} onChange={(event) => setDeleteContents(event.target.checked)} disabled={saving || !selected} /><span>Delete the whole folder, including everything inside</span></label>}
        <p className="delete-notice">{deleteContents && isContainer ? (type === "group" ? "This group, all its chapters, subchapters, cards, and exercises will be deleted." : type === "chapter" ? "This chapter, all its subchapters, cards, and exercises will be deleted." : "This subchapter, its cards, and its assigned exercises will be deleted. Assigned exercises will also disappear from the parent chapter.") + " This cannot be undone in the app." : type === "group" ? "Only the group title is removed. Chapters and their contents move to Not grouped." : type === "chapter" ? "Only the chapter is removed. Subchapters, cards, and exercises move to Not grouped." : type === "subchapter" ? "Only the subchapter is removed. Cards and exercises stay in the parent chapter." : "This item will be removed from your study content."}</p>
        {error && <p role="alert" className="cloud-error">{error}</p>}
      </div>
      <footer className="delete-footer"><button type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="delete-confirm" type="submit" disabled={!selected || !canDelete || saving}>{saving ? "Deleting?" : `Delete ${title}`}</button></footer>
    </form>
  </dialog>;
}
