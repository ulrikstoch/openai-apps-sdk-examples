import React, { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useOpenAiGlobal } from "../use-openai-global";
import { Settings2, Droplets, Wind, Thermometer, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink, Calendar } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function WaterQualityBadge({ quality, size = "default" }) {
  const colors = {
    1: "bg-red-600 text-white",
    2: "bg-green-600 text-white",
  };
  const labels = {
    1: "Dårlig kvalitet",
    2: "God kvalitet",
  };
  
  const sizeClasses = size === "large" 
    ? "px-4 py-2 text-base font-semibold" 
    : size === "medium"
    ? "px-3 py-1.5 text-sm font-medium"
    : "px-2 py-1 text-xs";
  
  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${colors[quality] || "bg-gray-500 text-white"} ${sizeClasses}`}>
      <div className={`rounded-full bg-white ${size === "large" ? "h-2.5 w-2.5" : "h-2 w-2"}`} />
      <span>{labels[quality] || "Ukendt"}</span>
    </div>
  );
}

function BeachListItem({ beach, isSelected, onClick }) {
  return (
    <div
      className={
        "rounded-xl px-3 select-none hover:bg-black/5 cursor-pointer transition-colors" +
        (isSelected ? " bg-black/5" : "")
      }
    >
      <div
        className={`border-b ${
          isSelected ? "border-black/0" : "border-black/5"
        } hover:border-black/0`}
      >
        <button
          className="w-full text-left py-3 transition flex gap-3 items-center justify-between"
          onClick={onClick}
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{beach.name}</div>
            <div className="text-xs text-black/50 truncate mb-1">
              {beach.municipality}
            </div>
            <div className="flex items-center gap-3 text-xs text-black/70">
              <span className="flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                {beach.waterTemperature}°C
              </span>
              <span className="flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                {beach.windSpeed} m/s
              </span>
            </div>
          </div>
          <div className="flex-none ml-2">
            <WaterQualityBadge quality={beach.waterQuality} />
          </div>
        </button>
      </div>
    </div>
  );
}

function BeachDetailView({ beach, onBack }) {
  const [showFullForecast, setShowFullForecast] = useState(false);
  const hasWarning = beach.comments && beach.comments.toLowerCase().includes("badeforbud");
  const forecast = beach.forecast || [];
  const displayedForecast = showFullForecast ? forecast : forecast.slice(0, 3);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header with back button */}
      <div className="sticky top-0 bg-white z-10 border-b border-black/5 px-3 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-black hover:text-black/70 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Tilbage</span>
        </button>
      </div>

      <div className="p-4">
        {/* Beach name and location */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-black mb-1">{beach.name}</h2>
          <p className="text-sm text-black/60">{beach.municipality}</p>
        </div>

        {/* Water Quality - Prominent Display */}
        <div className="mb-4">
          <WaterQualityBadge quality={beach.waterQuality} size="large" />
        </div>

        {/* Warning if exists */}
        {hasWarning && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-none mt-0.5" />
            <div>
              <div className="font-semibold text-red-900 text-sm">Advarsel</div>
              <div className="text-sm text-red-800 mt-0.5">{beach.comments}</div>
            </div>
          </div>
        )}

        {/* Current Conditions - Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-blue-800 mb-1">
              <Droplets className="h-4 w-4" />
              <span className="text-xs font-medium">Vandtemperatur</span>
            </div>
            <div className="text-2xl font-bold text-blue-950">{beach.waterTemperature}°C</div>
          </div>
          
          <div className="bg-orange-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-orange-800 mb-1">
              <Thermometer className="h-4 w-4" />
              <span className="text-xs font-medium">Lufttemperatur</span>
            </div>
            <div className="text-2xl font-bold text-orange-950">{beach.airTemperature}°C</div>
          </div>
          
          <div className="bg-gray-100 rounded-xl p-3 col-span-2">
            <div className="flex items-center gap-2 text-gray-800 mb-1">
              <Wind className="h-4 w-4" />
              <span className="text-xs font-medium">Vindhastighed</span>
            </div>
            <div className="text-2xl font-bold text-gray-950">{beach.windSpeed} m/s</div>
          </div>
        </div>

        {/* Description */}
        {beach.description && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-black mb-2">Beskrivelse</h3>
            <p className="text-sm text-black/70">{beach.description}</p>
          </div>
        )}

        {/* Facilities */}
        {beach.facilities && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-black mb-2">Faciliteter</h3>
            <p className="text-sm text-black/70">{beach.facilities}</p>
          </div>
        )}

        {/* Forecast */}
        {forecast.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-black">Prognose</h3>
              </div>
              {forecast.length > 3 && (
                <button
                  onClick={() => setShowFullForecast(!showFullForecast)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showFullForecast ? "Vis mindre" : `Vis alle ${forecast.length}`}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {displayedForecast.map((day, idx) => {
                const date = new Date(day.date);
                const dayName = idx === 0 ? "I dag" : date.toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" });
                const quality = parseInt(day.water_quality);
                
                return (
                  <div key={day.date} className={`p-2 rounded-lg ${idx === 0 ? "bg-blue-100" : "bg-gray-100"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-black/70">{dayName}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-blue-600" />
                          {day.water_temperature}°C
                        </span>
                        <span className="flex items-center gap-1">
                          <Wind className="h-3 w-3 text-gray-600" />
                          {day.wind_speed} m/s
                        </span>
                        <div className={`h-2 w-2 rounded-full ${quality === 2 ? "bg-green-600" : "bg-red-600"}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Link */}
        {beach.links && beach.links.length > 0 && beach.links[0] && (
          <a
            href={beach.links[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <span>Læs mere på kommunens hjemmeside</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// Mobile floating card component
function MobileBeachCard({ beach, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-xl ring-1 ring-black/10 p-4 min-w-[280px] max-w-[320px] cursor-pointer hover:shadow-2xl transition-shadow"
    >
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className="font-semibold text-base text-black truncate">{beach.name}</h3>
          <ChevronRight className="h-5 w-5 text-black/40 flex-none" />
        </div>
        <p className="text-xs text-black/50 mb-2 truncate">{beach.municipality}</p>
        <WaterQualityBadge quality={beach.waterQuality} size="medium" />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-blue-100 rounded-lg">
          <Droplets className="h-4 w-4 text-blue-600 mx-auto mb-1" />
          <div className="text-sm font-semibold text-blue-800">{beach.waterTemperature}°C</div>
          <div className="text-xs text-black/50">Vand</div>
        </div>
        <div className="text-center p-2 bg-orange-100 rounded-lg">
          <Thermometer className="h-4 w-4 text-orange-600 mx-auto mb-1" />
          <div className="text-sm font-semibold text-orange-800">{beach.airTemperature}°C</div>
          <div className="text-xs text-black/50">Luft</div>
        </div>
        <div className="text-center p-2 bg-gray-100 rounded-lg">
          <Wind className="h-4 w-4 text-gray-600 mx-auto mb-1" />
          <div className="text-sm font-semibold text-gray-800">{beach.windSpeed}</div>
          <div className="text-xs text-black/50">m/s</div>
        </div>
      </div>
    </div>
  );
}

// Mobile modal component
function MobileBeachModal({ beach, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl"
      >
        <BeachDetailView beach={beach} onBack={onClose} />
      </motion.div>
    </motion.div>
  );
}

export default function Sidebar({ beaches, selectedId, onSelect }) {
  const [emblaRef] = useEmblaCarousel({ dragFree: true, loop: false });
  const displayMode = useOpenAiGlobal("displayMode");
  const isFullscreen = displayMode === "fullscreen";
  const [viewingBeach, setViewingBeach] = useState(null);
  const scrollRef = React.useRef(null);
  const [showBottomFade, setShowBottomFade] = React.useState(false);
  
  const selectedBeach = beaches.find(b => b.id === selectedId);
  
  // On mobile, use modal; on desktop use internal detail view
  const isMobile = !isFullscreen;

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

  const handleBeachClick = (beach) => {
    if (isMobile) {
      // Mobile: open modal
      setViewingBeach(beach);
    } else {
      // Desktop: show detail in sidebar
      setViewingBeach(beach);
    }
    onSelect(beach);
  };

  const handleBack = () => {
    setViewingBeach(null);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="absolute inset-y-0 bottom-4 left-0 z-20 w-[340px] max-w-[75%] pointer-events-auto">
          <div className="relative h-full overflow-hidden bg-white text-black">
            {viewingBeach ? (
              <BeachDetailView beach={viewingBeach} onBack={handleBack} />
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className="relative px-2 h-full overflow-y-auto"
                >
                  <div className="flex justify-between flex-row items-center px-3 sticky bg-white top-0 py-4 text-md font-medium">
                    {beaches.length} strande
                    <div>
                      <Settings2 className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    {beaches.map((beach) => (
                      <BeachListItem
                        key={beach.id}
                        beach={beach}
                        isSelected={selectedId === beach.id}
                        onClick={() => handleBeachClick(beach)}
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Floating Cards */}
      {isMobile && (
        <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-auto">
          <div className="pt-2">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="px-3 py-3 flex gap-3">
                {beaches.map((beach) => (
                  <MobileBeachCard
                    key={beach.id}
                    beach={beach}
                    onClick={() => handleBeachClick(beach)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Modal */}
      <AnimatePresence>
        {isMobile && viewingBeach && (
          <MobileBeachModal beach={viewingBeach} onClose={handleBack} />
        )}
      </AnimatePresence>
    </>
  );
}

