import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "../../components/common/Button";
import { ImageUpload } from "../../components/common/ImageUpload";
import { Input } from "../../components/common/Input";
import { EmptyState, Loading } from "../../components/common/Loading";
import { Select } from "../../components/common/Select";
import { useNotification } from "../../context/NotificationContext";
import { useReservations } from "../../hooks/useReservations";
import { extractErrorMessage } from "../../services/api";
import { paymentService } from "../../services/paymentService";
import { reservationService } from "../../services/reservationService";
import { formatPesoExact } from "../../utils/currencyUtils";
import { formatDateDisplay } from "../../utils/dateUtils";
const PaymentInformation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, refreshAll } = useReservations();
  const { notify } = useNotification();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentType, setPaymentType] = useState("Down Payment");
  const [method, setMethod] = useState("GCash");
  const [amount, setAmount] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [proofImages, setProofImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    reservationService.getById(id).then((res) => {
      setReservation(res);
      const suggestedDown = Math.round(res.totalAmount * (settings.downPaymentPercentage / 100) * 100) / 100;
      const initialAmt = Math.min(res.balance, suggestedDown > 0 ? suggestedDown : res.balance);
      setAmount(String(initialAmt));
    }).catch(() => setReservation(null)).finally(() => setLoading(false));
  }, [id, settings.downPaymentPercentage]);
  if (loading) return <Loading message="Loading payment details..." />;
  if (!reservation) {
    return <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
      title="Reservation not found"
      action={<Link to="/my-reservations" className="text-sm font-medium text-[#143E3B] underline">
              Back to My Reservations
            </Link>}
    />
      </div>;
  }
  const handlePaymentTypeChange = (nextType) => {
    setPaymentType(nextType);
    if (nextType === "Full Payment") {
      setAmount(String(reservation.balance));
    } else if (nextType === "Down Payment") {
      const half = Math.round(reservation.totalAmount * (settings.downPaymentPercentage / 100) * 100) / 100;
      setAmount(String(Math.min(reservation.balance, half)));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }
    if (numericAmount > reservation.balance + 0.01) {
      setError(`Payment amount cannot exceed your remaining balance (${formatPesoExact(reservation.balance)}).`);
      return;
    }
    if (proofImages.length === 0) {
      setError("Please upload a screenshot or photo of your payment proof.");
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.create({
        reservationId: reservation.id,
        amount: numericAmount,
        paymentType,
        method,
        referenceCode: referenceCode.trim(),
        proofImageUrl: proofImages[0],
        notes: notes.trim()
      });
      await refreshAll();
      notify("Payment proof submitted! Status is now Pending Verification by Admin.", "success");
      navigate("/my-reservations");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to submit payment information."));
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
    to="/my-reservations"
    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A6D6B] hover:text-[#143E3B] mb-4"
  >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to My Reservations</span>
      </Link>

      <div className="mb-6">
        <p className="text-xs font-medium text-[#5A6D6B]">
          Reservation {reservation.referenceNumber}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#152423] tracking-tight">
          Submit payment information
        </h1>
        <p className="mt-1 text-sm text-[#5A6D6B]">
          Transfer your payment using our official resort channels below and upload your receipt proof for verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <form
    onSubmit={handleSubmit}
    className="lg:col-span-2 bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-5"
  >
          <div className="p-4 rounded-lg bg-[#F5F8F7] border border-[#DCE5E3] flex items-start gap-3 text-xs text-[#435654]">
            <Info className="w-4 h-4 text-[#143E3B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#152423]">Admin verification required</p>
              <p className="mt-0.5 leading-relaxed">
                Uploading payment proof records your submission as <strong>Pending Verification</strong>. Your balance will update once our Resort Administrator verifies and approves your payment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border border-[#E8EEEC] text-xs">
            <div>
              <p className="font-semibold text-[#152423]">GCash Account</p>
              <p className="mt-1 text-[#435654] font-mono-num">{settings.bankDetails.gcashNumber}</p>
              <p className="text-[#5A6D6B]">{settings.bankDetails.gcashName}</p>
            </div>
            <div>
              <p className="font-semibold text-[#152423]">{settings.bankDetails.bankName}</p>
              <p className="mt-1 text-[#435654] font-mono-num">{settings.bankDetails.bankAccountNumber}</p>
              <p className="text-[#5A6D6B]">{settings.bankDetails.bankAccountName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
    label="Payment type"
    value={paymentType}
    onChange={(e) => handlePaymentTypeChange(
      e.target.value
    )}
    options={[
      { value: "Down Payment", label: `Down Payment (${settings.downPaymentPercentage}%)` },
      { value: "Partial Payment", label: "Partial Payment" },
      { value: "Full Payment", label: "Full Payment" }
    ]}
  />
            <Select
    label="Payment method"
    value={method}
    onChange={(e) => setMethod(e.target.value)}
    options={[
      { value: "GCash", label: "GCash" },
      { value: "Bank Transfer", label: "Bank Transfer" },
      { value: "Cash", label: "Cash (Pay on Arrival / Front Desk)" },
      { value: "Card", label: "Debit / Credit Card" }
    ]}
  />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
    label="Amount paid (PHP)"
    type="number"
    step="0.01"
    min="1"
    max={reservation.balance}
    required
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    hint={`Remaining balance: ${formatPesoExact(reservation.balance)}`}
  />
            <Input
    label="Transaction reference number"
    value={referenceCode}
    onChange={(e) => setReferenceCode(e.target.value)}
    placeholder="e.g. GC-88412904"
  />
          </div>

          <ImageUpload
    label="Payment proof (screenshot or deposit slip)"
    images={proofImages}
    onChange={setProofImages}
    multiple={false}
    folder="payment-proofs"
  />

          <div>
            <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
              Notes (optional)
            </label>
            <textarea
    rows={2}
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Sender name or transfer notes..."
    className="w-full px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg"
  />
          </div>

          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>}

          <Button type="submit" loading={submitting} size="lg" className="w-full">
            Submit Payment Proof
          </Button>
        </form>

        {
    /* Right Summary */
  }
        <div className="bg-white border border-[#DCE5E3] rounded-xl p-5 space-y-3 text-sm">
          <h2 className="text-base font-semibold text-[#152423]">Balance summary</h2>
          <p className="text-xs text-[#5A6D6B]">
            {reservation.accommodationName} ·{" "}
            {reservation.stayType === "overnight" ? `${formatDateDisplay(reservation.checkInDate)} to ${formatDateDisplay(reservation.checkOutDate)}` : `${formatDateDisplay(reservation.checkInDate)} (${reservation.session})`}
          </p>
          <div className="border-t border-[#EEF2F1] pt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#5A6D6B]">Total amount</span>
              <span className="font-medium tabular-nums">
                {formatPesoExact(reservation.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6D6B]">Verified payments</span>
              <span className="font-medium text-emerald-800 tabular-nums">
                {formatPesoExact(reservation.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#DCE5E3] text-sm font-bold text-[#143E3B]">
              <span>Remaining Balance</span>
              <span className="tabular-nums">{formatPesoExact(reservation.balance)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export {
  PaymentInformation
};
