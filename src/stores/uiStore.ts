import { create } from 'zustand';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void;
}

interface UiState {
  toastMessage: string | null;
  toastData: ToastData | null;
  isGlobalLoading: boolean;
  showToast: (msg: string, type?: ToastType, options?: { actionLabel?: string; onAction?: () => void }) => void;
  hideToast: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toastMessage: null,
  toastData: null,
  isGlobalLoading: false,
  showToast: (msg, type = 'default', options) => {
    set({
      toastMessage: msg,
      toastData: { message: msg, type, actionLabel: options?.actionLabel, onAction: options?.onAction },
    });
    setTimeout(() => set({ toastMessage: null, toastData: null }), 3000);
  },
  hideToast: () => set({ toastMessage: null, toastData: null }),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));
