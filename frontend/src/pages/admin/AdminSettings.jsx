import { useEffect, useState } from "react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Button } from "../../components/common/Button";
import { ImageUpload } from "../../components/common/ImageUpload";
import { Input } from "../../components/common/Input";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { useReservations } from "../../hooks/useReservations";
import { extractErrorMessage } from "../../services/api";
import { settingsService } from "../../services/settingsService";
const AdminSettings = () => {
  const { settings, refreshPublicData } = useReservations();
  const { user, updateProfile } = useAuth();
  const { notify } = useNotification();
  const [form, setForm] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [adminName, setAdminName] = useState(user?.name || "");
  const [adminPhone, setAdminPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  useEffect(() => {
    setForm(settings);
  }, [settings]);
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await settingsService.update(form);
      await refreshPublicData();
      notify("Resort settings saved and synchronized.", "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to save settings."), "error");
    } finally {
      setSavingSettings(false);
    }
  };
  const handleSaveAdminAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      await updateProfile({
        name: adminName,
        phone: adminPhone,
        ...newPassword ? { currentPassword, newPassword } : {}
      });
      setCurrentPassword("");
      setNewPassword("");
      notify("Admin account updated.", "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Could not update account."), "error");
    } finally {
      setSavingAccount(false);
    }
  };
  return <div className="space-y-8">
      <AdminPageHeader
    title="Admin Settings"
    subtitle="Configure resort branding, contact details, check-in rules, bank channels, and administrator account preferences."
  />

      <form
    onSubmit={handleSaveSettings}
    className="bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-6"
  >
        <h2 className="text-base font-semibold text-[#152423]">Resort Information & Branding</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
    label="Resort Name"
    required
    value={form.resortName}
    onChange={(e) => setForm({ ...form, resortName: e.target.value })}
  />
          <Input
    label="Tagline"
    value={form.tagline}
    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
  />
          <Input
    label="Contact Phone"
    value={form.phone}
    onChange={(e) => setForm({ ...form, phone: e.target.value })}
  />
          <Input
    label="Contact Email"
    type="email"
    value={form.email}
    onChange={(e) => setForm({ ...form, email: e.target.value })}
  />
          <div className="sm:col-span-2">
            <Input
    label="Resort Address"
    value={form.address}
    onChange={(e) => setForm({ ...form, address: e.target.value })}
  />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">
              Resort Description
            </label>
            <textarea
    rows={3}
    value={form.description}
    onChange={(e) => setForm({ ...form, description: e.target.value })}
    className="w-full px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg"
  />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#EEF2F1]">
          <ImageUpload
    label="Resort Logo (optional)"
    images={form.logoUrl ? [form.logoUrl] : []}
    onChange={(imgs) => setForm({ ...form, logoUrl: imgs[0] || "" })}
    multiple={false}
    folder="branding"
  />
          <ImageUpload
    label="Hero Banner Image"
    images={form.heroImageUrl ? [form.heroImageUrl] : []}
    onChange={(imgs) => setForm({ ...form, heroImageUrl: imgs[0] || "" })}
    multiple={false}
    folder="branding"
  />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#EEF2F1]">
          <Input
    label="Check-in Time"
    value={form.checkInTime}
    onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
  />
          <Input
    label="Check-out Time"
    value={form.checkOutTime}
    onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
  />
          <Input
    label="GCash Number"
    value={form.bankDetails.gcashNumber}
    onChange={(e) => setForm({
      ...form,
      bankDetails: { ...form.bankDetails, gcashNumber: e.target.value }
    })}
  />
          <Input
    label="Bank Account Number"
    value={form.bankDetails.bankAccountNumber}
    onChange={(e) => setForm({
      ...form,
      bankDetails: { ...form.bankDetails, bankAccountNumber: e.target.value }
    })}
  />
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={savingSettings}>
            Save Resort Settings
          </Button>
        </div>
      </form>

      <form
    onSubmit={handleSaveAdminAccount}
    className="bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-4"
  >
        <h2 className="text-base font-semibold text-[#152423]">Admin Account Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
    label="Administrator Name"
    required
    value={adminName}
    onChange={(e) => setAdminName(e.target.value)}
  />
          <Input
    label="Contact Number"
    required
    value={adminPhone}
    onChange={(e) => setAdminPhone(e.target.value)}
  />
          <Input
    label="Current Password (only if changing password)"
    type="password"
    value={currentPassword}
    onChange={(e) => setCurrentPassword(e.target.value)}
  />
          <Input
    label="New Password"
    type="password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
  />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="outline" loading={savingAccount}>
            Update Admin Account
          </Button>
        </div>
      </form>
    </div>;
};
export {
  AdminSettings
};
