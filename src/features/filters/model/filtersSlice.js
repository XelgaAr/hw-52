import { createSlice } from '@reduxjs/toolkit'
import { DEFAULT_FILTERS } from '../../../shared/config/constants.js'
const filtersSlice = createSlice({
  name: 'filters', initialState: DEFAULT_FILTERS,
  reducers: {
    setFilter: (state, { payload }) => { if (Object.hasOwn(state, payload.key)) state[payload.key] = payload.value },
    resetFilters: () => DEFAULT_FILTERS
  }
})
export const { setFilter, resetFilters } = filtersSlice.actions
export default filtersSlice.reducer
