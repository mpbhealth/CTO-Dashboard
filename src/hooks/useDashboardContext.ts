import { createContext, useContext } from 'react';

interface DashboardContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const DashboardContext = createContext<DashboardContextType>({
  sidebarOpen: true,
  setSidebarOpen: () => {},
});

export function useDashboardContext() {
  return useContext(DashboardContext);
}
