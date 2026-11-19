import { Link } from "react-router-dom";
import { SafeImage } from "../common/SafeImage";
const HeroSection = ({
  title,
  kicker = "Welcome to Luckystar Resort",
  imageUrl,
  ctaLabel = "Book Now",
  ctaTo = "/accommodations"
}) => {
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
      <div className="rounded-xl overflow-hidden border border-[#DCE5E3] bg-white">
        <div className="aspect-[16/7] min-h-[260px] max-h-[520px] w-full overflow-hidden">
          <SafeImage
    src={imageUrl}
    alt="Luckystar Resort main swimming pool and guest suites"
    className="w-full h-full object-cover"
  />
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#5A6D6B]">{kicker}</p>
          <h1
    className="mt-1 text-2xl sm:text-4xl font-semibold text-[#152423] tracking-tight"
    style={{ textWrap: "balance" }}
  >
            {title}
          </h1>
        </div>
        <Link
    to={ctaTo}
    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B] transition-colors whitespace-nowrap shrink-0"
  >
          {ctaLabel}
        </Link>
      </div>
    </section>;
};
export {
  HeroSection
};
