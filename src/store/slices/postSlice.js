
import { createSlice } from '@reduxjs/toolkit';

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    setPosts: (state, action) => {
      state.items = action.payload;
    },
    addPost: (state, action) => {
      state.items.unshift(action.payload);
    },
    updatePost: (state, action) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removePost: (state, action) => {
      state.items = state.items.filter(p => p.id !== action.payload);
    },
    setPostLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
});

export const { setPosts, addPost, updatePost, removePost, setPostLoading } = postSlice.actions;
export default postSlice.reducer;
