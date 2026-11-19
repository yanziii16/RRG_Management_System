import { AlertCircle, Inbox } from "lucide-react";
const Loading = ({ message = "Loading data..." }) => <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-7 h-7 border-2 border-[#143E3B] border-t-transparent rounded-full animate-spin mb-3" />
    <p className="text-sm text-[#5A6D6B]">{message}</p>
  </div>;
const EmptyState = ({ title, description, action }) => <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-[#DCE5E3] rounded-xl">
    <div className="w-11 h-11 rounded-lg bg-[#EDF3F1] text-[#143E3B] flex items-center justify-center mb-3">
      <Inbox className="w-5 h-5" />
    </div>
    <h4 className="text-sm font-semibold text-[#152423]">{title}</h4>
    {description && <p className="text-xs text-[#5A6D6B] mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>;
const ErrorMessage = ({
  message,
  onRetry
}) => <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-red-900 text-sm">
    <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
    <div className="flex-1">
      <p>{message}</p>
      {onRetry && <button
  type="button"
  onClick={onRetry}
  className="mt-1.5 text-xs font-medium underline hover:no-underline"
>
          Try again
        </button>}
    </div>
  </div>;
export {
  EmptyState,
  ErrorMessage,
  Loading
};
