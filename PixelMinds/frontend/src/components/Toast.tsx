"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";

interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
    duration?: number;
}

interface ToastContextType {
    showToast: (
        message: string,
        type?: Toast["type"],
        duration?: number
    ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(
        (
            message: string,
            type: Toast["type"] = "info",
            duration: number = 4000
        ) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const toast: Toast = { id, message, type, duration };

            setToasts((prev) => [...prev, toast]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        },
        []
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({
    toast,
    onClose,
}: {
    toast: Toast;
    onClose: (id: string) => void;
}) {
    const icons: Record<Toast["type"], string> = {
        success: "✓",
        error: "✕",
        warning: "⚠",
        info: "ℹ",
    };

    const colors: Record<Toast["type"], string> = {
        success: "border-emerald-500/40 bg-emerald-500/10",
        error: "border-red-500/40 bg-red-500/10",
        warning: "border-amber-500/40 bg-amber-500/10",
        info: "border-violet-500/40 bg-violet-500/10",
    };

    const iconColors: Record<Toast["type"], string> = {
        success: "text-emerald-400",
        error: "text-red-400",
        warning: "text-amber-400",
        info: "text-violet-400",
    };

    return (
        <div
            className={`animate-toast-in pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-[450px] ${colors[toast.type]}`}
        >
            <span
                className={`text-lg font-bold flex-shrink-0 ${iconColors[toast.type]}`}
            >
                {icons[toast.type]}
            </span>
            <p className="text-sm text-[var(--text-primary)] flex-1 leading-snug">
                {toast.message}
            </p>
            <button
                onClick={() => onClose(toast.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0 ml-2 text-lg"
            >
                ×
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
