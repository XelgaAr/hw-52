import { WORKSPACE_KEY } from '../../shared/config/constants.js'
import { validateWorkspace } from '../../shared/lib/taskModel.js'
export const createWorkspaceApi = ({ baseUrl = '', storage = globalThis.localStorage, fetcher = globalThis.fetch, demoUrl = './data/workspace.json' } = {}) => {
  let seed = null
  let queue = Promise.resolve()
  const request = async (url, options = {}, signal) => {
    const controller = new AbortController()
    const abort = () => controller.abort(signal?.reason)
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) abort()
    const timeout = setTimeout(() => controller.abort(new Error('Сервер не ответил за 10 секунд.')), 10000)
    try {
      const response = await fetcher(url, { ...options, signal: controller.signal, headers: options.body ? { 'Content-Type': 'application/json' } : {} })
      if (!response.ok) throw new Error(`Ошибка API: HTTP ${response.status}.`)
      return response.status === 204 ? null : await response.json()
    } catch (error) {
      throw controller.signal.aborted ? controller.signal.reason ?? error : error
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort) }
  }
  const read = async signal => {
    const raw = storage.getItem(WORKSPACE_KEY)
    if (raw !== null) {
      try { return validateWorkspace(JSON.parse(raw)) }
      catch { throw new Error('Локальные данные повреждены. Экспортируйте исходные данные браузера или сбросьте демо через меню.') }
    }
    seed ??= request(demoUrl, {}, signal).then(validateWorkspace).then(data => { storage.setItem(WORKSPACE_KEY, JSON.stringify(data)); return data }).catch(error => { seed = null; throw error })
    return structuredClone(await seed)
  }
  const update = (transform, signal) => {
    const job = queue.then(async () => {
      const data = await read(signal)
      if (signal?.aborted) throw signal.reason ?? new Error('Операция отменена.')
      const result = transform(data)
      validateWorkspace(data)
      storage.setItem(WORKSPACE_KEY, JSON.stringify(data))
      return structuredClone(result)
    })
    queue = job.catch(() => {})
    return job
  }
  return {
    mode: baseUrl ? 'remote' : 'demo',
    load: async signal => validateWorkspace(baseUrl ? await request(`${baseUrl}/workspace`, {}, signal) : await read(signal)),
    saveProject: (value, signal) => baseUrl
      ? request(`${baseUrl}/projects${value.id ? `/${encodeURIComponent(value.id)}` : ''}`, { method: value.id ? 'PATCH' : 'POST', body: JSON.stringify(value) }, signal)
      : update(data => {
        const index = data.projects.findIndex(project => project.id === value.id)
        if (value.id && index < 0) throw new Error('Проект не найден.')
        const project = { ...value, id: value.id ?? crypto.randomUUID(), createdAt: data.projects[index]?.createdAt ?? new Date().toISOString() }
        if (index < 0) data.projects.push(project)
        else data.projects[index] = project
        return project
      }, signal),
    removeProject: async (id, signal) => {
      if (baseUrl) { await request(`${baseUrl}/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }, signal); return id }
      return update(data => { data.projects = data.projects.filter(project => project.id !== id); data.tasks = data.tasks.filter(task => task.projectId !== id); return id }, signal)
    },
    saveTask: (value, signal) => baseUrl
      ? request(`${baseUrl}/tasks${value.id ? `/${encodeURIComponent(value.id)}` : ''}`, { method: value.id ? 'PATCH' : 'POST', body: JSON.stringify(value) }, signal)
      : update(data => {
        const index = data.tasks.findIndex(task => task.id === value.id)
        if (value.id && index < 0) throw new Error('Задача не найдена.')
        const task = { ...value, id: value.id ?? crypto.randomUUID(), createdAt: data.tasks[index]?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }
        if (index < 0) data.tasks.push(task)
        else data.tasks[index] = task
        return task
      }, signal),
    removeTask: async (id, signal) => {
      if (baseUrl) { await request(`${baseUrl}/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }, signal); return id }
      return update(data => { data.tasks = data.tasks.filter(task => task.id !== id); return id }, signal)
    },
    reset: async () => {
      if (baseUrl) throw new Error('Сброс доступен только в деморежиме.')
      await queue
      storage.removeItem(WORKSPACE_KEY)
      seed = null
    }
  }
}
export const workspaceApi = createWorkspaceApi({
  baseUrl: import.meta.env?.VITE_API_URL?.replace(/\/+$/, '') ?? '',
  demoUrl: `${import.meta.env?.BASE_URL ?? './'}data/workspace.json`
})
