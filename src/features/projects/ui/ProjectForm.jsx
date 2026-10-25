import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PROJECT_COLORS } from '../../../shared/config/constants.js'
import { validateProject } from '../../../shared/lib/taskModel.js'
import Modal from '../../../shared/ui/Modal.jsx'
import { saveProject } from '../model/projectsSlice.js'
export default function ProjectForm({ project, onClose }) {
  const dispatch = useDispatch()
  const { items, saving } = useSelector(state => state.projects)
  const [value, setValue] = useState(project ?? { name: '', color: PROJECT_COLORS[0] })
  const [error, setError] = useState(null)
  const submit = async event => {
    event.preventDefault()
    const message = validateProject(value, items)
    setError(message)
    if (message) return
    try { await dispatch(saveProject(value)).unwrap(); onClose() }
    catch (error) { setError(typeof error === 'string' ? error : 'Не удалось сохранить проект.') }
  }
  return <Modal title={project ? 'Редактировать проект' : 'Новый проект'} onClose={onClose} busy={saving}>
    <form className="stack" onSubmit={submit} noValidate>
      <label>Название проекта<input autoFocus maxLength={60} value={value.name} onChange={event => setValue({ ...value, name: event.target.value })} /></label>
      <fieldset><legend>Цвет проекта</legend><div className="row">{PROJECT_COLORS.map((color, i) => <button key={color} type="button" className="color-choice" style={{ '--color': color }} aria-label={`Цвет ${i + 1}`} aria-pressed={value.color === color} onClick={() => setValue({ ...value, color })}>{value.color === color ? '✓' : ''}</button>)}</div></fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row"><button className="primary" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить проект'}</button><button type="button" disabled={saving} onClick={onClose}>Отмена</button></div>
    </form>
  </Modal>
}
