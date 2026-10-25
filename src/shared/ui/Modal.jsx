import { useEffect, useId, useRef } from 'react'
export default function Modal({ title, onClose, busy = false, children }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="row between"><h2 id={titleId}>{title}</h2><button aria-label="Закрыть окно" disabled={busy} onClick={onClose}>×</button></div>
    {children}
  </dialog>
}
