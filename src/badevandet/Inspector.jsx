import React, { useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Wind, AlertTriangle, X, ExternalLink, Thermometer, Calendar } from "lucide-react";

function WaterQualityBadge({ quality, size = "default" }) {
  const colors = {
    1: "bg-red-500 text-white",
    2: "bg-green-500 text-white",
  };
  const labels = {
    1: "Dårlig vandkvalitet",
    2: "God vandkvalitet",
  };
  
  const sizeClasses = size === "large" ? "px-4 py-2 text-base" : "px-3 py-1 text-sm";
  
  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${colors[quality] || "bg-gray-400 text-white"} ${sizeClasses}`}>
      <div className="h-2 w-2 rounded-full bg-white" />
      <span>{labels[quality] || "Ukendt kvalitet"}</span>
    </div>
  );
}

function ForecastDay({ data, isToday, onClick, isExpanded }) {
  const date = new Date(data.date);
  const dayName = isToday ? "I dag" : date.toLocaleDateString("da-DK", { weekday: "short" });
  const fullDate = date.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
  const quality = parseInt(data.water_quality);
  
  return (
    <div 
      className={`p-3 rounded-xl cursor-pointer transition-all ${
        isToday ? "bg-blue-50 ring-2 ring-blue-200" : "bg-gray-50 hover:bg-gray-100"
      } ${isExpanded ? "col-span-2" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-black/70">{dayName}</div>
        <div className="text-xs text-black/50">{fullDate}</div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm">
          <Droplets className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
          <span>{data.water_temperature}°C vand</span>
        </div>
        {isExpanded && data.air_temperature && (
          <div className="flex items-center gap-1.5 text-sm">
            <Thermometer className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            <span>{data.air_temperature}°C luft</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm">
          <Wind className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
          <span>{data.wind_speed} m/s</span>
          {isExpanded && data.wind_direction_display && (
            <span className="text-xs text-black/50">({data.wind_direction_display})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className={`h-2 w-2 rounded-full ${quality === 2 ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-black/60">{quality === 2 ? "God kvalitet" : "Dårlig kvalitet"}</span>
        </div>
        {isExpanded && data.precipitation && parseFloat(data.precipitation) > 0 && (
          <div className="text-xs text-black/60 mt-2">
            💧 Nedbør: {data.precipitation}mm
          </div>
        )}
      </div>
    </div>
  );
}

export default function Inspector({ beach, onClose }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [showFullForecast, setShowFullForecast] = useState(false);
  
  if (!beach) return null;
  
  const hasWarning = beach.comments && beach.comments.toLowerCase().includes("badeforbud");
  const forecast = beach.forecast || [];
  const displayedForecast = showFullForecast ? forecast : forecast.slice(0, 4);
  
  return (
    <motion.div
      key={beach.id}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
      className="badevandet-inspector absolute z-30 top-0 bottom-4 left-0 right-auto xl:left-auto xl:right-6 md:z-20 w-[340px] xl:w-[360px] xl:top-6 xl:bottom-8 pointer-events-auto"
    >
      <button
        aria-label="Luk detaljer"
        className="inline-flex absolute z-10 top-4 left-4 xl:top-4 xl:left-4 shadow-xl rounded-full p-2 bg-white ring ring-black/10 xl:shadow-2xl hover:bg-white"
        onClick={onClose}
      >
        <X className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      <div className="relative h-full overflow-y-auto rounded-none xl:rounded-3xl bg-white text-black xl:shadow-xl xl:ring ring-black/10">
        <div className="relative mt-2 xl:mt-0 px-2 xl:px-0">
          <img
            src={beach.thumbnail}
            alt={beach.name}
            className="w-full rounded-3xl xl:rounded-none h-80 object-cover xl:rounded-t-2xl"
          />
        </div>

        <div className="h-[calc(100%-11rem)] sm:h-[calc(100%-14rem)]">
          <div className="p-4 sm:p-5">
            <div className="text-2xl font-medium">{beach.name}</div>
            <div className="text-sm mt-1 opacity-70 flex items-center gap-1">
              <span>{beach.municipality}</span>
            </div>
            
            <div className="mt-4">
              <WaterQualityBadge quality={beach.waterQuality} size="large" />
            </div>

            {hasWarning && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-none mt-0.5" aria-hidden="true" />
                <div>
                  <div className="font-medium text-red-900 text-sm">Advarsel</div>
                  <div className="text-sm text-red-800 mt-0.5">{beach.comments}</div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <span>Vandtemperatur: {beach.waterTemperature}°C</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wind className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span>Vind: {beach.windSpeed} m/s</span>
              </div>
            </div>

            {beach.description && (
              <div className="text-sm mt-4 text-black/70">
                {beach.description}
              </div>
            )}

            {beach.facilities && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-1">Faciliteter</div>
                <div className="text-sm text-black/70">{beach.facilities}</div>
              </div>
            )}
          </div>

          {forecast.length > 0 && (
            <div className="px-4 sm:px-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  <div className="text-lg font-medium">Prognose</div>
                </div>
                {forecast.length > 4 && (
                  <button
                    onClick={() => setShowFullForecast(!showFullForecast)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showFullForecast ? "Vis mindre" : `Vis alle ${forecast.length} dage`}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {displayedForecast.map((day, idx) => (
                  <ForecastDay 
                    key={day.date} 
                    data={day} 
                    isToday={idx === 0}
                    isExpanded={expandedDay === idx}
                    onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {beach.links && beach.links.length > 0 && beach.links[0] && (
            <div className="px-4 sm:px-5 pb-4">
              <a
                href={beach.links[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <span>Læs mere på kommunens hjemmeside</span>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

