import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import "./startStudyDialog.css";

export default function StartStudyDialog({ title, count, minutes, onStart, onClose }) {
  const dialog = useRef(null);
  const headingId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const element = dialog.current;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(<dialog ref={dialog} className="start-study-dialog" lang="my" aria-labelledby={headingId}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <p className="start-study-eyebrow">စတင်ရန် အဆင်သင့်ဖြစ်ပြီလား။</p>
    <h2 id={headingId}>{title}</h2>
    <p className="start-study-description">ရွေးချယ်ထားသော လေ့ကျင့်ခန်းကို ယခု စတင်နိုင်ပါသည်။</p>
    <div className="start-study-details"><span>မေးခွန်း <strong>{count} ခု</strong></span><span>{minutes ? <><strong>{minutes} မိနစ်</strong> အချိန်ကန့်သတ်</> : "အချိန်မကန့်သတ်"}</span></div>
    <div className="start-study-actions"><button type="button" onClick={onClose}>ပြန်ရွေးမည်</button><button type="button" className="start-study-confirm" autoFocus onClick={onStart}>စတင်မည်</button></div>
  </dialog>, document.body);
}
