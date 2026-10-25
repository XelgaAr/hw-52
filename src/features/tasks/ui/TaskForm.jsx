import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PRIORITIES, STATUSES } from '../../../shared/config/constants.js'
import { normalizeTask, validateTask } from '../../../shared/lib/taskModel.js'
import Modal from '../../../shared/ui/Modal.jsx'
import { saveTask } from '../model/tasksSlice.js'
export default function TaskForm({ task, projectId, onClose }) {
  const dispatch = useDispatch()
  const projects = useSelector(state => state.projects.items)
  const saving = useSelector(state => state.tasks.saving || state.projects.saving)
  const [value, setValue] = useState(task ? { ...task, tags: task.tags.join(', ') } : { title: '', description: '', projectId: projectId ?? projects[0]?.id ?? '', status: 'todo', priority: 'normal', dueDate: '', tags: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const field = name => ({ name, value: value[name], onChange: event => setValue({ ...value, [name]: event.target.value }), 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${name}-error` : undefined })
  const message = name => errors[name] && <span id={`${name}-error`} className="field-error">{errors[name]}</span>
  const submit = async event => {
    event.preventDefault()
    const data = normalizeTask(value)
    const nextErrors = validateTask(data, projects)
    setErrors(nextErrors); setError(null)
    if (Object.keys(nextErrors).length) return
    try { await dispatch(saveTask(data)).unwrap(); onClose() }
    catch (error) { setError(typeof error === 'string' ? error : 'Не удалось сохранить задачу.') }
  }
  return <Modal title={task ? 'Редактировать задачу' : 'Новая задача'} onClose={onClose} busy={saving}>
    <form onSubmit={submit} className="stack" noValidate>
      <label>Название задачи<input autoFocus maxLength={100} {...field('title')} />{message('title')}</label>
      <label>Описание<textarea maxLength={3000} {...field('description')} />{message('description')}</label>
      <label>Проект<select {...field('projectId')}>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{message('projectId')}</label>
      <div className="grid"><label>Статус<select {...field('status')}>{Object.entries(STATUSES).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select>{message('status')}</label>
        <label>Приоритет<select {...field('priority')}>{Object.entries(PRIORITIES).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select>{message('priority')}</label></div>
      <div className="grid"><label>Срок<input type="date" {...field('dueDate')} />{message('dueDate')}</label><label>Теги через запятую<input maxLength={150} placeholder="frontend, review" {...field('tags')} />{message('tags')}</label></div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row"><button className="primary" disabled={saving || !projects.length}>{saving ? 'Сохранение…' : 'Сохранить задачу'}</button><button type="button" disabled={saving} onClick={onClose}>Отмена</button></div>
    </form>
  </Modal>
}
