import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Button } from "../../components/common/Button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";
import { ImageUpload } from "../../components/common/ImageUpload";
import { Input } from "../../components/common/Input";
import { Loading } from "../../components/common/Loading";
import { Modal } from "../../components/common/Modal";
import { SafeImage } from "../../components/common/SafeImage";
import { SearchBar } from "../../components/common/SearchBar";
import { Select } from "../../components/common/Select";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useNotification } from "../../context/NotificationContext";
import { useReservations } from "../../hooks/useReservations";
import { accommodationService } from "../../services/accommodationService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/currencyUtils";
const CottageManagement = () => {
  const { accommodations, loading, refreshPublicData } = useReservations();
  const { notify } = useNotification();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cottage");
  const [bookingMode, setBookingMode] = useState("both");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [ratePerNight, setRatePerNight] = useState("650");
  const [rateMorning, setRateMorning] = useState("450");
  const [rateAfternoon, setRateAfternoon] = useState("500");
  const [rateNight, setRateNight] = useState("550");
  const [amenitiesText, setAmenitiesText] = useState("Shaded pavilion, Dining table, Pool proximity");
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("Available");
  const [isAvailable, setIsAvailable] = useState(true);
  const items = useMemo(() => {
    return accommodations.filter((a) => a.category === "Cottage" || a.category === "Umbrella").filter((a) => !search.trim() || a.name.toLowerCase().includes(search.toLowerCase()));
  }, [accommodations, search]);
  const openAdd = () => {
    setEditing(null);
    setName("");
    setCategory("Cottage");
    setBookingMode("both");
    setDescription("");
    setCapacity("8");
    setRatePerNight("650");
    setRateMorning("450");
    setRateAfternoon("500");
    setRateNight("550");
    setAmenitiesText("Shaded pavilion, Dining table, Pool proximity");
    setImages([]);
    setStatus("Available");
    setIsAvailable(true);
    setModalOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setName(item.name);
    setCategory(item.category === "Umbrella" ? "Umbrella" : "Cottage");
    setBookingMode(item.bookingMode);
    setDescription(item.description);
    setCapacity(String(item.capacity));
    setRatePerNight(String(item.ratePerNight));
    setRateMorning(String(item.dayUseRates.Morning));
    setRateAfternoon(String(item.dayUseRates.Afternoon));
    setRateNight(String(item.dayUseRates.Night));
    setAmenitiesText(item.amenities.join(", "));
    setImages(item.images);
    setStatus(item.status);
    setIsAvailable(item.isAvailable);
    setModalOpen(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      notify("Cottage or umbrella name is required.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      category,
      bookingMode,
      description: description.trim(),
      capacity: Math.max(1, Number(capacity) || 1),
      ratePerNight: Number(ratePerNight) || 0,
      dayUseRates: {
        Morning: Number(rateMorning) || 0,
        Afternoon: Number(rateAfternoon) || 0,
        Night: Number(rateNight) || 0
      },
      amenities: amenitiesText.split(",").map((x) => x.trim()).filter(Boolean),
      images,
      status,
      isAvailable: isAvailable && status !== "Maintenance"
    };
    try {
      if (editing) {
        await accommodationService.update(editing.id, payload);
        notify(`${category} updated.`, "success");
      } else {
        await accommodationService.create(payload);
        notify(`${category} added.`, "success");
      }
      await refreshPublicData();
      setModalOpen(false);
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to save unit."), "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await accommodationService.remove(deleteTarget.id);
      await refreshPublicData();
      notify("Unit deleted.", "info");
      setDeleteTarget(null);
    } catch (err) {
      notify(extractErrorMessage(err, "Delete failed."), "error");
    }
  };
  const columns = [
    {
      key: "name",
      header: "Unit",
      render: (c) => <div className="flex items-center gap-3">
          <div className="w-14 h-10 rounded overflow-hidden bg-[#EDF3F1] shrink-0">
            <SafeImage src={c.images[0]} fallbackTitle={c.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#152423]">{c.name}</p>
            <p className="text-[11px] text-[#5A6D6B]">
              {c.category} · {c.bookingMode === "both" ? "Day Use & Overnight" : c.bookingMode === "day_use" ? "Day Use Only" : "Overnight Only"}
            </p>
          </div>
        </div>
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "center",
      render: (c) => <span className="text-xs">{c.capacity} guests</span>
    },
    {
      key: "dayUse",
      header: "Day-Use (M / A / N)",
      align: "right",
      render: (c) => <span className="text-xs tabular-nums">
          {formatCurrency(c.dayUseRates.Morning)} / {formatCurrency(c.dayUseRates.Afternoon)} /{" "}
          {formatCurrency(c.dayUseRates.Night)}
        </span>
    },
    {
      key: "overnight",
      header: "Overnight",
      align: "right",
      render: (c) => <span className="text-xs font-semibold">{formatCurrency(c.ratePerNight)}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge status={c.isAvailable ? c.status : "Unavailable"} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => <div className="inline-flex gap-1.5">
          <button
        type="button"
        onClick={() => openEdit(c)}
        className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-[#F5F8F7] cursor-pointer"
      >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
        type="button"
        onClick={() => setDeleteTarget(c)}
        className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
      >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
    }
  ];
  return <div className="space-y-6">
      <AdminPageHeader
    title="Cottage & Umbrella Management"
    subtitle="Manage poolside cottages and beach umbrellas, upload multiple photos, and configure day-use vs overnight availability."
    action={<Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>Add Cottage / Umbrella</span>
          </Button>}
  />

      <SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Search cottages or umbrellas..."
    className="max-w-md"
  />

      {loading ? <Loading /> : <DataTable columns={columns} data={items} rowKey={(c) => c.id} />}

      <Modal
    open={modalOpen}
    onClose={() => setModalOpen(false)}
    title={editing ? `Edit ${editing.name}` : "Add Cottage or Umbrella"}
    maxWidth="lg"
  >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Select
    label="Category"
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    options={[
      { value: "Cottage", label: "Cottage" },
      { value: "Umbrella", label: "Umbrella" }
    ]}
  />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">Description</label>
            <textarea
    rows={3}
    required
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    className="w-full px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg"
  />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
    label="Booking availability"
    value={bookingMode}
    onChange={(e) => setBookingMode(e.target.value)}
    options={[
      { value: "both", label: "Day Use & Overnight" },
      { value: "day_use", label: "Day Use Only" },
      { value: "overnight", label: "Overnight Only" }
    ]}
  />
            <Input
    label="Capacity (guests)"
    type="number"
    min={1}
    required
    value={capacity}
    onChange={(e) => setCapacity(e.target.value)}
  />
            <Input
    label="Overnight rate (PHP)"
    type="number"
    min={0}
    value={ratePerNight}
    onChange={(e) => setRatePerNight(e.target.value)}
  />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
    label="Morning session rate"
    type="number"
    min={0}
    value={rateMorning}
    onChange={(e) => setRateMorning(e.target.value)}
  />
            <Input
    label="Afternoon session rate"
    type="number"
    min={0}
    value={rateAfternoon}
    onChange={(e) => setRateAfternoon(e.target.value)}
  />
            <Input
    label="Night session rate"
    type="number"
    min={0}
    value={rateNight}
    onChange={(e) => setRateNight(e.target.value)}
  />
          </div>

          <Input
    label="Amenities (comma separated)"
    value={amenitiesText}
    onChange={(e) => setAmenitiesText(e.target.value)}
  />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
    label="Operational status"
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    options={[
      { value: "Available", label: "Available" },
      { value: "Occupied", label: "Occupied" },
      { value: "Maintenance", label: "Maintenance" }
    ]}
  />
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#152423] cursor-pointer">
                <input
    type="checkbox"
    checked={isAvailable}
    onChange={(e) => setIsAvailable(e.target.checked)}
  />
                <span>Open for guest reservations</span>
              </label>
            </div>
          </div>

          <ImageUpload
    label="Photos (multiple allowed)"
    images={images}
    onChange={setImages}
    multiple
    folder="cottages"
  />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create Unit"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
    open={Boolean(deleteTarget)}
    onClose={() => setDeleteTarget(null)}
    onConfirm={handleDelete}
    title="Delete unit?"
    message={`Remove ${deleteTarget?.name} permanently?`}
    confirmLabel="Delete"
  />
    </div>;
};
export {
  CottageManagement
};
