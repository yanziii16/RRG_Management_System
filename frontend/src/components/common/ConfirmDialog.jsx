import { Button } from "./Button";
import { Modal } from "./Modal";
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false
}) => {
  return <Modal open={open} onClose={onClose} title={title} maxWidth="sm">
      <p className="text-sm text-[#435654] leading-relaxed">{message}</p>
      <div className="flex items-center justify-end gap-2.5 mt-6">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
    type="button"
    variant={variant === "danger" ? "danger" : "primary"}
    onClick={onConfirm}
    loading={loading}
  >
          {confirmLabel}
        </Button>
      </div>
    </Modal>;
};
export {
  ConfirmDialog
};
