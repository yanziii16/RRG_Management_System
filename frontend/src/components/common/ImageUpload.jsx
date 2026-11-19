import { useRef, useState } from "react";
import { Upload, X, RefreshCw, Image as ImageIcon } from "lucide-react";
import { uploadService } from "../../services/uploadService";
import { SafeImage } from "./SafeImage";
const ImageUpload = ({
  label = "Upload Images",
  images,
  onChange,
  multiple = true,
  folder = "general",
  helperText = "Supports JPG, JPEG, PNG, and WEBP up to 5 MB."
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const handleFiles = async (fileList, replaceIndex) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);
    setProgress(10);
    try {
      const files = Array.from(fileList);
      const uploadedUrls = [];
      for (const file of files) {
        const url = await uploadService.uploadImage(file, folder, (pct) => setProgress(pct));
        uploadedUrls.push(url);
      }
      if (typeof replaceIndex === "number") {
        const next = [...images];
        next[replaceIndex] = uploadedUrls[0];
        onChange(next);
      } else if (multiple) {
        onChange([...images, ...uploadedUrls]);
      } else {
        onChange([uploadedUrls[0]]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };
  return <div className="space-y-2.5">
      {label && <label className="block text-xs font-medium text-[#2A3B39]">{label}</label>}

      <div
    onDragOver={(e) => {
      e.preventDefault();
      setDragging(true);
    }}
    onDragLeave={() => setDragging(false)}
    onDrop={(e) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    }}
    onClick={() => inputRef.current?.click()}
    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${dragging ? "border-[#143E3B] bg-[#EDF3F1]" : "border-[#CEDAD7] bg-[#F8FBFA] hover:border-[#143E3B]"}`}
  >
        <input
    ref={inputRef}
    type="file"
    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
    multiple={multiple}
    className="hidden"
    onChange={(e) => handleFiles(e.target.files)}
  />
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-9 h-9 rounded-lg bg-[#E4ECEA] text-[#143E3B] flex items-center justify-center">
            <Upload className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-[#152423]">
            {uploading ? `Uploading... ${progress}%` : "Drag and drop images here, or browse files"}
          </p>
          <p className="text-xs text-[#5A6D6B]">{helperText}</p>
        </div>
        {uploading && <div className="mt-3 w-full max-w-xs mx-auto h-1.5 bg-[#DCE5E3] rounded-full overflow-hidden">
            <div
    className="h-full bg-[#143E3B] transition-all duration-150"
    style={{ width: `${progress}%` }}
  />
          </div>}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {images.length > 0 ? <div className={`grid gap-3 ${multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 max-w-xs"}`}>
          {images.map((url, idx) => <div
    key={`${url}-${idx}`}
    className="relative group rounded-lg border border-[#DCE5E3] overflow-hidden bg-white"
  >
              <SafeImage
    src={url}
    alt={`Uploaded preview ${idx + 1}`}
    className="w-full h-28 object-cover"
  />
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                <label
    title="Replace image"
    onClick={(e) => e.stopPropagation()}
    className="p-1.5 rounded bg-white/95 text-[#152423] shadow-sm hover:bg-white cursor-pointer"
  >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <input
    type="file"
    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
    className="hidden"
    onChange={(e) => handleFiles(e.target.files, idx)}
  />
                </label>
                <button
    type="button"
    onClick={() => removeImage(idx)}
    title="Remove image"
    className="p-1.5 rounded bg-white/95 text-red-700 shadow-sm hover:bg-white"
  >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>)}
        </div> : <div className="flex items-center gap-2 text-xs text-[#5A6D6B]">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>No image selected yet.</span>
        </div>}
    </div>;
};
export {
  ImageUpload
};
