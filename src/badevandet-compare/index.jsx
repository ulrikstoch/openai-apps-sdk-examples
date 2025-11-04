import React, { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useWidgetProps } from "../use-widget-props";
import { useOpenAiGlobal } from "../use-openai-global";
import { useMaxHeight } from "../use-max-height";
import { Droplets, Wind, Thermometer, MapPin, TrendingUp, TrendingDown, Minus, Maximize2 } from "lucide-react";
import beachesStatic from "../badevandet/beaches.json";

function WaterQualityBadge({ quality, size = "default" }) {
  const colors = {
    1: "bg-red-600 text-white",
    2: "bg-green-600 text-white",
  };
  const labels = {
    1: "Dårlig",
    2: "God",
  };
  
  const sizeClasses = size === "large" ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs";
  
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${colors[quality] || "bg-gray-500 text-white"} ${sizeClasses}`}>
      <div className="h-1.5 w-1.5 rounded-full bg-white" />
      <span>{labels[quality] || "?"}</span>
    </div>
  );
}

function ComparisonCard({ beach, rank }) {
  const rankColors = {
    1: "bg-yellow-100 ring-yellow-300",
    2: "bg-gray-100 ring-gray-300",
    3: "bg-orange-100 ring-orange-300",
  };
  
  const rankEmojis = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  return (
    <div className={`rounded-2xl p-4 ring-2 ${rankColors[rank] || "bg-white ring-gray-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {rank && <span className="text-2xl">{rankEmojis[rank]}</span>}
            <h3 className="text-lg font-semibold text-black">{beach.name}</h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-black/60">
            <MapPin className="h-3.5 w-3.5" />
            <span>{beach.municipality}</span>
          </div>
        </div>
        <WaterQualityBadge quality={beach.waterQuality} size="large" />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-blue-600" />
            <span className="text-black/70">Vandtemperatur</span>
          </div>
          <span className="font-semibold text-blue-800">{beach.waterTemperature}°C</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Thermometer className="h-4 w-4 text-orange-600" />
            <span className="text-black/70">Lufttemperatur</span>
          </div>
          <span className="font-semibold text-orange-800">{beach.airTemperature}°C</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Wind className="h-4 w-4 text-gray-600" />
            <span className="text-black/70">Vind</span>
          </div>
          <span className="font-semibold text-gray-800">{beach.windSpeed} m/s</span>
        </div>
      </div>

      {beach.comments && (
        <div className="mt-3 p-2 bg-amber-100 rounded-lg">
          <p className="text-xs text-amber-900">{beach.comments}</p>
        </div>
      )}
    </div>
  );
}

function ComparisonTable({ beaches }) {
  const bestTemp = Math.max(...beaches.map(b => b.waterTemperature));
  const lowestWind = Math.min(...beaches.map(b => b.windSpeed));

  const getTempIcon = (temp) => {
    if (temp === bestTemp) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (temp === Math.min(...beaches.map(b => b.waterTemperature))) return <TrendingDown className="h-4 w-4 text-blue-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getWindIcon = (wind) => {
    if (wind === lowestWind) return <TrendingDown className="h-4 w-4 text-green-600" />;
    if (wind === Math.max(...beaches.map(b => b.windSpeed))) return <TrendingUp className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-semibold text-black/70">Måling</th>
            {beaches.map((beach) => (
              <th key={beach.id} className="text-center py-3 px-2 font-semibold text-black">
                {beach.name.split(',')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-3 px-2 text-black/70">Vandkvalitet</td>
            {beaches.map((beach) => (
              <td key={beach.id} className="text-center py-3 px-2">
                <WaterQualityBadge quality={beach.waterQuality} />
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-3 px-2 text-black/70">Vandtemperatur</td>
            {beaches.map((beach) => (
              <td key={beach.id} className="text-center py-3 px-2">
                <div className="flex items-center justify-center gap-1">
                  {getTempIcon(beach.waterTemperature)}
                  <span className="font-medium">{beach.waterTemperature}°C</span>
                </div>
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-3 px-2 text-black/70">Lufttemperatur</td>
            {beaches.map((beach) => (
              <td key={beach.id} className="text-center py-3 px-2 font-medium">
                {beach.airTemperature}°C
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-3 px-2 text-black/70">Vind</td>
            {beaches.map((beach) => (
              <td key={beach.id} className="text-center py-3 px-2">
                <div className="flex items-center justify-center gap-1">
                  {getWindIcon(beach.windSpeed)}
                  <span className="font-medium">{beach.windSpeed} m/s</span>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function BeachCompareApp() {
  const widgetProps = useWidgetProps({ beaches: beachesStatic.beaches });
  const beaches = widgetProps?.beaches || beachesStatic.beaches || [];
  const displayMode = useOpenAiGlobal("displayMode");
  const maxHeight = useMaxHeight() ?? undefined;

  // Rank beaches by swimming score
  const rankedBeaches = useMemo(() => {
    return beaches
      .map(beach => {
        // Score: good quality + warm water - high wind
        let score = 0;
        if (beach.waterQuality === 2) score += 50;
        score += beach.waterTemperature * 2;
        score -= beach.windSpeed * 3;
        return { ...beach, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [beaches]);

  const topBeaches = rankedBeaches.slice(0, 3);

  return (
    <div
      style={{ maxHeight }}
      className={
        "relative antialiased w-full overflow-auto " +
        (displayMode === "fullscreen"
          ? "h-screen rounded-none border-0"
          : "min-h-[480px] border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl")
      }
    >
      <div className="bg-gradient-to-b from-blue-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Sammenlign Strande</h1>
            <p className="text-black/60">Sammenligning af de {beaches.length} bedste strande baseret på nuværende forhold</p>
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

          {/* Top 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {topBeaches.map((beach, idx) => (
              <ComparisonCard key={beach.id} beach={beach} rank={idx + 1} />
            ))}
          </div>

          {/* Detailed Comparison Table */}
          {beaches.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-xl font-semibold text-black mb-4">Detaljeret Sammenligning</h2>
              <ComparisonTable beaches={topBeaches} />
            </div>
          )}

          {/* All Beaches List */}
          {rankedBeaches.length > 3 && (
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-xl font-semibold text-black mb-4">Alle Strande</h2>
              <div className="space-y-3">
                {rankedBeaches.slice(3).map((beach, idx) => (
                  <div key={beach.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-black/40">#{idx + 4}</span>
                      <div>
                        <div className="font-medium text-black">{beach.name}</div>
                        <div className="text-xs text-black/60">{beach.municipality}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <WaterQualityBadge quality={beach.waterQuality} />
                      <span className="text-sm font-medium text-blue-600">{beach.waterTemperature}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("badevandet-compare-root")).render(<BeachCompareApp />);

