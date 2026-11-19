import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, History } from "lucide-react";
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
import { guestService } from "../../services/guestService";
import { formatCurrency } from "../../utils/currencyUtils";
import { formatDateDisplay } from "../../utils/dateUtils";
import { isValidEmail, isValidPhone } from "../../utils/validation";
const GuestManagement = () => {
  const { reservations } = useReservations();
  const { notify } = useNotification();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Active");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyGuest, setHistoryGuest] = useState(null);
  const fetchGuests = async () => {
    setLoading(true);
    try {
      const list = await guestService.getUsers("GUEST");
      setGuests(list);
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to load guests."), "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchGuests();
  }, []);
  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (statusFilter !== "All" && g.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || g.phone.toLowerCase().includes(q);
      }
      return true;
    });
  }, [guests, search, statusFilter]);
  const openAdd = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setStatus("Active");
    setPassword("password123");
    setFormOpen(true);
  };
  const openEdit = (guest) => {
    setEditing(guest);
    setName(guest.name);
    setEmail(guest.email);
    setPhone(guest.phone);
    setAddress(guest.address || "");
    setStatus(guest.status);
    setPassword("");
    setFormOpen(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !isValidEmail(email) || !isValidPhone(phone)) {
      notify("Please enter valid guest name, email, and phone.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await guestService.updateUser(editing.id, {
          name,
          email,
          phone,
          address,
          status,
          role: "GUEST"
        });
        notify("Guest record updated.", "success");
      } else {
        await guestService.createUser({
          name,
          email,
          phone,
          address,
          status,
          role: "GUEST",
          password: password || "password123"
        });
        notify("Guest added.", "success");
      }
      setFormOpen(false);
      await fetchGuests();
    } catch (err) {
      notify(extractErrorMessage(err, "Could not save guest."), "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await guestService.deleteUser(deleteTarget.id);
      notify("Guest deleted.", "info");
      setDeleteTarget(null);
      await fetchGuests();
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to delete guest."), "error");
    }
  };
  const guestReservations = useMemo(() => {
    if (!historyGuest) return [];
    return reservations.filter((r) => r.guestId === historyGuest.id);
  }, [historyGuest, reservations]);
  const columns = [
    {
      key: "name",
      header: "Guest Name",
      render: (g) => <div>
          <p className="font-medium text-xs text-[#152423]">{g.name}</p>
          <p className="text-[11px] text-[#5A6D6B]">{g.address || "No address listed"}</p>
        </div>
    },
    {
      key: "contact",
      header: "Contact",
      render: (g) => <div className="text-xs">
          <p>{g.email}</p>
          <p className="text-[#5A6D6B] tabular-nums">{g.phone}</p>
        </div>
    },
    {
      key: "bookings",
      header: "Reservations",
      align: "center",
      render: (g) => <span className="text-xs font-medium tabular-nums">
          {reservations.filter((r) => r.guestId === g.id).length}
        </span>
    },
    {
      key: "status",
      header: "Status",
      render: (g) => <StatusBadge status={g.status} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (g) => <div className="inline-flex items-center gap-1.5">
          <button
        type="button"
        onClick={() => setHistoryGuest(g)}
        title="View reservation history"
        className="p-1.5 rounded-lg border border-[#DCE5E3] text-[#143E3B] hover:bg-[#EDF3F1] cursor-pointer"
      >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
        type="button"
        onClick={() => openEdit(g)}
        title="Edit guest"
        className="p-1.5 rounded-lg border border-[#DCE5E3] text-[#152423] hover:bg-[#F5F8F7] cursor-pointer"
      >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
        type="button"
        onClick={() => setDeleteTarget(g)}
        title="Delete guest"
        className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
      >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
    }
  ];
  return <div className="space-y-6">
      <AdminPageHeader
    title="Guest Management"
    subtitle="Manage registered guest profiles, contact details, and booking histories."
    action={<Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>Add Guest</span>
          </Button>}
  />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Search guest by name, email, or phone..."
    className="flex-1 max-w-md"
  />
        <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? <Loading /> : <DataTable columns={columns} data={filtered} rowKey={(g) => g.id} />}

      {
    /* Add / Edit Guest Modal */
  }
      <Modal
    open={formOpen}
    onClose={() => setFormOpen(false)}
    title={editing ? "Edit Guest Record" : "Add New Guest"}
    maxWidth="md"
  >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contact number" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
    label="Account status"
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    options={[
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" }
    ]}
  />
            {!editing && <Input
    label="Initial password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create Guest"}
            </Button>
          </div>
        </form>
      </Modal>

      {
    /* Guest Reservation History Modal */
  }
      <Modal
    open={Boolean(historyGuest)}
    onClose={() => setHistoryGuest(null)}
    title={`Reservation History — ${historyGuest?.name || ""}`}
    subtitle={historyGuest?.email}
    maxWidth="lg"
  >
        {guestReservations.length === 0 ? <p className="text-sm text-[#5A6D6B] py-4">
            This guest has not made any reservations yet.
          </p> : <div className="space-y-3">
            {guestReservations.map((r) => <div
    key={r.id}
    className="p-3.5 rounded-lg border border-[#DCE5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
  >
                <div>
                  <p className="font-mono-num font-semibold text-[#152423]">{r.referenceNumber}</p>
                  <p className="text-[#435654]">
                    {r.accommodationName} · {formatDateDisplay(r.checkInDate)}
                    {r.stayType === "overnight" ? ` to ${formatDateDisplay(r.checkOutDate)}` : ` (${r.session})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(r.totalAmount, true)}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
              </div>)}
          </div>}
      </Modal>

      <ConfirmDialog
    open={Boolean(deleteTarget)}
    onClose={() => setDeleteTarget(null)}
    onConfirm={handleDelete}
    title="Delete guest account?"
    message={`Remove ${deleteTarget?.name} from guest records?`}
    confirmLabel="Delete Guest"
  />
    </div>;
};
export {
  GuestManagement
};
