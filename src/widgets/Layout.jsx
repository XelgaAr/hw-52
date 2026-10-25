import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, Outlet } from 'react-router-dom'
import ProjectForm from '../features/projects/ui/ProjectForm.jsx'
import { selectProjectCounts } from '../features/tasks/model/tasksSlice.js'
import { loadWorkspace } from '../features/workspace/model/loadWorkspace.js'
import { workspaceApi } from '../services/api/workspaceApi.js'
import Modal from '../shared/ui/Modal.jsx'
export default function Layout() {
  const dispatch = useDispatch()
  const projects = useSelector(state => state.projects.items)
  const tasks = useSelector(state => state.tasks.items)
  const { status, error } = useSelector(state => state.tasks)
  const busy = useSelector(state => state.tasks.saving || state.projects.saving || state.tasks.status === 'loading')
  const counts = useSelector(selectProjectCounts)
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState(null)
  const reset = async () => {
    try { await workspaceApi.reset(); await dispatch(loadWorkspace()).unwrap(); setResetting(false); setMessage(null) }
    catch (error) { setMessage(typeof error === 'string' ? error : error.message) }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, projects, tasks }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'planova-workspace.json'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <><a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main').focus() }}>Перейти к содержимому</a>
    <header className="app-header"><div className="header-inner"><NavLink to="/" className="brand"><span className="brand-mark">P</span>Planova</NavLink><span className="badge">{workspaceApi.mode === 'demo' ? 'Локальное рабочее пространство' : 'Подключённый API'}</span></div></header>
    <div className="workspace"><aside className="sidebar"><nav aria-label="Рабочее пространство"><p className="eyebrow">Рабочее пространство</p><NavLink to="/" end>Обзор задач <span>{tasks.length}</span></NavLink><NavLink to="/analytics">Аналитика</NavLink><div className="row between projects-heading"><p className="eyebrow">Проекты</p><button aria-label="Добавить проект" disabled={busy || status !== 'succeeded'} onClick={() => setCreating(true)}>+</button></div>
      {projects.map(project => <NavLink key={project.id} to={`/projects/${encodeURIComponent(project.id)}`}><span className="project-label"><i style={{ background: project.color }} />{project.name}</span><span>{counts[project.id] ?? 0}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><p>Планы превращаются в действия.<br />Одна задача за другой.</p><button disabled={status !== 'succeeded'} onClick={download}>Экспорт JSON</button>{workspaceApi.mode === 'demo' && <button className="quiet" disabled={busy} onClick={() => setResetting(true)}>Сбросить демо</button>}</div>
    </aside><main id="main" tabIndex={-1} className="workspace-main">
      {(status === 'idle' || status === 'loading') && <div role="status" className="panel empty">Загрузка рабочего пространства…</div>}
      {status === 'failed' && <div className="panel"><h1>Не удалось загрузить данные</h1><p role="alert" className="error">{error}</p><button className="primary" onClick={() => dispatch(loadWorkspace())}>Повторить загрузку</button></div>}
      {status === 'succeeded' && <Outlet />}
    </main></div><footer>Planova · React + Redux Toolkit · {workspaceApi.mode === 'demo' ? 'Изменения сохраняются только в этом браузере. Экспортируйте важные данные.' : 'Данные обслуживает настроенный API.'}</footer>
    {creating && <ProjectForm onClose={() => setCreating(false)} />}
    {resetting && <Modal title="Сбросить демо?" onClose={() => setResetting(false)} busy={busy}><p>Все локальные изменения будут заменены исходными примерами. Сначала сохраните экспорт JSON.</p>{message && <p role="alert" className="error">{message}</p>}<div className="row"><button className="danger" disabled={busy} onClick={reset}>Подтвердить сброс</button><button disabled={busy} onClick={() => setResetting(false)}>Отмена</button></div></Modal>}
  </>
}
