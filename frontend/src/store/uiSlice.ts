import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  activeSidebarItem: string;
}

const initialState: UIState = {
  sidebarOpen: true,
  activeSidebarItem: 'dashboard',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setActiveSidebarItem: (state, action: PayloadAction<string>) => {
      state.activeSidebarItem = action.payload;
      // Save to localStorage
      localStorage.setItem('activeSidebarItem', action.payload);
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setActiveSidebarItem } = uiSlice.actions;

export default uiSlice.reducer;