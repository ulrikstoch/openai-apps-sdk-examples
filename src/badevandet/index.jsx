import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createRoot } from "react-dom/client";
import beachesStatic from "./beaches.json";
import Sidebar from "./Sidebar";
import { useOpenAiGlobal } from "../use-openai-global";
import { useWidgetProps } from "../use-widget-props";
import { useMaxHeight } from "../use-max-height";
import { Maximize2 } from "lucide-react";
import {
  useNavigate,
  useLocation,
  Routes,
  Route,
  BrowserRouter,
  Outlet,
} from "react-router-dom";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZXJpY25pbmciLCJhIjoiY21icXlubWM1MDRiczJvb2xwM2p0amNyayJ9.n-3O6JI5nOp_Lw96ZO5vJQ";

function fitMapToMarkers(map, coords) {
  if (!map || !coords.length) return;
  if (coords.length === 1) {
    map.flyTo({ center: coords[0], zoom: 12 });
    return;
  }
  const bounds = coords.reduce(
    (b, c) => b.extend(c),
    new mapboxgl.LngLatBounds(coords[0], coords[0])
  );
  map.fitBounds(bounds, { padding: 60, animate: true });
}

export default function App() {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markerObjs = useRef([]);
  
  // Get beach data from backend (via useWidgetProps) or fall back to static data
  const widgetProps = useWidgetProps({ beaches: beachesStatic.beaches });
  const beachList = widgetProps?.beaches || beachesStatic.beaches || [];
  
  const markerCoords = beachList.map((b) => b.coords);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedId = React.useMemo(() => {
    const match = location?.pathname?.match(/(?:^|\/)beach\/([^/]+)/);
    return match && match[1] ? match[1] : null;
  }, [location?.pathname]);
  const selectedBeach = beachList.find((b) => b.id === selectedId) || null;
  const [viewState, setViewState] = useState(() => ({
    center: markerCoords.length > 0 ? markerCoords[0] : [10.4515, 56.2639],
    zoom: markerCoords.length > 0 ? 7 : 7,
  }));
  const displayMode = useOpenAiGlobal("displayMode");
  const isFullscreen = displayMode === "fullscreen";
  const maxHeight = useMaxHeight() ?? undefined;

  useEffect(() => {
    if (mapObj.current) return;
    mapObj.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: markerCoords.length > 0 ? markerCoords[0] : [10.4515, 56.2639],
      zoom: markerCoords.length > 0 ? 7 : 7,
      attributionControl: false,
    });
    addAllMarkers(beachList);
    setTimeout(() => {
      fitMapToMarkers(mapObj.current, markerCoords);
    }, 0);
    // after first paint
    requestAnimationFrame(() => mapObj.current.resize());

    // or keep it in sync with window resizes
    window.addEventListener("resize", mapObj.current.resize);

    return () => {
      window.removeEventListener("resize", mapObj.current.resize);
      mapObj.current.remove();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!mapObj.current) return;
    const handler = () => {
      const c = mapObj.current.getCenter();
      setViewState({ center: [c.lng, c.lat], zoom: mapObj.current.getZoom() });
    };
    mapObj.current.on("moveend", handler);
    return () => {
      mapObj.current.off("moveend", handler);
    };
  }, []);

  function addAllMarkers(beachesList) {
    markerObjs.current.forEach((m) => m.remove());
    markerObjs.current = [];
    beachesList.forEach((beach) => {
      const marker = new mapboxgl.Marker({
        color: "#2196F3",
      })
        .setLngLat(beach.coords)
        .addTo(mapObj.current);
      const el = marker.getElement();
      if (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          navigate(`/beach/${beach.id}`);
          panTo(beach.coords, { offsetForInspector: true });
        });
      }
      markerObjs.current.push(marker);
    });
  }

  function panTo(coord) {
    if (!mapObj.current) return;
    mapObj.current.flyTo({
      center: coord,
      zoom: 14,
      speed: 1.2,
      curve: 1.6,
    });
  }

  useEffect(() => {
    if (!mapObj.current) return;
    addAllMarkers(beachList);
  }, [beachList]);

  // Pan the map when the selected beach changes via routing
  useEffect(() => {
    if (!mapObj.current || !selectedBeach) return;
    panTo(selectedBeach.coords);
  }, [selectedId]);

  // Ensure Mapbox resizes when container maxHeight/display mode changes
  useEffect(() => {
    if (!mapObj.current) return;
    mapObj.current.resize();
  }, [maxHeight, displayMode]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.oai &&
      typeof window.oai.widget.setState === "function"
    ) {
      window.oai.widget.setState({
        center: viewState.center,
        zoom: viewState.zoom,
        markers: markerCoords,
      });
    }
  }, [viewState, markerCoords]);

  return (
    <>
      <div
        style={{
          maxHeight,
          height: isFullscreen ? maxHeight - 40 : 480,
        }}
        className={
          "relative antialiased w-full min-h-[480px] overflow-hidden " +
          (isFullscreen
            ? "rounded-none border-0"
            : "border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl")
        }
      >
        <Outlet />
        {!isFullscreen && (
          <button
            aria-label="Enter fullscreen"
            className="absolute top-4 right-4 z-30 rounded-full bg-white text-black shadow-lg ring ring-black/5 p-2.5 pointer-events-auto"
            onClick={() => {
              if (selectedId) {
                navigate("..", { replace: true });
              }
              if (window?.webplus?.requestDisplayMode) {
                window.webplus.requestDisplayMode({ mode: "fullscreen" });
              }
            }}
          >
            <Maximize2
              strokeWidth={1.5}
              className="h-4.5 w-4.5"
              aria-hidden="true"
            />
          </button>
        )}
        
        {/* Sidebar with integrated detail view (desktop) or floating cards (mobile) */}
        <Sidebar
          beaches={beachList}
          selectedId={selectedId}
          onSelect={(beach) => {
            navigate(`/beach/${beach.id}`);
            panTo(beach.coords);
          }}
        />

        {/* Map */}
        <div
          className={
            "absolute inset-0 overflow-hidden" +
            (isFullscreen
              ? " left-[340px] right-2 top-2 bottom-4 border border-black/10 rounded-3xl"
              : "")
          }
        >
          <div
            ref={mapRef}
            className="w-full h-full absolute bottom-0 left-0 right-0"
            style={{
              maxHeight,
              height: isFullscreen ? maxHeight : undefined,
            }}
          />
        </div>
      </div>
    </>
  );
}

function RouterRoot() {
  return (
    <Routes>
      <Route path="*" element={<App />}>
        <Route path="beach/:beachId" element={<></>} />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById("badevandet-root")).render(
  <BrowserRouter>
    <RouterRoot />
  </BrowserRouter>
);

