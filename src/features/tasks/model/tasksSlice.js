import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import { workspaceApi } from '../../../services/api/workspaceApi.js'
import { filterTasks, normalizeTask, validateTask, validateWorkspace } from '../../../shared/lib/taskModel.js'
import { loadWorkspace } from '../../workspace/model/loadWorkspace.js'
import { removeProject } from '../../projects/model/projectsSlice.js'
export const saveTask = createAsyncThunk('tasks/save', async (value, { signal, getState, rejectWithValue }) => {
  const task = normalizeTask(value)
  const projects = getState().projects.items
  const errors = validateTask(task, projects)
  if (Object.keys(errors).length) return rejectWithValue(Object.values(errors)[0])
  try {
    const result = await workspaceApi.saveTask(task, signal)
    validateWorkspace({ version: 1, projects, tasks: [result] })
    return result
  } catch (error) { return rejectWithValue(error.message) }
}, { condition: (_, { getState }) => !getState().tasks.saving && !getState().projects.saving })
export const removeTask = createAsyncThunk('tasks/remove', async (id, { signal, rejectWithValue }) => {
  try { return await workspaceApi.removeTask(id, signal) }
  catch (error) { return rejectWithValue(error.message) }
}, { condition: (_, { getState }) => !getState().tasks.saving && !getState().projects.saving })
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], status: 'idle', error: null, saving: false, saveError: null, requestId: null },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(loadWorkspace.pending, (state, action) => { state.status = 'loading'; state.error = null; state.requestId = action.meta.requestId })
    builder.addCase(loadWorkspace.fulfilled, (state, action) => {
      if (state.requestId !== action.meta.requestId) return
      state.items = action.payload.tasks; state.status = 'succeeded'; state.saveError = null; state.requestId = null
    })
    builder.addCase(loadWorkspace.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) return
      state.status = 'failed'; state.error = action.payload || action.error.message; state.requestId = null
    })
    for (const thunk of [saveTask, removeTask]) {
      builder.addCase(thunk.pending, state => { state.saving = true; state.saveError = null })
      builder.addCase(thunk.rejected, (state, action) => { state.saving = false; state.saveError = action.payload || action.error.message })
    }
    builder.addCase(saveTask.fulfilled, (state, action) => {
      state.saving = false
      const index = state.items.findIndex(task => task.id === action.payload.id)
      if (index < 0) state.items.push(action.payload)
      else state.items[index] = action.payload
    })
    builder.addCase(removeTask.fulfilled, (state, action) => { state.saving = false; state.items = state.items.filter(task => task.id !== action.payload) })
    builder.addCase(removeProject.fulfilled, (state, action) => { state.items = state.items.filter(task => task.projectId !== action.payload) })
  }
})
export const selectVisibleTasks = createSelector([state => state.tasks.items, state => state.filters, (_state, projectId) => projectId], filterTasks)
export const selectProjectCounts = createSelector([state => state.tasks.items], tasks => tasks.reduce((counts, task) => { counts[task.projectId] = (counts[task.projectId] ?? 0) + 1; return counts }, Object.create(null)))
export default tasksSlice.reducer
