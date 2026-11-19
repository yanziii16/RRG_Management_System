import { Link } from "react-router-dom";
import { ArrowRight, Waves, BedDouble, Tent, Umbrella, Music } from "lucide-react";
import { AccommodationCard } from "../../components/guest/AccommodationCard";
import { HeroSection } from "../../components/guest/HeroSection";
import { SafeImage } from "../../components/common/SafeImage";
import { useReservations } from "../../hooks/useReservations";
const Home = () => {
  const { accommodations, gallery, settings } = useReservations();
  const featured = [
    accommodations.find((a) => a.category === "Room"),
    accommodations.find((a) => a.category === "Cottage"),
    accommodations.find((a) => a.category === "Umbrella")
  ].filter((x) => Boolean(x));
  const displayAccommodations = featured.length >= 3 ? featured : accommodations.slice(0, 3);
  const amenityCards = [
    {
      icon: Waves,
      title: "Swimming pool",
      description: "Crystal-clear main pool with shallow steps and stone deck loungers."
    },
    {
      icon: BedDouble,
      title: "Rooms",
      description: "Air-conditioned family and couple suites with crisp linens and WiFi."
    },
    {
      icon: Tent,
      title: "Cottage",
      description: "Shaded open-air poolside pavilions built for family meals and day use."
    },
    {
      icon: Umbrella,
      title: "Umbrella",
      description: "Sun-shaded canvas loungers positioned right by the water."
    },
    {
      icon: Music,
      title: "Karaoke",
      description: "Private acoustic lounge for group sing-alongs and celebrations.",
      wide: true
    }
  ];
  return <div>
      <HeroSection
    kicker={`Welcome to ${settings.resortName}`}
    title={settings.tagline || "A place to pause. A stay to remember."}
    imageUrl={settings.heroImageUrl}
    ctaLabel="Book Now"
    ctaTo="/accommodations"
  />

      {
    /* Featured Accommodations */
  }
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#152423] tracking-tight">
              Find your kind of getaway
            </h2>
            <p className="mt-1 text-sm text-[#5A6D6B]">
              Choose from comfortable overnight suites, poolside cottages, or day-use loungers.
            </p>
          </div>
          <Link
    to="/accommodations"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#143E3B] hover:underline whitespace-nowrap shrink-0"
  >
            <span>View all accommodations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayAccommodations.map((item) => <AccommodationCard key={item.id} item={item} />)}
        </div>
      </section>

      {
    /* Resort Facilities & Amenities */
  }
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#152423] tracking-tight">
              Everything you need for an easy stay
            </h2>
            <p className="mt-1 text-sm text-[#5A6D6B]">
              Enjoy a refreshing swim and relax with our pool and poolside accommodations.
            </p>
          </div>
          <Link
    to="/facilities"
    className="text-sm font-medium text-[#143E3B] hover:underline whitespace-nowrap shrink-0"
  >
            Explore facilities
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {amenityCards.map((item) => {
    const Icon = item.icon;
    return <div
      key={item.title}
      className={`bg-white border border-[#DCE5E3] rounded-xl p-5 ${item.wide ? "sm:col-span-2 lg:col-span-4" : ""}`}
    >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EDF3F1] text-[#143E3B] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#152423]">{item.title}</h3>
                    <p className="mt-1 text-xs text-[#5A6D6B] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>;
  })}
        </div>
      </section>

      {
    /* Gallery Preview */
  }
      {gallery.length > 0 && <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#152423] tracking-tight">
                Around the resort
              </h2>
              <p className="mt-1 text-sm text-[#5A6D6B]">
                Snapshots of our pools, guest suites, and open-air cottages.
              </p>
            </div>
            <Link
    to="/gallery"
    className="text-sm font-medium text-[#143E3B] hover:underline whitespace-nowrap shrink-0"
  >
              View full gallery
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {gallery.slice(0, 3).map((g) => <Link
    key={g.id}
    to="/gallery"
    className="group bg-white border border-[#DCE5E3] rounded-xl overflow-hidden"
  >
                <div className="aspect-[4/3] overflow-hidden bg-[#EDF3F1]">
                  <SafeImage
    src={g.imageUrl}
    alt={g.title}
    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
  />
                </div>
                <div className="p-3.5">
                  <p className="text-xs text-[#5A6D6B]">{g.category}</p>
                  <p className="text-sm font-medium text-[#152423]">{g.title}</p>
                </div>
              </Link>)}
          </div>
        </section>}

      {
    /* Booking Call-to-Action Banner */
  }
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14">
        <div className="bg-[#143E3B] text-white rounded-xl px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Your next lucky star escape is waiting.
            </h2>
            <p className="mt-1.5 text-sm text-[#C3D5D1]">
              Choose your room or cottage, pick your dates or day-use session, and reserve with ease.
            </p>
          </div>
          <Link
    to="/accommodations"
    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-[#143E3B] bg-white rounded-lg hover:bg-[#F2F6F5] transition-colors whitespace-nowrap shrink-0"
  >
            Check Availability
          </Link>
        </div>
      </section>
    </div>;
};
export {
  Home
};
