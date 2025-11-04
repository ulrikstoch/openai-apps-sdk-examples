import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL, fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import axios from "axios";

type BeachWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  responseText: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const ASSETS_DIR = path.resolve(ROOT_DIR, "assets");

const BADEVAND_API_URL = "https://api.badevand.dk/api/beaches/dk";

// Beach API types
interface BeachDataPoint {
  date: string;
  water_quality: string;
  water_quality_original_value: string;
  water_temperature: string;
  current_speed: string;
  current_direction: string;
  air_temperature: string;
  wind_speed: string;
  wind_direction: string;
  wind_direction_display: string;
  weather_type: string | null;
  precipitation: string;
}

interface BeachAPIResponse {
  id: number;
  municipality: string;
  municipalityUrl: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  comments: string;
  facilities: string;
  links: string[];
  data: BeachDataPoint[];
}

interface TransformedBeach {
  id: string;
  name: string;
  coords: [number, number];
  municipality: string;
  description: string;
  waterQuality: number;
  waterTemperature: number;
  airTemperature: number;
  windSpeed: number;
  comments: string;
  facilities: string;
  links: string[];
  forecast: BeachDataPoint[];
  thumbnail: string;
}

function readWidgetHtml(componentName: string): string {
  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(
      `Widget assets not found. Expected directory ${ASSETS_DIR}. Run "pnpm run build" before starting the server.`
    );
  }

  const directPath = path.join(ASSETS_DIR, `${componentName}.html`);
  let htmlContents: string | null = null;

  if (fs.existsSync(directPath)) {
    htmlContents = fs.readFileSync(directPath, "utf8");
  } else {
    const candidates = fs
      .readdirSync(ASSETS_DIR)
      .filter(
        (file) => file.startsWith(`${componentName}-`) && file.endsWith(".html")
      )
      .sort();
    const fallback = candidates[candidates.length - 1];
    if (fallback) {
      htmlContents = fs.readFileSync(path.join(ASSETS_DIR, fallback), "utf8");
    }
  }

  if (!htmlContents) {
    throw new Error(
      `Widget HTML for "${componentName}" not found in ${ASSETS_DIR}. Run "pnpm run build" to generate the assets.`
    );
  }

  return htmlContents;
}

function widgetMeta(widget: BeachWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const widgets: BeachWidget[] = [
  {
    id: "beach-map",
    title: "Show Beach Map",
    templateUri: "ui://widget/beach-map.html",
    invoking: "Diving into beach data",
    invoked: "Surfaced with fresh beach info",
    html: readWidgetHtml("badevandet"),
    responseText: "Rendered a beach map with water quality information!",
  },
];

const widgetsById = new Map<string, BeachWidget>();
const widgetsByUri = new Map<string, BeachWidget>();

widgets.forEach((widget) => {
  widgetsById.set(widget.id, widget);
  widgetsByUri.set(widget.templateUri, widget);
});

const toolInputSchema = {
  type: "object",
  properties: {
    municipality: {
      type: "string",
      description: "Filter beaches by municipality name (optional).",
    },
    waterQualityFilter: {
      type: "number",
      enum: [1, 2],
      description: "Filter by water quality: 1 = poor, 2 = good (optional).",
    },
  },
  required: [],
  additionalProperties: false,
} as const;

const toolInputParser = z.object({
  municipality: z.string().optional(),
  waterQualityFilter: z.union([z.literal(1), z.literal(2)]).optional(),
});

const tools: Tool[] = widgets.map((widget) => ({
  name: widget.id,
  description: widget.title,
  inputSchema: toolInputSchema,
  title: widget.title,
  _meta: widgetMeta(widget),
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
}));

const resources: Resource[] = widgets.map((widget) => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget),
}));

const resourceTemplates: ResourceTemplate[] = widgets.map((widget) => ({
  uriTemplate: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetMeta(widget),
}));

// Beach thumbnail mapping based on water quality and municipality
function getBeachThumbnail(beach: BeachAPIResponse): string {
  const quality = parseInt(beach.data[0]?.water_quality || "2");
  const thumbnails = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
    "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=400",
  ];
  const index = (beach.id % thumbnails.length);
  return thumbnails[index];
}

function transformBeach(beach: BeachAPIResponse): TransformedBeach {
  const todayData = beach.data[0] || {
    water_quality: "2",
    water_temperature: "12",
    air_temperature: "15",
    wind_speed: "5",
  };

  return {
    id: beach.id.toString(),
    name: beach.name,
    coords: [beach.longitude, beach.latitude], // Mapbox uses [lng, lat]
    municipality: beach.municipality,
    description: beach.description || beach.comments || `Badestrand i ${beach.municipality}`,
    waterQuality: parseInt(todayData.water_quality),
    waterTemperature: parseFloat(todayData.water_temperature),
    airTemperature: parseFloat(todayData.air_temperature),
    windSpeed: parseFloat(todayData.wind_speed),
    comments: beach.comments,
    facilities: beach.facilities,
    links: beach.links,
    forecast: beach.data,
    thumbnail: getBeachThumbnail(beach),
  };
}

async function fetchBeaches(
  municipality?: string,
  waterQualityFilter?: number
): Promise<TransformedBeach[]> {
  try {
    const response = await axios.get<BeachAPIResponse[]>(BADEVAND_API_URL);
    let beaches = response.data;

    // Apply filters
    if (municipality) {
      beaches = beaches.filter((b) =>
        b.municipality.toLowerCase().includes(municipality.toLowerCase())
      );
    }

    if (waterQualityFilter) {
      beaches = beaches.filter((b) => {
        const quality = b.data[0]?.water_quality;
        return quality === waterQualityFilter.toString();
      });
    }

    return beaches.map(transformBeach);
  } catch (error) {
    console.error("Failed to fetch beaches:", error);
    throw new Error("Failed to fetch beach data from API");
  }
}

function createBadevandetServer(): Server {
  const server = new Server(
    {
      name: "badevandet-node",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request: ListResourcesRequest) => ({
      resources,
    })
  );

  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: ReadResourceRequest) => {
      const widget = widgetsByUri.get(request.params.uri);

      if (!widget) {
        throw new Error(`Unknown resource: ${request.params.uri}`);
      }

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: widget.html,
            _meta: widgetMeta(widget),
          },
        ],
      };
    }
  );

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request: ListResourceTemplatesRequest) => ({
      resourceTemplates,
    })
  );

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => ({
      tools,
    })
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const widget = widgetsById.get(request.params.name);

      if (!widget) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const args = toolInputParser.parse(request.params.arguments ?? {});

      // Fetch beaches from API
      const beaches = await fetchBeaches(
        args.municipality,
        args.waterQualityFilter
      );

      return {
        content: [
          {
            type: "text",
            text: widget.responseText,
          },
        ],
        structuredContent: {
          beaches: beaches,
          municipality: args.municipality,
          waterQualityFilter: args.waterQualityFilter,
        },
        _meta: widgetMeta(widget),
      };
    }
  );

  return server;
}

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

const sessions = new Map<string, SessionRecord>();

const ssePath = "/mcp";
const postPath = "/mcp/messages";

async function handleSseRequest(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const server = createBadevandetServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handlePostMessage(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

const portEnv = Number(process.env.PORT ?? 8000);
const port = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (
      req.method === "OPTIONS" &&
      (url.pathname === ssePath || url.pathname === postPath)
    ) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      });
      res.end();
      return;
    }

    // Serve static assets from the assets directory (check before MCP endpoints)
    if (req.method === "GET" && url.pathname !== ssePath) {
      const relativePath = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
      const assetPath = path.join(ASSETS_DIR, relativePath);
      const exists = fs.existsSync(assetPath);
      const isFile = exists ? fs.statSync(assetPath).isFile() : false;
      console.log(`[ASSET] ${req.method} ${url.pathname}`);
      console.log(`  -> Path: ${assetPath}`);
      console.log(`  -> Exists: ${exists}, IsFile: ${isFile}`);
      if (exists && isFile) {
        const ext = path.extname(assetPath).toLowerCase();
        const contentTypes: Record<string, string> = {
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
        };
        const contentType = contentTypes[ext] || "application/octet-stream";
        
        res.writeHead(200, {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        });
        fs.createReadStream(assetPath).pipe(res);
        return;
      }
    }

    if (req.method === "GET" && url.pathname === ssePath) {
      await handleSseRequest(res);
      return;
    }

    if (req.method === "POST" && url.pathname === postPath) {
      await handlePostMessage(req, res, url);
      return;
    }

    res.writeHead(404, {
      "Access-Control-Allow-Origin": "*",
    }).end("Not Found");
  }
);

httpServer.on("clientError", (err: Error, socket) => {
  console.error("HTTP client error", err);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Badevandet MCP server listening on http://0.0.0.0:${port}`);
  console.log(`  SSE stream: GET http://0.0.0.0:${port}${ssePath}`);
  console.log(
    `  Message post endpoint: POST http://0.0.0.0:${port}${postPath}?sessionId=...`
  );
});

