import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { summarize } from '../shared/lib/taskModel.js'
export default function AnalyticsPage() {
  const tasks = useSelector(state => state.tasks.items)
  const projects = useSelector(state => state.projects.items)
  const stats = useMemo(() => summarize(tasks, projects), [tasks, projects])
  return <><div className="intro"><p className="eyebrow">Аналитика</p><h1>Прогресс в цифрах</h1><p>Актуальное состояние всех проектов, без влияния фильтров доски.</p></div><div className="stats-grid">{[['Всего задач', stats.total], ['В работе', stats.doing], ['Завершено', stats.done], ['Просрочено', stats.overdue]].map(([label, number]) => <section className="panel" key={label}><p className="muted">{label}</p><div className="stat">{number}</div></section>)}</div><section className="panel"><h2>По проектам</h2><div className="stack">{stats.projects.map(project => <article key={project.id} className="project-progress"><div className="row between"><Link to={`/projects/${encodeURIComponent(project.id)}`}>{project.name}</Link><span>{project.done} / {project.total} · {project.total ? Math.round(project.done / project.total * 100) : 0}%</span></div><progress aria-label={`Прогресс: ${project.name}`} max={project.total || 1} value={project.done} style={{ accentColor: project.color }} /></article>)}{!projects.length && <p className="empty">Создайте первый проект, чтобы увидеть статистику.</p>}</div></section></>
}
