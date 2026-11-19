import { useMemo, useState } from "react";
import { Eye, Plus, Check, X } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminStatCard } from "../../components/admin/AdminStatCard";
import { Button } from "../../components/common/Button";
import { DataTable } from "../../components/common/DataTable";
import { Input } from "../../components/common/Input";
import { Loading } from "../../components/common/Loading";
import { Modal } from "../../components/common/Modal";
import { SafeImage } from "../../components/common/SafeImage";
import { SearchBar } from "../../components/common/SearchBar";
import { Select } from "../../components/common/Select";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useNotification } from "../../context/NotificationContext";
import { useReservations } from "../../hooks/useReservations";
import { extractErrorMessage } from "../../services/api";
import { paymentService } from "../../services/paymentService";
import { formatPesoExact } from "../../utils/currencyUtils";
import { formatDateTimeDisplay } from "../../utils/dateUtils";
const PaymentManagement = () => {
  const { payments, reservations, loading, refreshAll } = useReservations();
  const { notify } = useNotification();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [inspectPayment, setInspectPayment] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const reservationsWithBalance = useMemo(
    () => reservations.filter(
      (r) => r.balance > 0 && !["Cancelled", "Rejected"].includes(r.status)
    ),
    [reservations]
  );
  const [targetResId, setTargetResId] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recType, setRecType] = useState("Down Payment");
  const [recMethod, setRecMethod] = useState("Cash");
  const [recRef, setRecRef] = useState("");
  const [recNotes, setRecNotes] = useState("");
  const [recording, setRecording] = useState(false);
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.receiptNumber.toLowerCase().includes(q) || p.reservationRef.toLowerCase().includes(q) || p.guestName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [payments, statusFilter, search]);
  const totals = useMemo(() => {
    const approvedTotal = payments.filter((p) => p.status === "Approved").reduce((s, p) => s + p.amount, 0);
    const pendingCount = payments.filter((p) => p.status === "Pending Verification").length;
    const pendingAmount = payments.filter((p) => p.status === "Pending Verification").reduce((s, p) => s + p.amount, 0);
    const totalOutstanding = reservations.filter((r) => !["Cancelled", "Rejected"].includes(r.status)).reduce((s, r) => s + r.balance, 0);
    return { approvedTotal, pendingCount, pendingAmount, totalOutstanding };
  }, [payments, reservations]);
  const handleVerify = async (payment, status) => {
    setVerifying(true);
    try {
      await paymentService.verify(payment.id, status, reviewNotes || payment.notes);
      await refreshAll();
      setInspectPayment(null);
      setReviewNotes("");
      notify(`Payment ${payment.receiptNumber} marked as ${status}.`, "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Verification update failed."), "error");
    } finally {
      setVerifying(false);
    }
  };
  const openRecordPayment = () => {
    const first = reservationsWithBalance[0];
    setTargetResId(first?.id || "");
    setRecAmount(first ? String(first.balance) : "");
    setRecType("Full Payment");
    setRecMethod("Cash");
    setRecRef("");
    setRecNotes("");
    setRecordOpen(true);
  };
  const handleRecordDirect = async (e) => {
    e.preventDefault();
    const res = reservations.find((r) => r.id === targetResId);
    if (!res) {
      notify("Select a valid reservation.", "error");
      return;
    }
    const amt = Number(recAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      notify("Amount must be greater than zero.", "error");
      return;
    }
    if (amt > res.balance + 0.01) {
      notify(`Amount cannot exceed remaining balance (${formatPesoExact(res.balance)}).`, "error");
      return;
    }
    setRecording(true);
    try {
      await paymentService.create({
        reservationId: res.id,
        amount: amt,
        paymentType: recType,
        method: recMethod,
        referenceCode: recRef.trim(),
        notes: recNotes.trim(),
        autoApprove: true
      });
      await refreshAll();
      setRecordOpen(false);
      notify("Direct payment recorded and approved.", "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Could not record payment."), "error");
    } finally {
      setRecording(false);
    }
  };
  const columns = [
    {
      key: "receipt",
      header: "Receipt / Ref",
      render: (p) => <div className="text-xs">
          <p className="font-mono-num font-semibold text-[#152423]">{p.receiptNumber}</p>
          <p className="text-[11px] text-[#5A6D6B] font-mono-num">{p.reservationRef}</p>
        </div>
    },
    {
      key: "guest",
      header: "Guest",
      render: (p) => <span className="text-xs font-medium">{p.guestName}</span>
    },
    {
      key: "method",
      header: "Type & Method",
      render: (p) => <div className="text-xs">
          <p>{p.paymentType}</p>
          <p className="text-[11px] text-[#5A6D6B]">
            {p.method}
            {p.referenceCode ? ` · ${p.referenceCode}` : ""}
          </p>
        </div>
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p) => <span className="text-xs font-semibold">{formatPesoExact(p.amount)}</span>
    },
    {
      key: "date",
      header: "Submitted",
      render: (p) => <span className="text-xs text-[#5A6D6B]">{formatDateTimeDisplay(p.createdAt)}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge status={p.status} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => <div className="inline-flex items-center gap-1.5">
          {p.status === "Pending Verification" && <>
              <button
        type="button"
        onClick={() => handleVerify(p, "Approved")}
        title="Approve payment"
        className="p-1.5 rounded-lg border border-emerald-200 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
      >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
        type="button"
        onClick={() => handleVerify(p, "Rejected")}
        title="Reject payment"
        className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
      >
                <X className="w-3.5 h-3.5" />
              </button>
            </>}
          <button
        type="button"
        onClick={() => {
          setInspectPayment(p);
          setReviewNotes(p.notes || "");
        }}
        title="Inspect payment proof"
        className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-[#F5F8F7] cursor-pointer"
      >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
    }
  ];
  const selectedReservation = reservations.find((r) => r.id === targetResId);
  return <div className="space-y-6">
      <AdminPageHeader
    title="Payment Management"
    subtitle="Verify guest payment proof submissions, record direct walk-in payments, and monitor reservation balances."
    action={<Button onClick={openRecordPayment} disabled={reservationsWithBalance.length === 0}>
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </Button>}
  />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Approved Collections" value={formatPesoExact(totals.approvedTotal)} />
        <AdminStatCard label="Pending Proofs" value={totals.pendingCount} />
        <AdminStatCard label="Pending Verification Amount" value={formatPesoExact(totals.pendingAmount)} />
        <AdminStatCard label="Total Unpaid Balances" value={formatPesoExact(totals.totalOutstanding)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Search receipt, reservation ref, or guest..."
    className="flex-1 max-w-md"
  />
        <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
          <option value="All">All verification states</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? <Loading /> : <DataTable columns={columns} data={filtered} rowKey={(p) => p.id} />}

      {
    /* Review Payment Proof Modal */
  }
      <Modal
    open={Boolean(inspectPayment)}
    onClose={() => setInspectPayment(null)}
    title={`Payment Review — ${inspectPayment?.receiptNumber || ""}`}
    subtitle={`${inspectPayment?.guestName} · Reservation ${inspectPayment?.reservationRef}`}
    maxWidth="lg"
  >
        {inspectPayment && <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[#F7FAF9] border border-[#E8EEEC] text-xs">
              <div>
                <p className="text-[#5A6D6B]">Amount</p>
                <p className="text-base font-bold text-[#143E3B] tabular-nums">
                  {formatPesoExact(inspectPayment.amount)}
                </p>
              </div>
              <div>
                <p className="text-[#5A6D6B]">Status</p>
                <div className="mt-1">
                  <StatusBadge status={inspectPayment.status} />
                </div>
              </div>
              <div>
                <p className="text-[#5A6D6B]">Method & Type</p>
                <p className="font-medium text-[#152423]">
                  {inspectPayment.method} · {inspectPayment.paymentType}
                </p>
              </div>
              <div>
                <p className="text-[#5A6D6B]">Reference Code</p>
                <p className="font-mono-num font-medium">{inspectPayment.referenceCode || "—"}</p>
              </div>
            </div>

            {inspectPayment.proofImageUrl ? <div>
                <p className="text-xs font-medium text-[#2A3B39] mb-2">Submitted Payment Proof</p>
                <div className="rounded-lg overflow-hidden border border-[#DCE5E3] bg-[#F5F8F7]">
                  <SafeImage
    src={inspectPayment.proofImageUrl}
    alt="Payment proof"
    className="w-full max-h-80 object-contain"
  />
                </div>
              </div> : <p className="text-xs text-[#5A6D6B]">No proof image attached (recorded directly by Admin).</p>}

            <div>
              <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
                Verification Notes
              </label>
              <textarea
    rows={2}
    value={reviewNotes}
    onChange={(e) => setReviewNotes(e.target.value)}
    className="w-full px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg"
    placeholder="Notes for approval or rejection reason..."
  />
            </div>

            <div className="flex justify-end gap-2.5">
              {inspectPayment.status !== "Rejected" && <Button
    type="button"
    variant="danger"
    loading={verifying}
    onClick={() => handleVerify(inspectPayment, "Rejected")}
  >
                  Reject Payment
                </Button>}
              {inspectPayment.status !== "Approved" && <Button
    type="button"
    loading={verifying}
    onClick={() => handleVerify(inspectPayment, "Approved")}
  >
                  Approve & Credit Balance
                </Button>}
            </div>
          </div>}
      </Modal>

      {
    /* Record Direct Payment Modal */
  }
      <Modal
    open={recordOpen}
    onClose={() => setRecordOpen(false)}
    title="Record Direct Payment"
    subtitle="Record cash or verified transfers received directly by the resort admin."
    maxWidth="md"
  >
        <form onSubmit={handleRecordDirect} className="space-y-4">
          <Select
    label="Reservation with balance"
    value={targetResId}
    onChange={(e) => {
      const id = e.target.value;
      setTargetResId(id);
      const found = reservations.find((r) => r.id === id);
      if (found) setRecAmount(String(found.balance));
    }}
    options={reservationsWithBalance.map((r) => ({
      value: r.id,
      label: `${r.referenceNumber} — ${r.guestName} (Bal: ${formatPesoExact(r.balance)})`
    }))}
  />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
    label="Payment type"
    value={recType}
    onChange={(e) => setRecType(e.target.value)}
    options={[
      { value: "Down Payment", label: "Down Payment" },
      { value: "Partial Payment", label: "Partial Payment" },
      { value: "Full Payment", label: "Full Payment" }
    ]}
  />
            <Select
    label="Method"
    value={recMethod}
    onChange={(e) => setRecMethod(e.target.value)}
    options={[
      { value: "Cash", label: "Cash" },
      { value: "GCash", label: "GCash" },
      { value: "Bank Transfer", label: "Bank Transfer" },
      { value: "Card", label: "Card" }
    ]}
  />
          </div>
          <Input
    label="Amount (PHP)"
    type="number"
    step="0.01"
    min="1"
    max={selectedReservation?.balance}
    required
    value={recAmount}
    onChange={(e) => setRecAmount(e.target.value)}
    hint={selectedReservation ? `Remaining balance: ${formatPesoExact(selectedReservation.balance)}` : void 0}
  />
          <Input
    label="Reference code (optional)"
    value={recRef}
    onChange={(e) => setRecRef(e.target.value)}
  />
          <Input
    label="Notes (optional)"
    value={recNotes}
    onChange={(e) => setRecNotes(e.target.value)}
  />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={recording}>
              Save & Approve Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>;
};
export {
  PaymentManagement
};
