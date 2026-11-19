import { CheckCircle2, Clock, XCircle, AlertCircle, LogIn } from "lucide-react";
const StatusBadge = ({ status }) => {
  const normalized = status.toLowerCase();
  if (normalized === "confirmed" || normalized === "paid" || normalized === "approved" || normalized === "available" || normalized === "active" || normalized === "completed") {
    return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-800 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>;
  }
  if (normalized === "checked-in" || normalized === "occupied") {
    return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border border-sky-200 bg-sky-50 text-sky-800 whitespace-nowrap">
        <LogIn className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>;
  }
  if (normalized === "pending" || normalized === "pending verification" || normalized === "partially paid") {
    return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border border-amber-200 bg-amber-50 text-amber-800 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>;
  }
  if (normalized === "cancelled" || normalized === "rejected" || normalized === "inactive" || normalized === "maintenance" || normalized === "unavailable") {
    return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border border-red-200 bg-red-50 text-red-800 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border border-[#DCE5E3] bg-[#F5F8F7] text-[#435654] whitespace-nowrap">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>;
};
export {
  StatusBadge
};
