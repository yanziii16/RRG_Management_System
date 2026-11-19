import { useEffect } from "react";
import { X } from "lucide-react";
const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "lg",
  children
}) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);
  if (!open) return null;
  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl"
  };
  return <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[1px] no-print"
    onClick={onClose}
  >
      <div
    role="dialog"
    aria-modal="true"
    className={`w-full ${widths[maxWidth]} bg-white border border-[#DCE5E3] rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col`}
    onClick={(e) => e.stopPropagation()}
  >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E8EEEC]">
          <div>
            <h3 className="text-base font-semibold text-[#152423]">{title}</h3>
            {subtitle && <p className="text-xs text-[#5A6D6B] mt-0.5">{subtitle}</p>}
          </div>
          <button
    type="button"
    onClick={onClose}
    aria-label="Close dialog"
    className="p-1.5 rounded-lg text-[#5A6D6B] hover:text-[#152423] hover:bg-[#F5F8F7]"
  >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>;
};
export {
  Modal
};
