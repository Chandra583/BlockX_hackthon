import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { toggleSidebar, setSidebarOpen, setActiveSidebarItem } from '../store/uiSlice';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useUI = () => {
  const dispatch = useAppDispatch();
  const { sidebarOpen, activeSidebarItem } = useAppSelector((state) => state.ui);

  const toggleSidebarHandler = () => {
    dispatch(toggleSidebar());
  };

  const setSidebarOpenHandler = (open: boolean) => {
    dispatch(setSidebarOpen(open));
  };

  const setActiveSidebarItemHandler = (item: string) => {
    dispatch(setActiveSidebarItem(item));
  };

  return {
    sidebarOpen,
    activeSidebarItem,
    toggleSidebar: toggleSidebarHandler,
    setSidebarOpen: setSidebarOpenHandler,
    setActiveSidebarItem: setActiveSidebarItemHandler,
  };
};