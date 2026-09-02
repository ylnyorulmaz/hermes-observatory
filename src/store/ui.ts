import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UIState {
  viewMode: 'overview' | 'profiles' | 'kanban' | 'subagents' | 'tokens' | 'logs';
  sidebarOpen: boolean;
  selectedProfile: string | null;
  selectedTicket: string | null;
  selectedSubagent: string | null;
  timeRange: '1h' | '6h' | '24h' | '7d';
  autoRefresh: boolean;
  refreshInterval: number;
  theme: 'dark' | 'light';
  
  setViewMode: (mode: UIState['viewMode']) => void;
  toggleSidebar: () => void;
  setSelectedProfile: (id: string | null) => void;
  setSelectedTicket: (id: string | null) => void;
  setSelectedSubagent: (id: string | null) => void;
  setTimeRange: (range: UIState['timeRange']) => void;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (ms: number) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewMode: 'overview',
      sidebarOpen: true,
      selectedProfile: null,
      selectedTicket: null,
      selectedSubagent: null,
      timeRange: '24h',
      autoRefresh: true,
      refreshInterval: 5000,
      theme: 'dark',

      setViewMode: (mode) => set({ viewMode: mode }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSelectedProfile: (id) => set({ selectedProfile: id }),
      setSelectedTicket: (id) => set({ selectedTicket: id }),
      setSelectedSubagent: (id) => set({ selectedSubagent: id }),
      setTimeRange: (range) => set({ timeRange: range }),
      toggleAutoRefresh: () => set((s) => ({ autoRefresh: !s.autoRefresh })),
      setRefreshInterval: (ms) => set({ refreshInterval: ms }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'hermes-observatory-ui',
      partialize: (s) => ({
        viewMode: s.viewMode,
        sidebarOpen: s.sidebarOpen,
        timeRange: s.timeRange,
        autoRefresh: s.autoRefresh,
        refreshInterval: s.refreshInterval,
        theme: s.theme,
      }),
    }
  )
);