// UI state store using Zustand
import { create } from 'zustand';

const useUIStore = create((set) => ({
  // Modal state
  modals: {
    login: false,
    register: false,
    confirmDelete: false,
    createBook: false,
    createTopic: false,
    createQuestion: false,
    createQuiz: false,
    bulkImport: false,
  },

  // Toast notifications
  toasts: [],

  // Loading states
  loading: {
    global: false,
    books: false,
    topics: false,
    questions: false,
    quizzes: false,
    attempts: false,
  },

  // Sidebar state (for admin/student layouts)
  sidebarOpen: true,

  // Actions - Modals
  openModal: (modalName) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modalName]: true,
      },
    }));
  },

  closeModal: (modalName) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modalName]: false,
      },
    }));
  },

  closeAllModals: () => {
    set({
      modals: {
        login: false,
        register: false,
        confirmDelete: false,
        createBook: false,
        createTopic: false,
        createQuestion: false,
        createQuiz: false,
        bulkImport: false,
      },
    });
  },

  // Actions - Toasts
  addToast: (toast) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      ...toast,
      timestamp: Date.now(),
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Helper to show success toast
  showSuccess: (message) => {
    return useUIStore.getState().addToast({
      type: 'success',
      message,
    });
  },

  // Helper to show error toast
  showError: (message, options = {}) => {
    return useUIStore.getState().addToast({
      type: 'error',
      message,
      duration: options.duration || 5000,
    });
  },

  // Helper to show info toast
  showInfo: (message) => {
    return useUIStore.getState().addToast({
      type: 'info',
      message,
    });
  },

  // Helper to show warning toast
  showWarning: (message) => {
    return useUIStore.getState().addToast({
      type: 'warning',
      message,
    });
  },

  // Actions - Loading
  setLoading: (key, value) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: value,
      },
    }));
  },

  setGlobalLoading: (value) => {
    set((state) => ({
      loading: {
        ...state.loading,
        global: value,
      },
    }));
  },

  // Actions - Sidebar
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },
}));

export default useUIStore;

