import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Button } from "../../components/common/Button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { ImageUpload } from "../../components/common/ImageUpload";
import { Input } from "../../components/common/Input";
import { Loading } from "../../components/common/Loading";
import { Modal } from "../../components/common/Modal";
import { SafeImage } from "../../components/common/SafeImage";
import { Select } from "../../components/common/Select";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useNotification } from "../../context/NotificationContext";
import { useReservations } from "../../hooks/useReservations";
import { accommodationService } from "../../services/accommodationService";
import { extractErrorMessage } from "../../services/api";
const FacilityManagement = () => {
  const { facilities, gallery, loading, refreshPublicData } = useReservations();
  const { notify } = useNotification();
  const [tab, setTab] = useState("facilities");
  const [facOpen, setFacOpen] = useState(false);
  const [editingFac, setEditingFac] = useState(null);
  const [facName, setFacName] = useState("");
  const [facCat, setFacCat] = useState("Aquatics");
  const [facDesc, setFacDesc] = useState("");
  const [facHours, setFacHours] = useState("7:00 AM - 10:00 PM");
  const [facRateNote, setFacRateNote] = useState("");
  const [facImages, setFacImages] = useState([]);
  const [facAvailable, setFacAvailable] = useState(true);
  const [savingFac, setSavingFac] = useState(false);
  const [galOpen, setGalOpen] = useState(false);
  const [galTitle, setGalTitle] = useState("");
  const [galCat, setGalCat] = useState("Pool & Grounds");
  const [galCaption, setGalCaption] = useState("");
  const [galImages, setGalImages] = useState([]);
  const [savingGal, setSavingGal] = useState(false);
  const [deleteFac, setDeleteFac] = useState(null);
  const [deleteGal, setDeleteGal] = useState(null);
  const openAddFac = () => {
    setEditingFac(null);
    setFacName("");
    setFacCat("Aquatics");
    setFacDesc("");
    setFacHours("7:00 AM - 10:00 PM");
    setFacRateNote("Included with resort booking");
    setFacImages([]);
    setFacAvailable(true);
    setFacOpen(true);
  };
  const openEditFac = (f) => {
    setEditingFac(f);
    setFacName(f.name);
    setFacCat(f.category);
    setFacDesc(f.description);
    setFacHours(f.operatingHours);
    setFacRateNote(f.rateNote || "");
    setFacImages(f.images);
    setFacAvailable(f.isAvailable);
    setFacOpen(true);
  };
  const saveFacility = async (e) => {
    e.preventDefault();
    setSavingFac(true);
    try {
      const payload = {
        name: facName.trim(),
        category: facCat,
        description: facDesc.trim(),
        operatingHours: facHours.trim(),
        rateNote: facRateNote.trim(),
        images: facImages,
        isAvailable: facAvailable
      };
      if (editingFac) {
        await accommodationService.updateFacility(editingFac.id, payload);
        notify("Facility updated.", "success");
      } else {
        await accommodationService.createFacility(payload);
        notify("Facility added.", "success");
      }
      await refreshPublicData();
      setFacOpen(false);
    } catch (err) {
      notify(extractErrorMessage(err, "Could not save facility."), "error");
    } finally {
      setSavingFac(false);
    }
  };
  const saveGalleryPhoto = async (e) => {
    e.preventDefault();
    if (galImages.length === 0) {
      notify("Please upload an image.", "error");
      return;
    }
    setSavingGal(true);
    try {
      await accommodationService.addGalleryItem({
        title: galTitle.trim() || "Resort Photo",
        category: galCat,
        caption: galCaption.trim(),
        imageUrl: galImages[0]
      });
      await refreshPublicData();
      setGalOpen(false);
      setGalTitle("");
      setGalCaption("");
      setGalImages([]);
      notify("Photo added to gallery.", "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to add photo."), "error");
    } finally {
      setSavingGal(false);
    }
  };
  return <div className="space-y-6">
      <AdminPageHeader
    title="Facility & Gallery Management"
    subtitle="Manage resort facilities, operating hours, and public gallery photos."
    action={tab === "facilities" ? <Button onClick={openAddFac}>
              <Plus className="w-4 h-4" />
              <span>Add Facility</span>
            </Button> : <Button onClick={() => setGalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Add Gallery Photo</span>
            </Button>}
  />

      <div className="flex gap-1.5 p-1 bg-[#E9F0EE] rounded-lg w-fit">
        <button
    type="button"
    onClick={() => setTab("facilities")}
    className={`px-4 py-1.5 text-xs font-medium rounded-md cursor-pointer ${tab === "facilities" ? "bg-white text-[#143E3B] shadow-sm" : "text-[#435654]"}`}
  >
          Facilities ({facilities.length})
        </button>
        <button
    type="button"
    onClick={() => setTab("gallery")}
    className={`px-4 py-1.5 text-xs font-medium rounded-md cursor-pointer ${tab === "gallery" ? "bg-white text-[#143E3B] shadow-sm" : "text-[#435654]"}`}
  >
          Gallery ({gallery.length})
        </button>
      </div>

      {loading ? <Loading /> : tab === "facilities" ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((fac) => <div key={fac.id} className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[16/10] bg-[#EDF3F1]">
                <SafeImage src={fac.images[0]} fallbackTitle={fac.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#5A6D6B]">{fac.category}</span>
                  <StatusBadge status={fac.isAvailable ? "Available" : "Unavailable"} />
                </div>
                <h3 className="mt-1.5 text-sm font-semibold text-[#152423]">{fac.name}</h3>
                <p className="mt-1 text-xs text-[#5A6D6B] line-clamp-2 flex-1">{fac.description}</p>
                <p className="mt-2 text-xs text-[#435654] tabular-nums">{fac.operatingHours}</p>
                <div className="mt-4 pt-3 border-t border-[#EEF2F1] flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEditFac(fac)}>
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button
    type="button"
    size="sm"
    variant="outline"
    className="text-red-700 border-red-200 hover:bg-red-50"
    onClick={() => setDeleteFac(fac)}
  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>)}
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gallery.map((g) => <div key={g.id} className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-[#EDF3F1]">
                <SafeImage src={g.imageUrl} fallbackTitle={g.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#5A6D6B]">{g.category}</p>
                  <p className="text-sm font-semibold text-[#152423]">{g.title}</p>
                </div>
                <button
    type="button"
    onClick={() => setDeleteGal(g)}
    className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
  >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>)}
        </div>}

      {
    /* Facility Modal */
  }
      <Modal
    open={facOpen}
    onClose={() => setFacOpen(false)}
    title={editingFac ? "Edit Facility" : "Add Facility"}
    maxWidth="lg"
  >
        <form onSubmit={saveFacility} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Facility name" required value={facName} onChange={(e) => setFacName(e.target.value)} />
            <Input label="Category" required value={facCat} onChange={(e) => setFacCat(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2A3B39] mb-1.5">Description</label>
            <textarea
    rows={3}
    required
    value={facDesc}
    onChange={(e) => setFacDesc(e.target.value)}
    className="w-full px-3 py-2 text-sm border border-[#DCE5E3] rounded-lg"
  />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Operating hours" value={facHours} onChange={(e) => setFacHours(e.target.value)} />
            <Input label="Rate / access note" value={facRateNote} onChange={(e) => setFacRateNote(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={facAvailable} onChange={(e) => setFacAvailable(e.target.checked)} />
            <span>Facility is open and available</span>
          </label>
          <ImageUpload label="Facility photo" images={facImages} onChange={setFacImages} multiple={false} folder="facilities" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setFacOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingFac}>
              Save Facility
            </Button>
          </div>
        </form>
      </Modal>

      {
    /* Gallery Modal */
  }
      <Modal
    open={galOpen}
    onClose={() => setGalOpen(false)}
    title="Add Gallery Photo"
    maxWidth="md"
  >
        <form onSubmit={saveGalleryPhoto} className="space-y-4">
          <Input label="Photo title" required value={galTitle} onChange={(e) => setGalTitle(e.target.value)} />
          <Select
    label="Category"
    value={galCat}
    onChange={(e) => setGalCat(e.target.value)}
    options={[
      { value: "Pool & Grounds", label: "Pool & Grounds" },
      { value: "Rooms", label: "Rooms" },
      { value: "Cottages", label: "Cottages" },
      { value: "Facilities", label: "Facilities" }
    ]}
  />
          <Input label="Caption" value={galCaption} onChange={(e) => setGalCaption(e.target.value)} />
          <ImageUpload label="Upload photo" images={galImages} onChange={setGalImages} multiple={false} folder="gallery" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setGalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingGal}>
              Add to Gallery
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
    open={Boolean(deleteFac)}
    onClose={() => setDeleteFac(null)}
    onConfirm={async () => {
      if (!deleteFac) return;
      await accommodationService.deleteFacility(deleteFac.id);
      await refreshPublicData();
      setDeleteFac(null);
      notify("Facility deleted.", "info");
    }}
    title="Delete facility?"
    message={`Remove ${deleteFac?.name}?`}
  />

      <ConfirmDialog
    open={Boolean(deleteGal)}
    onClose={() => setDeleteGal(null)}
    onConfirm={async () => {
      if (!deleteGal) return;
      await accommodationService.deleteGalleryItem(deleteGal.id);
      await refreshPublicData();
      setDeleteGal(null);
      notify("Gallery photo removed.", "info");
    }}
    title="Remove photo?"
    message={`Remove ${deleteGal?.title} from the resort gallery?`}
  />
    </div>;
};
export {
  FacilityManagement
};
