import { useEffect, useMemo, useState } from "react";
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
import { extractErrorMessage } from "../../services/api";
import { guestService } from "../../services/guestService";
import { formatDateDisplay } from "../../utils/dateUtils";
import { isValidEmail, isValidPhone } from "../../utils/validation";
const UserManagement = () => {
  const { notify } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("GUEST");
  const [status, setStatus] = useState("Active");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await guestService.getUsers();
      setUsers(list);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not load users."), "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadUsers();
  }, []);
  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, roleFilter, search]);
  const openAdd = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPhone("");
    setRole("ADMIN");
    setStatus("Active");
    setPassword("password123");
    setModalOpen(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role === "ADMIN" ? "ADMIN" : "GUEST");
    setStatus(u.status);
    setPassword("");
    setModalOpen(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !isValidEmail(email) || !isValidPhone(phone)) {
      notify("Please provide valid name, email, and phone.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await guestService.updateUser(editing.id, {
          name,
          email,
          phone,
          role,
          status,
          ...password ? { password } : {}
        });
        notify("User account updated.", "success");
      } else {
        await guestService.createUser({
          name,
          email,
          phone,
          role,
          status,
          password: password || "password123"
        });
        notify("User account created.", "success");
      }
      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to save user."), "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await guestService.deleteUser(deleteTarget.id);
      notify("User removed.", "info");
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      notify(extractErrorMessage(err, "Could not delete user."), "error");
    }
  };
  const columns = [
    {
      key: "name",
      header: "Account Holder",
      render: (u) => <div className="text-xs">
          <p className="font-semibold text-[#152423]">{u.name}</p>
          <p className="text-[#5A6D6B]">{u.email}</p>
        </div>
    },
    {
      key: "phone",
      header: "Contact",
      render: (u) => <span className="text-xs tabular-nums">{u.phone}</span>
    },
    {
      key: "role",
      header: "Role",
      render: (u) => <span className="text-xs font-semibold text-[#143E3B]">
          {u.role === "ADMIN" ? "Administrator" : "Guest"}
        </span>
    },
    {
      key: "created",
      header: "Registered",
      render: (u) => <span className="text-xs tabular-nums">{formatDateDisplay(u.createdAt)}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge status={u.status} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => <div className="inline-flex gap-1.5">
          <button
        type="button"
        onClick={() => openEdit(u)}
        className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-[#F5F8F7] cursor-pointer"
      >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
        type="button"
        onClick={() => setDeleteTarget(u)}
        className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
      >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
    }
  ];
  return <div className="space-y-6">
      <AdminPageHeader
    title="User Management"
    subtitle="Manage registered Guest accounts and authorized Admin accounts. Only Admin and Guest roles exist in this system."
    action={<Button onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </Button>}
  />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Search user by name or email..."
    className="flex-1 max-w-md"
  />
        <select
    value={roleFilter}
    onChange={(e) => setRoleFilter(e.target.value)}
    className="min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
          <option value="ALL">All roles (Admin & Guest)</option>
          <option value="ADMIN">Admin</option>
          <option value="GUEST">Guest</option>
        </select>
      </div>

      {loading ? <Loading /> : <DataTable columns={columns} data={filtered} rowKey={(u) => u.id} />}

      <Modal
    open={modalOpen}
    onClose={() => setModalOpen(false)}
    title={editing ? `Edit Account — ${editing.name}` : "Create Account"}
    maxWidth="md"
  >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contact number" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
    label="User Role"
    value={role}
    onChange={(e) => setRole(e.target.value)}
    options={[
      { value: "GUEST", label: "Guest" },
      { value: "ADMIN", label: "Admin" }
    ]}
  />
            <Select
    label="Account Status"
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    options={[
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" }
    ]}
  />
          </div>
          <Input
    label={editing ? "New password (leave blank to keep current)" : "Password"}
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
    open={Boolean(deleteTarget)}
    onClose={() => setDeleteTarget(null)}
    onConfirm={handleDelete}
    title="Delete user account?"
    message={`Remove ${deleteTarget?.name} (${deleteTarget?.role})?`}
  />
    </div>;
};
export {
  UserManagement
};
