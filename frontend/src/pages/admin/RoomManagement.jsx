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
const RoomManagement = () => {
  const { accommodations, loading, refreshPublicData } = useReservations();
  const { notify } = useNotification();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [beds, setBeds] = useState("");
  const [ratePerNight, setRatePerNight] = useState("750");
  const [amenitiesText, setAmenitiesText] = useState("Air conditioning, WiFi included, Private bathroom");
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("Available");
  const [isAvailable, setIsAvailable] = useState(true);
  const rooms = useMemo(() => {
    return accommodations.filter((a) => a.category === "Room").filter((a) => !search.trim() || a.name.toLowerCase().includes(search.toLowerCase()));
  }, [accommodations, search]);
  const openAdd = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setCapacity("4");
    setBeds("2 queen beds");
    setRatePerNight("750");
    setAmenitiesText("Air conditioning, WiFi included, Private bathroom");
    setImages([]);
    setStatus("Available");
    setIsAvailable(true);
    setModalOpen(true);
  };
  const openEdit = (room) => {
    setEditing(room);
    setName(room.name);
    setDescription(room.description);
    setCapacity(String(room.capacity));
    setBeds(room.beds || "");
    setRatePerNight(String(room.ratePerNight));
    setAmenitiesText(room.amenities.join(", "));
    setImages(room.images);
    setStatus(room.status);
    setIsAvailable(room.isAvailable);
    setModalOpen(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      notify("Room name is required.", "error");
      return;
    }
    setSaving(true);
    const rate = Number(ratePerNight) || 0;
    const payload = {
      name: name.trim(),
      category: "Room",
      bookingMode: "overnight",
      description: description.trim(),
      capacity: Math.max(1, Number(capacity) || 1),
      beds: beds.trim(),
      ratePerNight: rate,
      dayUseRates: { Morning: rate, Afternoon: rate, Night: rate },
      amenities: amenitiesText.split(",").map((x) => x.trim()).filter(Boolean),
      images,
      status,
      isAvailable: isAvailable && status !== "Maintenance"
    };
    try {
      if (editing) {
        await accommodationService.update(editing.id, payload);
        notify("Room updated.", "success");
      } else {
        await accommodationService.create(payload);
        notify("Room added.", "success");
      }
      await refreshPublicData();
      setModalOpen(false);
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to save room."), "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await accommodationService.remove(deleteTarget.id);
      await refreshPublicData();
      notify("Room deleted.", "info");
      setDeleteTarget(null);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not delete room."), "error");
    }
  };
  const columns = [
    {
      key: "photo",
      header: "Room",
      render: (r) => <div className="flex items-center gap-3">
          <div className="w-14 h-10 rounded overflow-hidden bg-[#EDF3F1] shrink-0">
            <SafeImage src={r.images[0]} fallbackTitle={r.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#152423]">{r.name}</p>
            <p className="text-[11px] text-[#5A6D6B]">{r.beds || "Standard bedding"}</p>
          </div>
        </div>
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "center",
      render: (r) => <span className="text-xs">{r.capacity} guests</span>
    },
    {
      key: "rate",
      header: "Nightly Rate",
      align: "right",
      render: (r) => <span className="text-xs font-semibold">{formatCurrency(r.ratePerNight, true)}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.isAvailable ? r.status : "Unavailable"} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => <div className="inline-flex gap-1.5">
          <button
        type="button"
        onClick={() => openEdit(r)}
        className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-[#F5F8F7] cursor-pointer"
      >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
        type="button"
        onClick={() => setDeleteTarget(r)}
        className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
      >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
    }
  ];
  return <div className="space-y-6">
      <AdminPageHeader
    title="Room Management"
    subtitle="Add, edit, or remove overnight resort rooms, upload multiple photos, and configure rates."
    action={<Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>Add Room</span>
          </Button>}
  />

      <SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Search rooms..."
    className="max-w-md"
  />

      {loading ? <Loading /> : <DataTable columns={columns} data={rooms} rowKey={(r) => r.id} />}

      <Modal
    open={modalOpen}
    onClose={() => setModalOpen(false)}
    title={editing ? `Edit Room — ${editing.name}` : "Add New Room"}
    maxWidth="lg"
  >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Room name" required value={name} onChange={(e) => setName(e.target.value)} />
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
            <Input
    label="Capacity (guests)"
    type="number"
    min={1}
    required
    value={capacity}
    onChange={(e) => setCapacity(e.target.value)}
  />
            <Input label="Beds" value={beds} onChange={(e) => setBeds(e.target.value)} />
            <Input
    label="Nightly rate (PHP)"
    type="number"
    min={0}
    required
    value={ratePerNight}
    onChange={(e) => setRatePerNight(e.target.value)}
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
    label="Room photos (multiple allowed)"
    images={images}
    onChange={setImages}
    multiple
    folder="rooms"
  />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Room" : "Create Room"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
    open={Boolean(deleteTarget)}
    onClose={() => setDeleteTarget(null)}
    onConfirm={handleDelete}
    title="Delete room?"
    message={`Are you sure you want to remove ${deleteTarget?.name}?`}
    confirmLabel="Delete Room"
  />
    </div>;
};
export {
  RoomManagement
};
