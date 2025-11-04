import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useOpenAiGlobal } from "../use-openai-global";
import { Filter, Settings2, Droplets } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function WaterQualityBadge({ quality }) {
  const colors = {
    1: "bg-red-500",
    2: "bg-green-500",
  };
  const labels = {
    1: "Dårlig",
    2: "God",
  };
  
  return (
    <div className="flex items-center gap-1">
      <div className={`h-2 w-2 rounded-full ${colors[quality] || "bg-gray-400"}`} />
      <span className="text-xs">{labels[quality] || "Ukendt"}</span>
    </div>
  );
}

function BeachListItem({ beach, isSelected, onClick }) {
  return (
    <div
      className={
        "rounded-2xl px-3 select-none hover:bg-black/5 cursor-pointer" +
        (isSelected ? " bg-black/5" : "")
      }
    >
      <div
        className={`border-b ${
          isSelected ? "border-black/0" : "border-black/5"
        } hover:border-black/0`}
      >
        <button
          className="w-full text-left py-3 transition flex gap-3 items-center"
          onClick={onClick}
        >
          <img
            src={beach.thumbnail}
            alt={beach.name}
            className="h-16 w-16 rounded-lg object-cover flex-none"
          />
          <div className="min-w-0">
            <div className="font-medium truncate">{beach.name}</div>
            <div className="text-xs text-black/50 truncate">
              {beach.municipality}
            </div>
            <div className="text-xs mt-1 text-black/70 flex items-center gap-2">
              <WaterQualityBadge quality={beach.waterQuality} />
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" aria-hidden="true" />
                {beach.waterTemperature}°C
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ beaches, selectedId, onSelect }) {
  const [emblaRef] = useEmblaCarousel({ dragFree: true, loop: false });
  const displayMode = useOpenAiGlobal("displayMode");
  const isFullscreen = displayMode === "fullscreen";
  const scrollRef = React.useRef(null);
  const [showBottomFade, setShowBottomFade] = React.useState(false);

  const updateBottomFadeVisibility = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
    setShowBottomFade(!atBottom);
  }, []);

  React.useEffect(() => {
    updateBottomFadeVisibility();
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => updateBottomFadeVisibility();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateBottomFadeVisibility);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateBottomFadeVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beaches]);

  return (
    <>
      {/* Sidebar - shown in both fullscreen and collapsed modes */}
      <div
        className={`absolute inset-y-0 left-0 z-20 pointer-events-auto ${
          isFullscreen 
            ? "bottom-4 w-[340px] max-w-[75%]" 
            : "bottom-0 w-[280px] sm:w-[320px] max-w-[70%]"
        }`}
      >
        <div
          ref={scrollRef}
          className={`relative px-2 h-full overflow-y-auto bg-white text-black ${
            isFullscreen 
              ? "" 
              : "rounded-tr-2xl border-r border-t border-black/10"
          }`}
        >
          <div className={`flex justify-between flex-row items-center px-3 sticky bg-white top-0 text-md font-medium ${
            isFullscreen ? "py-4" : "py-3"
          }`}>
            {beaches.length} strande
            <div>
              <Settings2 className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className={isFullscreen ? "" : "pb-3"}>
            {beaches.map((beach) => (
              <BeachListItem
                key={beach.id}
                beach={beach}
                isSelected={isFullscreen && selectedId === beach.id}
                onClick={() => onSelect(beach)}
              />
            ))}
          </div>
        </div>
        <AnimatePresence>
          {showBottomFade && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-9 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="w-full h-full bg-gradient-to-t border-b border-black/50 from-black/15 to-black/0"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 25%, rgba(0,0,0,0.25) 75%, rgba(0,0,0,0) 100%)",
                  maskImage:
                    "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 25%, rgba(0,0,0,0.25) 75%, rgba(0,0,0,0) 100%)",
                }}
                aria-hidden
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

