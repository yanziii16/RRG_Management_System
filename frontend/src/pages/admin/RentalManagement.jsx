import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Button } from "../../components/common/Button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";
import { Input } from "../../components/common/Input";
import { Loading } from "../../components/common/Loading";
import { Modal } from "../../components/common/Modal";
import { SearchBar } from "../../components/common/SearchBar";
import { Select } from "../../components/common/Select";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useNotification } from "../../context/NotificationContext";
import { useReservations } from "../../hooks/useReservations";
import { extractErrorMessage } from "../../services/api";
import { rentalService } from "../../services/rentalService";
import { formatPesoExact } from "../../utils/currencyUtils";
const RentalManagement = () => {
  const { rentals, loading, refreshPublicData } = useReservations();
  const { notify } = useNotification();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Pool Gear");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("50");
  const [stockQuantity, setStockQuantity] = useState("10");
  const [availableQuantity, setAvailableQuantity] = useState("10");
  const [unitLabel, setUnitLabel] = useState("per day");
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => {
    if (!search.trim()) return rentals;
    const q = search.toLowerCase();
    return rentals.filter(
      (r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [rentals, search]);
  const openAdd = () => {
    setEditing(null);
    setName("");
    setCategory("Pool Gear");
    setDescription("");
    setPrice("80");
    setStockQuantity("15");
    setAvailableQuantity("15");
    setUnitLabel("per day");
    setIsAvailable(true);
    setModalOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setPrice(String(item.price));
    setStockQuantity(String(item.stockQuantity));
    setAvailableQuantity(String(item.availableQuantity));
    setUnitLabel(item.unitLabel);
    setIsAvailable(item.isAvailable);
    setModalOpen(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: name.trim(),
      category,
      description: description.trim(),
      price: Number(price) || 0,
      stockQuantity: Math.max(0, Number(stockQuantity) || 0),
      availableQuantity: Math.max(0, Number(availableQuantity) || 0),
      unitLabel: unitLabel.trim() || "per day",
      isAvailable
    };
    try {
      if (editing) {
        await rentalService.update(editing.id, payload);
        notify("Rental item updated.", "success");
      } else {
        await rentalService.create(payload);
        notify("Rental item added.", "success");
      }
      await refreshPublicData();
      setModalOpen(false);
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to save rental item."), "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await rentalService.remove(deleteTarget.id);
      await refreshPublicData();
      notify("Rental item deleted.", "info");
      setDeleteTarget(null);
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to delete item."), "error");
    }
  };
  const columns = [
    {
      key: "name",
      header: "Rental Item",
      render: (r) => <div>
          <p className="text-xs font-semibold text-[#152423]">{r.name}</p>
          <p className="text-[11px] text-[#5A6D6B]">{r.description || r.category}</p>
        </div>
    },
    {
      key: "category",
      header: "Category",
      render: (r) => <span className="text-xs">{r.category}</span>
    },
    {
      key: "price",
      header: "Rate",
      align: "right",
      render: (r) => <span className="text-xs font-semibold tabular-nums">
          {formatPesoExact(r.price)} <span className="font-normal text-[#5A6D6B]">{r.unitLabel}</span>
        </span>
    },
    {
      key: "stock",
      header: "Available / Stock",
      align: "center",
      render: (r) => <span className="text-xs tabular-nums">
          {r.availableQuantity} / {r.stockQuantity}
        </span>
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.isAvailable ? "Available" : "Unavailable"} />
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
    title="Rental Management"
    subtitle="Manage pool floaters, extra towels, pillows, grill sets, and available stock quantities."
    action={<Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>Add Rental Item</span>
          </Button>}
  />

      <SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Search rental items..."
    className="max-w-md"
  />

      {loading ? <Loading /> : <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />}

      <Modal
    open={modalOpen}
    onClose={() => setModalOpen(false)}
    title={editing ? `Edit Rental — ${editing.name}` : "Add Rental Item"}
    maxWidth="md"
  >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Item name" required value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
    label="Category"
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    options={[
      { value: "Pool Gear", label: "Pool Gear" },
      { value: "Linen & Towels", label: "Linen & Towels" },
      { value: "Recreation", label: "Recreation" },
      { value: "Equipment", label: "Equipment" }
    ]}
  />
            <Input
    label="Billing unit"
    value={unitLabel}
    onChange={(e) => setUnitLabel(e.target.value)}
    placeholder="per day / per stay"
  />
          </div>
          <Input
    label="Description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
    label="Rental price (PHP)"
    type="number"
    min={0}
    required
    value={price}
    onChange={(e) => setPrice(e.target.value)}
  />
            <Input
    label="Total stock"
    type="number"
    min={0}
    required
    value={stockQuantity}
    onChange={(e) => setStockQuantity(e.target.value)}
  />
            <Input
    label="Available qty"
    type="number"
    min={0}
    required
    value={availableQuantity}
    onChange={(e) => setAvailableQuantity(e.target.value)}
  />
          </div>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
    type="checkbox"
    checked={isAvailable}
    onChange={(e) => setIsAvailable(e.target.checked)}
  />
            <span>Available for guest booking add-ons</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Rental
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
    open={Boolean(deleteTarget)}
    onClose={() => setDeleteTarget(null)}
    onConfirm={handleDelete}
    title="Delete rental item?"
    message={`Remove ${deleteTarget?.name} from rentals inventory?`}
  />
    </div>;
};
export {
  RentalManagement
};
