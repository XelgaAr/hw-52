import { createAsyncThunk } from '@reduxjs/toolkit'
import { workspaceApi } from '../../../services/api/workspaceApi.js'
export const loadWorkspace = createAsyncThunk('workspace/load', async (_, { signal, rejectWithValue }) => {
  try { return await workspaceApi.load(signal) }
  catch (error) { return rejectWithValue(error.message || 'Не удалось загрузить данные.') }
}, { condition: (_, { getState }) => getState().tasks.status !== 'loading' })
