import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
const NotificationContext = createContext(null);
const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const notify = useCallback(
    (message, type = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );
  return <NotificationContext.Provider value={{ notify }}>
      {children}
      <div
    aria-live="polite"
    className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none no-print"
  >
        {toasts.map((t) => <div
    key={t.id}
    className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-md transition-all ${t.type === "success" ? "bg-white border-emerald-200 text-emerald-950" : t.type === "error" ? "bg-white border-red-200 text-red-950" : "bg-white border-[#DCE5E3] text-[#152423]"}`}
  >
            {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="w-4 h-4 text-[#143E3B] shrink-0 mt-0.5" />}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
    type="button"
    onClick={() => dismiss(t.id)}
    aria-label="Dismiss notification"
    className="text-[#5A6D6B] hover:text-[#152423] shrink-0"
  >
              <X className="w-4 h-4" />
            </button>
          </div>)}
      </div>
    </NotificationContext.Provider>;
};
function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
}
export {
  NotificationProvider,
  useNotification
};
