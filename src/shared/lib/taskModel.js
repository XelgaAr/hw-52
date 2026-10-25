import { DEFAULT_FILTERS, PRIORITIES, PROJECT_COLORS, STATUSES } from '../config/constants.js'
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
export const normalizeTask = value => ({
  ...(value.id ? { id: value.id } : {}),
  title: typeof value.title === 'string' ? value.title.trim() : '',
  description: typeof value.description === 'string' ? value.description.trim() : '',
  projectId: value.projectId,
  status: value.status ?? 'todo',
  priority: value.priority ?? 'normal',
  dueDate: value.dueDate ?? '',
  tags: [...new Set((Array.isArray(value.tags) ? value.tags : String(value.tags ?? '').split(',')).map(tag => String(tag).trim()).filter(Boolean))]
})
export const validateTask = (task, projects) => {
  const errors = {}
  if (task.title.length < 3 || task.title.length > 100) errors.title = 'Название: от 3 до 100 символов.'
  if (task.description.length > 3000) errors.description = 'Описание: не более 3000 символов.'
  if (!projects.some(project => project.id === task.projectId)) errors.projectId = 'Выберите существующий проект.'
  if (!Object.hasOwn(STATUSES, task.status)) errors.status = 'Неизвестный статус.'
  if (!Object.hasOwn(PRIORITIES, task.priority)) errors.priority = 'Неизвестный приоритет.'
  if (task.dueDate !== '' && !isDate(task.dueDate)) errors.dueDate = 'Укажите корректную дату.'
  if (task.tags.length > 5 || task.tags.some(tag => tag.length > 24)) errors.tags = 'Не более 5 тегов по 24 символа.'
  return errors
}
export const validateProject = (project, projects = []) => !project.name || project.name.trim().length < 2 || project.name.trim().length > 60
  ? 'Название проекта: от 2 до 60 символов.'
  : !PROJECT_COLORS.includes(project.color) ? 'Выберите цвет из палитры.'
  : projects.some(item => item.id !== project.id && item.name.toLowerCase() === project.name.trim().toLowerCase()) ? 'Проект с таким названием уже существует.' : null
export const validateWorkspace = value => {
  const validStamp = stamp => typeof stamp === 'string' && Number.isFinite(Date.parse(stamp))
  if (!value || value.version !== 1 || !Array.isArray(value.projects) || !Array.isArray(value.tasks))
    throw new Error('Некорректный формат рабочего пространства.')
  const { projects, tasks } = value
  const ids = new Set(projects.map(project => project?.id))
  if (ids.size !== projects.length || !projects.every(project => typeof project?.id === 'string' && project.id.length > 0 && typeof project.name === 'string' && !validateProject(project) && validStamp(project.createdAt)))
    throw new Error('Некорректные данные проектов.')
  const taskIds = new Set(tasks.map(task => task?.id))
  if (taskIds.size !== tasks.length || !tasks.every(task => typeof task?.id === 'string' && task.id.length > 0 && typeof task.title === 'string' && task.title.trim().length >= 3 && task.title.length <= 100 && typeof task.description === 'string' && task.description.length <= 3000 && ids.has(task.projectId) && Object.hasOwn(STATUSES, task.status) && Object.hasOwn(PRIORITIES, task.priority) && (task.dueDate === '' || isDate(task.dueDate)) && Array.isArray(task.tags) && task.tags.length <= 5 && task.tags.every(tag => typeof tag === 'string' && tag.length > 0 && tag.length <= 24) && validStamp(task.createdAt) && validStamp(task.updatedAt)))
    throw new Error('Некорректные данные задач.')
  return value
}
export const isOverdue = (task, today = dateKey()) => task.status !== 'done' && !!task.dueDate && task.dueDate < today
export const filterTasks = (tasks, filters = DEFAULT_FILTERS, projectId) => {
  const term = filters.query.trim().toLowerCase()
  const order = { high: 0, normal: 1, low: 2 }
  const result = tasks.filter(task => (!projectId || task.projectId === projectId) && (filters.priority === 'all' || task.priority === filters.priority) && (filters.status === 'all' || task.status === filters.status) && `${task.title} ${task.description} ${task.tags.join(' ')}`.toLowerCase().includes(term))
  const compare = filters.sort === 'due' ? (a, b) => (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') : filters.sort === 'priority' ? (a, b) => order[a.priority] - order[b.priority] : (a, b) => b.updatedAt.localeCompare(a.updatedAt)
  return result.sort((a, b) => compare(a, b) || a.id.localeCompare(b.id))
}
export const groupTasks = tasks => {
  const groups = { todo: [], doing: [], done: [] }
  for (const task of tasks) groups[task.status].push(task)
  return groups
}
export const summarize = (tasks, projects, today = dateKey()) => {
  const counts = Object.fromEntries(projects.map(project => [project.id, { ...project, total: 0, done: 0 }]))
  const result = { total: tasks.length, todo: 0, doing: 0, done: 0, overdue: 0, projects: [] }
  for (const task of tasks) {
    result[task.status]++
    result.overdue += Number(isOverdue(task, today))
    if (counts[task.projectId]) { counts[task.projectId].total++; counts[task.projectId].done += Number(task.status === 'done') }
  }
  result.projects = Object.values(counts)
  return result
}
