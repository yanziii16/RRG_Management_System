import { useState } from "react";
import { GalleryGrid } from "../../components/guest/GalleryGrid";
import { EmptyState, Loading } from "../../components/common/Loading";
import { useReservations } from "../../hooks/useReservations";
const CATEGORIES = ["All", "Pool & Grounds", "Rooms", "Cottages", "Facilities"];
const Gallery = () => {
  const { gallery, loading } = useReservations();
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? gallery : gallery.filter((g) => g.category === activeCategory);
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-[#5A6D6B]">Photo Gallery</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#152423] tracking-tight">
            Explore Luckystar Resort
          </h1>
          <p className="mt-1 text-sm text-[#5A6D6B]">
            Click any photo to view a larger preview of our resort grounds and rooms.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 bg-[#E9F0EE] rounded-lg">
          {CATEGORIES.map((cat) => <button
    key={cat}
    type="button"
    onClick={() => setActiveCategory(cat)}
    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${activeCategory === cat ? "bg-white text-[#143E3B] shadow-sm" : "text-[#435654] hover:text-[#152423]"}`}
  >
              {cat}
            </button>)}
        </div>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <EmptyState title="No photos in this category" /> : <GalleryGrid items={filtered} />}
    </div>;
};
export {
  Gallery
};
