import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { STATUSES, PRIORITIES } from '../../../shared/config/constants.js'
import { isOverdue } from '../../../shared/lib/taskModel.js'
import { saveTask } from '../model/tasksSlice.js'
export default function TaskCard({ task, projectName }) {
  const dispatch = useDispatch()
  const saving = useSelector(state => state.tasks.saving || state.projects.saving)
  return <article className="task-card" data-testid="task-card">
    <div className="row between"><span className={`priority priority-${task.priority}`}>{PRIORITIES[task.priority]}</span><small>{projectName}</small></div>
    <h3><Link to={`/tasks/${encodeURIComponent(task.id)}`}>{task.title}</Link></h3>
    {task.description && <p className="task-description">{task.description}</p>}
    <div className="row">{task.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
    <div className="task-meta"><span className={isOverdue(task) ? 'field-error' : 'muted'}>{task.dueDate ? `${isOverdue(task) ? 'Просрочено · ' : ''}${task.dueDate}` : 'Без срока'}</span>
      <select aria-label={`Статус: ${task.title}`} value={task.status} disabled={saving} onChange={event => dispatch(saveTask({ ...task, status: event.target.value }))}>{Object.entries(STATUSES).map(([id, text]) => <option value={id} key={id}>{text}</option>)}</select>
    </div>
  </article>
}
