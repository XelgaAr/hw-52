import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from './store.js'
import { loadWorkspace } from '../features/workspace/model/loadWorkspace.js'
import { saveTask, removeTask, selectVisibleTasks } from '../features/tasks/model/tasksSlice.js'
import { saveProject, removeProject } from '../features/projects/model/projectsSlice.js'
import { setFilter, resetFilters } from '../features/filters/model/filtersSlice.js'
import { workspaceApi } from '../services/api/workspaceApi.js'
import seed from '../../public/data/workspace.json'
vi.mock('../services/api/workspaceApi.js', () => ({ workspaceApi: { load: vi.fn(), saveTask: vi.fn(), removeTask: vi.fn(), saveProject: vi.fn(), removeProject: vi.fn() } }))
let store
beforeEach(() => { vi.resetAllMocks(); store = createAppStore(); workspaceApi.load.mockResolvedValue(structuredClone(seed)) })
describe('workspace store', () => {
  it('loads projects and tasks through an async thunk', async () => { const pending = store.dispatch(loadWorkspace()); expect(store.getState().tasks.status).toBe('loading'); await pending; expect(store.getState().tasks.status).toBe('succeeded'); expect(store.getState().projects.items).toEqual(seed.projects) })
  it('deduplicates simultaneous loads', async () => { await Promise.all([store.dispatch(loadWorkspace()), store.dispatch(loadWorkspace())]); expect(workspaceApi.load).toHaveBeenCalledTimes(1) })
  it('handles failure and retry', async () => { workspaceApi.load.mockRejectedValueOnce(new Error('Offline')); await store.dispatch(loadWorkspace()); expect(store.getState().tasks.error).toBe('Offline'); await store.dispatch(loadWorkspace()); expect(store.getState().tasks.status).toBe('succeeded') })
  it('validates tasks before calling the API', async () => { await store.dispatch(loadWorkspace()); const action = await store.dispatch(saveTask({ title: '', projectId: seed.projects[0].id })); expect(action.meta.requestStatus).toBe('rejected'); expect(workspaceApi.saveTask).not.toHaveBeenCalled() })
  it('updates a task using fulfilled results', async () => { await store.dispatch(loadWorkspace()); const task = { ...seed.tasks[0], status: 'done' }; workspaceApi.saveTask.mockResolvedValue(task); await store.dispatch(saveTask(task)).unwrap(); expect(store.getState().tasks.items.find(item => item.id === task.id).status).toBe('done') })
  it('keeps the task unchanged on API failure', async () => { await store.dispatch(loadWorkspace()); workspaceApi.saveTask.mockRejectedValue(new Error('Unavailable')); await store.dispatch(saveTask({ ...seed.tasks[0], status: 'done' })); expect(store.getState().tasks.items[0]).toEqual(seed.tasks[0]); expect(store.getState().tasks.saveError).toBe('Unavailable') })
  it('removes task only after API confirmation', async () => { await store.dispatch(loadWorkspace()); workspaceApi.removeTask.mockResolvedValue(seed.tasks[0].id); await store.dispatch(removeTask(seed.tasks[0].id)); expect(store.getState().tasks.items).toHaveLength(seed.tasks.length - 1) })
  it('project removal cascades through both slices', async () => { await store.dispatch(loadWorkspace()); const id = seed.projects[0].id; workspaceApi.removeProject.mockResolvedValue(id); await store.dispatch(removeProject(id)); expect(store.getState().projects.items.some(item => item.id === id)).toBe(false); expect(store.getState().tasks.items.some(item => item.projectId === id)).toBe(false) })
  it('validates duplicate project names', async () => { await store.dispatch(loadWorkspace()); await store.dispatch(saveProject({ name: seed.projects[0].name, color: seed.projects[0].color })); expect(workspaceApi.saveProject).not.toHaveBeenCalled(); expect(store.getState().projects.error).toContain('существует') })
  it('selectors apply and reset filters', async () => { await store.dispatch(loadWorkspace()); store.dispatch(setFilter({ key: 'query', value: 'never-existing-name' })); expect(selectVisibleTasks(store.getState())).toHaveLength(0); store.dispatch(resetFilters()); expect(selectVisibleTasks(store.getState())).toHaveLength(seed.tasks.length) })
  it('selector memoization preserves identity until dependencies change', async () => { await store.dispatch(loadWorkspace()); expect(selectVisibleTasks(store.getState())).toBe(selectVisibleTasks(store.getState())) })
})
