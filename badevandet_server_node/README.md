# Badevandet MCP Server

An MCP (Model Context Protocol) server that provides Danish beach water quality data through an interactive map widget.

## Features

- Fetches real-time beach data from the Danish Badevand API (`https://api.badevand.dk/api/beaches/dk`)
- Interactive Mapbox-powered map showing all Danish beaches
- Water quality indicators (good/poor)
- 4-day weather and water quality forecasts
- Detailed beach information including:
  - Water temperature
  - Air temperature
  - Wind speed
  - Facilities
  - Safety warnings (badeforbud)
  - Municipality information

## API Tool

### `beach-map`

Shows an interactive map of Danish beaches with water quality information.

**Parameters:**
- `municipality` (optional): Filter beaches by municipality name (e.g., "Aarhus", "København")
- `waterQualityFilter` (optional): Filter by water quality (1 = poor, 2 = good)

**Example:**
```typescript
{
  "municipality": "Aarhus",
  "waterQualityFilter": 2
}
```

## Running Locally

1. Build the frontend assets:
   ```bash
   pnpm run build
   ```

2. Start the server:
   ```bash
   pnpm start
   ```

3. The server will listen on `http://0.0.0.0:8000` by default

## Deploying to Railway

1. Update `railway.json` to use this server (already configured)
2. Push to your Railway-connected repository
3. Railway will automatically build and deploy
4. Get the deployment URL from Railway dashboard

## Connecting to ChatGPT

1. Deploy the server to Railway (or any public URL)
2. In ChatGPT, go to Settings → Apps → Create custom app
3. Add the MCP endpoint: `https://your-railway-url.railway.app/mcp`
4. The "Show Beach Map" tool will be available in ChatGPT

## Development

The server is built with:
- Node.js + TypeScript
- MCP SDK for protocol implementation
- Axios for API calls
- Express-like HTTP server

Frontend widget built with:
- React
- Mapbox GL JS for mapping
- Tailwind CSS for styling
- Framer Motion for animations

## Data Source

Beach data is provided by the Danish Badevand API, which includes:
- 200+ beaches across Denmark
- Real-time water quality measurements
- 4-day forecasts
- Municipality information
- Safety warnings and facilities

## License

Same as parent project (see root LICENSE file)

