import { lazy, Suspense, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, Route, Routes } from 'react-router-dom'
import { loadWorkspace } from './features/workspace/model/loadWorkspace.js'
import Layout from './widgets/Layout.jsx'
const BoardPage = lazy(() => import('./pages/BoardPage.jsx'))
const TaskPage = lazy(() => import('./pages/TaskPage.jsx'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'))
export default function App() {
  const dispatch = useDispatch()
  useEffect(() => { dispatch(loadWorkspace()) }, [dispatch])
  return <Suspense fallback={<div className="empty" role="status">Загрузка интерфейса…</div>}><Routes><Route element={<Layout />}><Route index element={<BoardPage />} /><Route path="projects/:projectId" element={<BoardPage />} /><Route path="tasks/:taskId" element={<TaskPage />} /><Route path="analytics" element={<AnalyticsPage />} /><Route path="*" element={<section className="panel empty"><h1>Страница не найдена</h1><Link to="/">Вернуться к задачам</Link></section>} /></Route></Routes></Suspense>
}
