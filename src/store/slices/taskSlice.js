
import { createSlice } from '@reduxjs/toolkit';

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    stats: { active: 0, completed: 0, pending: 0, total: 0 },
    isLoading: false,
    error: null,
  },
  reducers: {
    setTasks: (state, action) => {
      state.items = action.payload;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    updateTask: (state, action) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeTask: (state, action) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    setTaskLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
});

export const { setTasks, setStats, updateTask, removeTask, setTaskLoading } = taskSlice.actions;
export default taskSlice.reducer;
