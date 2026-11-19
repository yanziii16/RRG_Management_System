import { validateImageFile } from "../utils/validation";
import { api } from "./api";
const IDB_NAME = "luckystar_media_store";
const IDB_STORE = "uploaded_images";
function openMediaDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "url" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function cacheInIndexedDB(url, dataUrl) {
  try {
    const db = await openMediaDb();
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put({ url, dataUrl, savedAt: Date.now() });
  } catch {
  }
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
const uploadService = {
  async uploadImage(file, folder = "general", onProgress) {
    const validationErr = validateImageFile(file);
    if (validationErr) {
      throw new Error(validationErr);
    }
    onProgress?.(20);
    const dataUrl = await fileToDataUrl(file);
    onProgress?.(55);
    try {
      const { data } = await api.post("/uploads", {
        fileName: file.name,
        dataUrl,
        folder
      });
      await cacheInIndexedDB(data.url, dataUrl);
      onProgress?.(100);
      return data.url;
    } catch {
      await cacheInIndexedDB(`idb://${folder}/${file.name}_${Date.now()}`, dataUrl);
      onProgress?.(100);
      return dataUrl;
    }
  }
};
export {
  fileToDataUrl,
  uploadService
};
