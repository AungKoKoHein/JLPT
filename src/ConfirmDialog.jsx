import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const sessionOwnsScroll = Boolean(dialog.current.closest('.study-session-view'));
    dialog.current.showModal();
    if (!sessionOwnsScroll) document.body.style.overflow = 'hidden';
    return () => { if (!sessionOwnsScroll) document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="exam-confirm-dialog" aria-labelledby="exam-confirm-title" aria-describedby="exam-confirm-message" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="exam-confirm-body"><h2 id="exam-confirm-title">{title}</h2><p id="exam-confirm-message">{message}</p></div>
    <div className="exam-confirm-actions"><button type="button" className="secondary-button" autoFocus onClick={onClose}>Keep working</button><button type="button" className="primary-button" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>;
}
