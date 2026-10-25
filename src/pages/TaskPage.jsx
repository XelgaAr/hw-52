import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { removeTask } from '../features/tasks/model/tasksSlice.js'
import TaskForm from '../features/tasks/ui/TaskForm.jsx'
import { PRIORITIES, STATUSES } from '../shared/config/constants.js'
import Modal from '../shared/ui/Modal.jsx'
export default function TaskPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const task = useSelector(state => state.tasks.items.find(item => item.id === taskId))
  const project = useSelector(state => state.projects.items.find(item => item.id === task?.projectId))
  const busy = useSelector(state => state.tasks.saving || state.projects.saving)
  const [modal, setModal] = useState(null)
  const [error, setError] = useState(null)
  const remove = async () => {
    try { await dispatch(removeTask(task.id)).unwrap(); navigate(`/projects/${encodeURIComponent(task.projectId)}`) }
    catch (error) { setError(typeof error === 'string' ? error : 'Не удалось удалить задачу.') }
  }
  if (!task) return <section className="panel empty"><h1>Задача не найдена</h1><Link to="/">Вернуться к задачам</Link></section>
  return <><Link to={`/projects/${encodeURIComponent(task.projectId)}`}>← {project?.name}</Link><article className="panel task-detail"><p className="eyebrow">Детали задачи</p><h1>{task.title}</h1><div className="row"><span className="badge">{STATUSES[task.status]}</span><span className={`priority priority-${task.priority}`}>{PRIORITIES[task.priority]} приоритет</span><span className="tag">{task.dueDate || 'Без срока'}</span></div><p className="detail-description">{task.description || 'Описание не добавлено.'}</p><div className="row">{task.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div><hr className="divider" /><div className="row between"><small>Обновлено: {new Date(task.updatedAt).toLocaleString('ru-RU')}</small><div className="row"><button className="primary" disabled={busy} onClick={() => setModal('edit')}>Редактировать задачу</button><button className="danger" disabled={busy} onClick={() => setModal('delete')}>Удалить задачу</button></div></div></article>
    {modal === 'edit' && <TaskForm task={task} onClose={() => setModal(null)} />}
    {modal === 'delete' && <Modal title="Удалить задачу?" onClose={() => setModal(null)} busy={busy}><p>«{task.title}» будет удалена без возможности восстановления.</p>{error && <p className="error" role="alert">{error}</p>}<div className="row"><button className="danger" disabled={busy} onClick={remove}>Подтвердить удаление</button><button disabled={busy} onClick={() => setModal(null)}>Отмена</button></div></Modal>}
  </>
}
