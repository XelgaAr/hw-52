import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { workspaceApi } from '../../../services/api/workspaceApi.js'
import { validateProject, validateWorkspace } from '../../../shared/lib/taskModel.js'
import { loadWorkspace } from '../../workspace/model/loadWorkspace.js'
export const saveProject = createAsyncThunk('projects/save', async (value, { signal, getState, rejectWithValue }) => {
  const project = { ...(value.id ? { id: value.id } : {}), name: value.name.trim(), color: value.color }
  const error = validateProject(project, getState().projects.items)
  if (error) return rejectWithValue(error)
  try {
    const result = await workspaceApi.saveProject(project, signal)
    validateWorkspace({ version: 1, projects: [result], tasks: [] })
    return result
  } catch (error) { return rejectWithValue(error.message) }
}, { condition: (_, { getState }) => !getState().projects.saving && !getState().tasks.saving })
export const removeProject = createAsyncThunk('projects/remove', async (id, { signal, rejectWithValue }) => {
  try { return await workspaceApi.removeProject(id, signal) }
  catch (error) { return rejectWithValue(error.message) }
}, { condition: (_, { getState }) => !getState().projects.saving && !getState().tasks.saving })
const projectsSlice = createSlice({
  name: 'projects',
  initialState: { items: [], saving: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(loadWorkspace.fulfilled, (state, action) => { state.items = action.payload.projects; state.error = null })
    for (const thunk of [saveProject, removeProject]) {
      builder.addCase(thunk.pending, state => { state.saving = true; state.error = null })
      builder.addCase(thunk.rejected, (state, action) => { state.saving = false; state.error = action.payload || action.error.message })
    }
    builder.addCase(saveProject.fulfilled, (state, action) => {
      state.saving = false
      const index = state.items.findIndex(project => project.id === action.payload.id)
      if (index < 0) state.items.push(action.payload)
      else state.items[index] = action.payload
    })
    builder.addCase(removeProject.fulfilled, (state, action) => { state.saving = false; state.items = state.items.filter(project => project.id !== action.payload) })
  }
})
export default projectsSlice.reducer
