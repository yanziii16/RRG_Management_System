
import { useState, useEffect } from "react";
import { Palmtree } from "lucide-react";

const SafeImage = ({
  src,
  alt,
  className = "",
  fallbackTitle,
  ...props
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#DCE8E5] to-[#C6D9D4] text-[#143E3B] p-4 ${className}`}
        role="img"
        aria-label={alt || fallbackTitle || "Resort accommodation"}
      >
        <Palmtree className="w-7 h-7 opacity-70 mb-1.5" />
        <span className="text-xs font-medium text-center opacity-80">
          {fallbackTitle || alt || "Luckystar Resort"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || fallbackTitle || "Luckystar Resort"}
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  );
};

export { SafeImage };
