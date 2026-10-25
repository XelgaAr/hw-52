import { configureStore } from '@reduxjs/toolkit'
import { projectsReducer } from '../features/projects/index.js'
import { tasksReducer } from '../features/tasks/index.js'
import filtersReducer from '../features/filters/model/filtersSlice.js'
export const createAppStore = () => configureStore({ reducer: { projects: projectsReducer, tasks: tasksReducer, filters: filtersReducer } })
export const store = createAppStore()
