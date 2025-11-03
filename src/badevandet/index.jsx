import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createRoot } from "react-dom/client";
import beaches from "./beaches.json";
import { AnimatePresence } from "framer-motion";
import Inspector from "./Inspector";
import Sidebar from "./Sidebar";
import { useOpenAiGlobal } from "../use-openai-global";
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
  const beachList = beaches?.beaches || [];
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
  const allowInspector = displayMode === "fullscreen";
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

  function getInspectorOffsetPx() {
    if (displayMode !== "fullscreen") return 0;
    if (typeof window === "undefined") return 0;
    const isXlUp =
      window.matchMedia && window.matchMedia("(min-width: 1280px)").matches;
    const el = document.querySelector(".badevandet-inspector");
    const w = el ? el.getBoundingClientRect().width : 360;
    const half = Math.round(w / 2);
    // xl: inspector on right → negative x offset; lg: inspector on left → positive x offset
    return isXlUp ? -half : half;
  }

  function panTo(
    coord,
    { offsetForInspector } = { offsetForInspector: false }
  ) {
    if (!mapObj.current) return;
    const inspectorOffset = offsetForInspector ? getInspectorOffsetPx() : 0;
    const flyOpts = {
      center: coord,
      zoom: 14,
      speed: 1.2,
      curve: 1.6,
    };
    if (inspectorOffset) {
      flyOpts.offset = [inspectorOffset, 0];
    }
    mapObj.current.flyTo(flyOpts);
  }

  useEffect(() => {
    if (!mapObj.current) return;
    addAllMarkers(beachList);
  }, [beachList]);

  // Pan the map when the selected beach changes via routing
  useEffect(() => {
    if (!mapObj.current || !selectedBeach) return;
    panTo(selectedBeach.coords, { offsetForInspector: true });
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
          height: displayMode === "fullscreen" ? maxHeight - 40 : 480,
        }}
        className={
          "relative antialiased w-full min-h-[480px] overflow-hidden " +
          (displayMode === "fullscreen"
            ? "rounded-none border-0"
            : "border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl")
        }
      >
        <Outlet />
        {displayMode !== "fullscreen" && (
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
        {/* Sidebar */}
        <Sidebar
          beaches={beachList}
          selectedId={selectedId}
          onSelect={(beach) => {
            navigate(`/beach/${beach.id}`);
            panTo(beach.coords, { offsetForInspector: true });
          }}
        />

        {/* Inspector (right) */}
        <AnimatePresence>
          {allowInspector && selectedBeach && (
            <Inspector
              key={selectedBeach.id}
              beach={selectedBeach}
              onClose={() => navigate("..")}
            />
          )}
        </AnimatePresence>

        {/* Map */}
        <div
          className={
            "absolute inset-0 overflow-hidden" +
            (displayMode === "fullscreen"
              ? " left-[340px] right-2 top-2 bottom-4 border border-black/10 rounded-3xl"
              : "")
          }
        >
          <div
            ref={mapRef}
            className="w-full h-full absolute bottom-0 left-0 right-0"
            style={{
              maxHeight,
              height: displayMode === "fullscreen" ? maxHeight : undefined,
            }}
          />
        </div>
      </div>

      {/* Suggestion chips (bottom, fullscreen) */}
      {displayMode === "fullscreen" && (
        <div className="hidden antialiased md:flex absolute inset-x-0 bottom-2 z-30 justify-center pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
            {["God vandkvalitet", "København", "Aarhus"].map((label) => (
              <button
                key={label}
                className="rounded-full font-base bg-white ring ring-black/10 text-black px-4 py-1.5 text-sm hover:bg-[#f7f7f7] cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
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

