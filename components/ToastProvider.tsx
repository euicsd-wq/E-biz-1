import React, { createContext, useContext } from 'react';
import type { Toast } from '../types';
import { useTenderStore } from '../hooks/useTenderStore';
import { CheckCircleIconSolid, XCircleIconSolid, InformationCircleIcon } from './icons';

type ToastContextType = {
  addToast: (message: string, type?: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastMessage: React.FC<{ toast: Toast, onDismiss: () => void }> = ({ toast, onDismiss }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const iconMap = {
        success: <CheckCircleIconSolid className="w-5 h-5 text-emerald-400" />,
        error: <XCircleIconSolid className="w-5 h-5 text-rose-400" />,
        info: <InformationCircleIcon className="w-5 h-5 text-cyan-400" />,
    };

    const bgMap = {
        success: 'bg-emerald-500/10 border-emerald-500/30',
        error: 'bg-rose-500/10 border-rose-500/30',
        info: 'bg-cyan-500/10 border-cyan-500/30',
    };

    return (
        <div className={`flex items-start gap-3 w-full max-w-sm p-4 rounded-lg shadow-lg border animate-slide-in-up backdrop-blur-md ${bgMap[toast.type]}`}>
            <div className="flex-shrink-0">{iconMap[toast.type]}</div>
            <p className="flex-grow text-sm text-slate-200">{toast.message}</p>
            <button onClick={onDismiss} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
};

type ToastProviderProps = {
  children: React.ReactNode;
  store: ReturnType<typeof useTenderStore>;
};

const ToastProvider: React.FC<ToastProviderProps> = ({ children, store }) => {
  const { toasts, addToast, removeToast } = store;

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <ToastMessage key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
