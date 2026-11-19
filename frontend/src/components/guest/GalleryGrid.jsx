import { useState } from "react";
import { Modal } from "../common/Modal";
import { SafeImage } from "../common/SafeImage";
const GalleryGrid = ({ items }) => {
  const [selected, setSelected] = useState(null);
  return <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => <button
    key={item.id}
    type="button"
    onClick={() => setSelected(item)}
    className="text-left bg-white border border-[#DCE5E3] rounded-xl overflow-hidden hover:border-[#143E3B]/40 transition-colors cursor-pointer group"
  >
            <div className="aspect-[4/3] overflow-hidden bg-[#EDF3F1]">
              <SafeImage
    src={item.imageUrl}
    fallbackTitle={item.title}
    alt={item.title}
    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
  />
            </div>
            <div className="p-4">
              <p className="text-xs text-[#5A6D6B]">{item.category}</p>
              <h3 className="mt-0.5 text-sm font-semibold text-[#152423]">{item.title}</h3>
              {item.caption && <p className="mt-1 text-xs text-[#5A6D6B] line-clamp-2">{item.caption}</p>}
            </div>
          </button>)}
      </div>

      <Modal
    open={Boolean(selected)}
    onClose={() => setSelected(null)}
    title={selected?.title || "Resort Photo"}
    subtitle={selected?.category}
    maxWidth="xl"
  >
        {selected && <div className="space-y-3">
            <SafeImage
    src={selected.imageUrl}
    alt={selected.title}
    className="w-full max-h-[65vh] object-cover rounded-lg"
  />
            {selected.caption && <p className="text-sm text-[#435654]">{selected.caption}</p>}
          </div>}
      </Modal>
    </>;
};
export {
  GalleryGrid
};
