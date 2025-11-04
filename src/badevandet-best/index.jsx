import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import { useOpenAiGlobal } from "../use-openai-global";
import { useMaxHeight } from "../use-max-height";
import { 
  Droplets, Wind, Thermometer, MapPin, Star, TrendingUp, 
  CheckCircle2, AlertCircle, Maximize2, Filter 
} from "lucide-react";
import beachesStatic from "../badevandet/beaches.json";

function WaterQualityBadge({ quality }) {
  const colors = {
    1: "bg-red-600 text-white",
    2: "bg-green-600 text-white",
  };
  const labels = {
    1: "Dårlig",
    2: "God",
  };
  
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${colors[quality] || "bg-gray-500 text-white"}`}>
      <div className="h-1.5 w-1.5 rounded-full bg-white" />
      <span>{labels[quality] || "?"}</span>
    </div>
  );
}

function ScoreBadge({ score }) {
  let color = "bg-gray-600";
  let label = "OK";
  
  if (score >= 85) {
    color = "bg-green-600";
    label = "Fremragende";
  } else if (score >= 70) {
    color = "bg-blue-600";
    label = "God";
  } else if (score >= 50) {
    color = "bg-yellow-600";
    label = "Acceptabel";
  } else {
    color = "bg-orange-600";
    label = "Mindre god";
  }
  
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-white text-sm font-medium ${color}`}>
      <Star className="h-4 w-4 fill-current" />
      <span>{score}/100</span>
      <span className="text-xs opacity-90">({label})</span>
    </div>
  );
}

function BeachRecommendationCard({ beach, rank, showDetails }) {
  const [expanded, setExpanded] = useState(false);
  
  const reasons = [];
  if (beach.waterQuality === 2) reasons.push({ icon: CheckCircle2, text: "God vandkvalitet", color: "text-green-600" });
  if (beach.waterTemperature >= 18) reasons.push({ icon: TrendingUp, text: `Varm (${beach.waterTemperature}°C)`, color: "text-blue-600" });
  if (beach.windSpeed <= 5) reasons.push({ icon: CheckCircle2, text: "Lav vind", color: "text-green-600" });
  if (beach.comments) reasons.push({ icon: AlertCircle, text: beach.comments, color: "text-amber-600" });

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={beach.thumbnail} 
          alt={`Strand billede af ${beach.name} i ${beach.municipality}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <div className="bg-white/95 backdrop-blur rounded-full px-3 py-1.5 font-bold text-lg">
            #{rank}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <ScoreBadge score={beach.swimScore} />
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-black mb-1">{beach.name}</h3>
          <div className="flex items-center gap-1 text-sm text-black/60">
            <MapPin className="h-3.5 w-3.5" />
            <span>{beach.municipality}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <WaterQualityBadge quality={beach.waterQuality} />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-blue-100 rounded-lg">
            <Droplets className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-blue-800">{beach.waterTemperature}°C</div>
            <div className="text-xs text-black/60">Vand</div>
          </div>
          <div className="text-center p-2 bg-orange-100 rounded-lg">
            <Thermometer className="h-5 w-5 text-orange-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-orange-800">{beach.airTemperature}°C</div>
            <div className="text-xs text-black/60">Luft</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded-lg">
            <Wind className="h-5 w-5 text-gray-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-gray-800">{beach.windSpeed} m/s</div>
            <div className="text-xs text-black/60">Vind</div>
          </div>
        </div>

        {showDetails && (
          <>
            <div className="border-t border-gray-100 pt-4 mb-4">
              <h4 className="text-sm font-semibold text-black mb-2">Hvorfor anbefalet?</h4>
              <div className="space-y-2">
                {reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <reason.icon className={`h-4 w-4 mt-0.5 ${reason.color}`} />
                    <span className="text-black/70">{reason.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {beach.description && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-blue-700 hover:text-blue-800 font-medium"
              >
                {expanded ? "Vis mindre" : "Læs mere"}
              </button>
            )}

            {expanded && beach.description && (
              <div className="mt-3 text-sm text-black/70">
                {beach.description}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterPanel({ criteria, onChange }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-black">Filtrer resultater</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-black/70 mb-2 block">
            Minimum vandtemperatur
          </label>
          <input
            type="range"
            min="10"
            max="25"
            value={criteria.minTemp}
            onChange={(e) => onChange({ ...criteria, minTemp: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-sm text-black/60 mt-1">{criteria.minTemp}°C</div>
        </div>

        <div>
          <label className="text-sm font-medium text-black/70 mb-2 block">
            Maximum vindhastighed
          </label>
          <input
            type="range"
            min="0"
            max="15"
            value={criteria.maxWind}
            onChange={(e) => onChange({ ...criteria, maxWind: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-sm text-black/60 mt-1">{criteria.maxWind} m/s</div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={criteria.onlyGoodQuality}
              onChange={(e) => onChange({ ...criteria, onlyGoodQuality: e.target.checked })}
              className="rounded"
            />
            <span className="text-black/70">Kun god vandkvalitet</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default function BestBeachesApp() {
  const widgetProps = useWidgetProps({ beaches: beachesStatic.beaches, criteria: {} });
  const beaches = widgetProps?.beaches || beachesStatic.beaches || [];
  const displayMode = useOpenAiGlobal("displayMode");
  const maxHeight = useMaxHeight() ?? undefined;

  const [criteria, setCriteria] = useState({
    minTemp: widgetProps?.criteria?.minTemp || 12,
    maxWind: widgetProps?.criteria?.maxWind || 10,
    onlyGoodQuality: widgetProps?.criteria?.onlyGoodQuality !== false,
  });

  // Calculate swimming score and rank beaches
  const rankedBeaches = useMemo(() => {
    let filtered = beaches;

    // Apply filters
    if (criteria.onlyGoodQuality) {
      filtered = filtered.filter(b => b.waterQuality === 2);
    }
    filtered = filtered.filter(b => b.waterTemperature >= criteria.minTemp);
    filtered = filtered.filter(b => b.windSpeed <= criteria.maxWind);

    // Calculate swimming score
    return filtered
      .map(beach => {
        let score = 50; // Base score
        
        // Water quality (30 points)
        if (beach.waterQuality === 2) score += 30;
        
        // Water temperature (30 points, optimal 18-22°C)
        if (beach.waterTemperature >= 18 && beach.waterTemperature <= 22) {
          score += 30;
        } else if (beach.waterTemperature >= 15) {
          score += 20;
        } else if (beach.waterTemperature >= 12) {
          score += 10;
        }
        
        // Wind (20 points, lower is better)
        if (beach.windSpeed <= 3) {
          score += 20;
        } else if (beach.windSpeed <= 5) {
          score += 15;
        } else if (beach.windSpeed <= 7) {
          score += 10;
        } else if (beach.windSpeed <= 10) {
          score += 5;
        }
        
        // Warnings penalty
        if (beach.comments && beach.comments.toLowerCase().includes("badeforbud")) {
          score -= 40;
        }
        
        return { ...beach, swimScore: Math.max(0, Math.min(100, score)) };
      })
      .sort((a, b) => b.swimScore - a.swimScore);
  }, [beaches, criteria]);

  const topBeaches = rankedBeaches.slice(0, 6);
  const hasResults = topBeaches.length > 0;

  return (
    <div
      style={{ maxHeight }}
      className={
        "relative antialiased w-full overflow-auto " +
        (displayMode === "fullscreen"
          ? "h-screen rounded-none border-0 bg-gradient-to-b from-blue-50 to-white"
          : "min-h-[600px] border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-blue-50 to-white")
      }
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">🏖️ Bedste Strande til Badning</h1>
            <p className="text-black/60">
              {hasResults 
                ? `Fandt ${rankedBeaches.length} strande der matcher dine kriterier`
                : "Ingen strande matcher dine kriterier - prøv at justere filtrene"}
            </p>
          </div>

          {displayMode !== "fullscreen" && (
            <button
              aria-label="Enter fullscreen"
              className="absolute top-4 right-4 z-30 rounded-full bg-white text-black shadow-lg ring ring-black/5 p-2.5"
              onClick={() => {
                if (window?.webplus?.requestDisplayMode) {
                  window.webplus.requestDisplayMode({ mode: "fullscreen" });
                }
              }}
            >
              <Maximize2 strokeWidth={1.5} className="h-4.5 w-4.5" />
            </button>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters sidebar */}
            <div className="lg:col-span-1">
              <FilterPanel criteria={criteria} onChange={setCriteria} />
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {hasResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {topBeaches.map((beach, idx) => (
                    <BeachRecommendationCard 
                      key={beach.id} 
                      beach={beach} 
                      rank={idx + 1}
                      showDetails={idx < 3}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm ring-1 ring-black/5">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black mb-2">Ingen resultater</h3>
                  <p className="text-black/60">
                    Prøv at justere filtrene for at se flere strande
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("badevandet-best-root")).render(<BestBeachesApp />);

