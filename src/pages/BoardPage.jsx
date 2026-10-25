import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetFilters, setFilter } from '../features/filters/model/filtersSlice.js'
import { removeProject } from '../features/projects/model/projectsSlice.js'
import ProjectForm from '../features/projects/ui/ProjectForm.jsx'
import { selectVisibleTasks } from '../features/tasks/model/tasksSlice.js'
import TaskCard from '../features/tasks/ui/TaskCard.jsx'
import TaskForm from '../features/tasks/ui/TaskForm.jsx'
import { PRIORITIES, STATUSES } from '../shared/config/constants.js'
import { groupTasks } from '../shared/lib/taskModel.js'
import Modal from '../shared/ui/Modal.jsx'
export default function BoardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const projects = useSelector(state => state.projects.items)
  const project = projects.find(item => item.id === projectId)
  const tasks = useSelector(state => selectVisibleTasks(state, projectId))
  const filters = useSelector(state => state.filters)
  const busy = useSelector(state => state.tasks.saving || state.projects.saving)
  const saveError = useSelector(state => state.tasks.saveError)
  const [modal, setModal] = useState(null)
  const [error, setError] = useState(null)
  const groups = groupTasks(tasks)
  const names = Object.fromEntries(projects.map(item => [item.id, item.name]))
  const change = event => dispatch(setFilter({ key: event.target.name, value: event.target.value }))
  const remove = async () => {
    try { await dispatch(removeProject(projectId)).unwrap(); setModal(null); navigate('/') }
    catch (error) { setError(typeof error === 'string' ? error : 'Не удалось удалить проект.') }
  }
  if (projectId && !project) return <section className="panel empty"><h1>Проект не найден</h1><Link to="/">Открыть обзор</Link></section>
  return <><section className="page-heading row between"><div><p className="eyebrow">Доска задач</p><h1>{project?.name ?? 'Всё под контролем'}</h1><p className="muted">{project ? 'От первого шага до готового результата.' : 'Общий план, понятные приоритеты, видимый прогресс.'}</p></div><div className="row">{project && <><button disabled={busy} onClick={() => setModal('project')}>Настроить проект</button><button className="danger" disabled={busy} onClick={() => { setError(null); setModal('delete') }}>Удалить проект</button></>}<button className="primary" disabled={!projects.length || busy} onClick={() => setModal('task')}>+ Новая задача</button></div></section>
    <div className="toolbar board-filters"><label>Поиск<input type="search" name="query" placeholder="Название, описание, тег…" value={filters.query} onChange={change} /></label><label>Приоритет<select name="priority" value={filters.priority} onChange={change}><option value="all">Все приоритеты</option>{Object.entries(PRIORITIES).map(([id, text]) => <option value={id} key={id}>{text}</option>)}</select></label><label>Статус<select name="status" value={filters.status} onChange={change}><option value="all">Все статусы</option>{Object.entries(STATUSES).map(([id, text]) => <option value={id} key={id}>{text}</option>)}</select></label><label>Сортировка<select name="sort" value={filters.sort} onChange={change}><option value="updated">По обновлению</option><option value="due">По сроку</option><option value="priority">По приоритету</option></select></label><button onClick={() => dispatch(resetFilters())}>Сбросить фильтры</button></div>
    <div className="row between"><p className="muted" role="status">Найдено задач: {tasks.length}</p><small>Статус меняется прямо на карточке</small></div>
    {saveError && <p role="alert" className="error">{saveError}</p>}
    {!projects.length && <p className="notice">Начните с создания проекта: кнопка «+» в боковой панели.</p>}
    <div className="kanban">{Object.entries(STATUSES).map(([status, label]) => <section key={status} className={`kanban-column column-${status}`} aria-label={label}><div className="row between column-heading"><h2>{label}</h2><span className="tag">{groups[status].length}</span></div><div className="stack">{groups[status].map(task => <TaskCard task={task} projectName={names[task.projectId]} key={task.id} />)}{!groups[status].length && <div className="column-empty">Здесь пока нет задач</div>}</div></section>)}</div>
    {modal === 'task' && <TaskForm projectId={projectId} onClose={() => setModal(null)} />}
    {modal === 'project' && <ProjectForm project={project} onClose={() => setModal(null)} />}
    {modal === 'delete' && <Modal title="Удалить проект?" onClose={() => setModal(null)} busy={busy}><p>Проект «{project.name}» и все его задачи будут удалены. Это действие нельзя отменить.</p>{error && <p role="alert" className="error">{error}</p>}<div className="row"><button className="danger" disabled={busy} onClick={remove}>Удалить с задачами</button><button disabled={busy} onClick={() => setModal(null)}>Отмена</button></div></Modal>}
  </>
}
