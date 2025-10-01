import { create } from "zustand";

interface UIState {
	sidebarOpen: boolean;
	toggleSidebar: () => void;
	setSidebarOpen: (open: boolean) => void;
	activeTab: "finances" | "household";
	setActiveTab: (tab: "finances" | "household") => void;
}

export const useUIStore = create<UIState>((set) => ({
	sidebarOpen: false,
	toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
	setSidebarOpen: (open) => set({ sidebarOpen: open }),
	activeTab: "finances",
	setActiveTab: (tab) => set({ activeTab: tab }),
}));
