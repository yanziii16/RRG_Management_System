import { useState } from "react";
import { Button } from "../../components/common/Button";
import { ImageUpload } from "../../components/common/ImageUpload";
import { Input } from "../../components/common/Input";
import { SafeImage } from "../../components/common/SafeImage";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { isValidPhone, validatePassword } from "../../utils/validation";
const GuestProfile = () => {
  const { user, updateProfile } = useAuth();
  const { notify } = useNotification();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [avatarImages, setAvatarImages] = useState(
    user?.avatarUrl ? [user.avatarUrl] : []
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!name.trim() || !isValidPhone(phone)) {
      notify("Please provide a valid name and contact number.", "error");
      return;
    }
    setSavingInfo(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatarUrl: avatarImages[0] || ""
      });
      notify("Profile updated successfully.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update profile.", "error");
    } finally {
      setSavingInfo(false);
    }
  };
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) {
      notify(pwdErr, "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify("New passwords do not match.", "error");
      return;
    }
    setSavingPwd(true);
    try {
      await updateProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Password updated successfully.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unable to update password.", "error");
    } finally {
      setSavingPwd(false);
    }
  };
  return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <p className="text-xs font-medium text-[#5A6D6B]">Account Settings</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#152423] tracking-tight">
          My Profile
        </h1>
      </div>

      <form
    onSubmit={handleSaveInfo}
    className="bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-5"
  >
        <div className="flex items-center gap-4 pb-4 border-b border-[#EEF2F1]">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-[#DCE5E3] bg-[#EDF3F1] shrink-0">
            <SafeImage
    src={avatarImages[0]}
    fallbackTitle={user?.name}
    alt={user?.name}
    className="w-full h-full object-cover"
  />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#152423]">{user?.name}</h2>
            <p className="text-xs text-[#5A6D6B]">{user?.email}</p>
          </div>
        </div>

        <ImageUpload
    label="Profile picture"
    images={avatarImages}
    onChange={setAvatarImages}
    multiple={false}
    folder="avatars"
  />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
    label="Full name"
    required
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
          <Input
    label="Contact number"
    required
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
  />
          <div className="sm:col-span-2">
            <Input
    label="Address"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
  />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={savingInfo}>
            Save Profile Changes
          </Button>
        </div>
      </form>

      <form
    onSubmit={handleChangePassword}
    className="bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-4"
  >
        <h2 className="text-base font-semibold text-[#152423]">Change password</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
    label="Current password"
    type="password"
    required
    value={currentPassword}
    onChange={(e) => setCurrentPassword(e.target.value)}
  />
          <Input
    label="New password"
    type="password"
    required
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
  />
          <Input
    label="Confirm new password"
    type="password"
    required
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
  />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="outline" loading={savingPwd}>
            Update Password
          </Button>
        </div>
      </form>
    </div>;
};
export {
  GuestProfile
};
