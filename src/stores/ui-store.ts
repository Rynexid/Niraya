import { create } from 'zustand'

type UiState = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

/**
 * Cross-feature UI state only. Server data belongs in TanStack Query,
 * feature state belongs inside `src/features/<feature>`.
 */
export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
