# Deploying Badevandet to Railway (Separate Project)

Since you already have a Railway deployment for Pizzaz, you'll want to create a **separate Railway project** for Badevandet so both can run simultaneously.

## Quick Deploy Steps

### 1. Create New Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `ulrikstoch/openai-apps-sdk-examples`
5. Railway will ask about configuration

### 2. Configure the Deployment

In the Railway project settings, add these configurations:

**Build Command:**
```bash
pnpm install && pnpm run build
```

**Start Command:**
```bash
pnpm --filter badevandet-mcp-node start
```

**Environment Variables:**
- Railway will automatically set `PORT` (usually 8000 or similar)
- No other environment variables needed!

### 3. Alternative: Use Custom railway.json

Or create a custom `railway.toml` file in the root:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install && pnpm run build"

[deploy]
startCommand = "pnpm --filter badevandet-mcp-node start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 4. Deploy and Get URL

1. Railway will automatically build and deploy
2. Wait for deployment to complete (2-3 minutes)
3. Click on your deployment to get the public URL
4. It will look like: `https://badevandet-production-xxxx.up.railway.app`

### 5. Test the Endpoint

Test your MCP endpoint:
```bash
curl https://your-railway-url.railway.app/mcp
```

You should see an SSE stream connection start.

### 6. Connect to ChatGPT

1. Open ChatGPT → Settings → Apps
2. Click **"Create custom app"** or **"Connect app"**
3. Enter your MCP endpoint URL:
   ```
   https://your-railway-url.railway.app/mcp
   ```
4. Name it something like "Danish Beaches" or "Badevandet"

### 7. Test in ChatGPT

Try these prompts:
- "Show me beaches in Aarhus"
- "Find beaches with good water quality in København"
- "Which Danish beaches are safe to swim at today?"
- "Show beaches in Vejle with warm water"

## Your Current Setup

After following these steps, you'll have:

**Railway Project 1 (Existing):** Pizzaz
- URL: `https://your-pizzaz-url.railway.app`
- MCP Tool: Pizza maps
- GitHub: Connected to main branch

**Railway Project 2 (New):** Badevandet
- URL: `https://your-badevandet-url.railway.app`
- MCP Tool: Danish beach maps
- GitHub: Same repo, same branch

Both will:
- Build from the same repository
- Use different start commands
- Run independently
- Can both be connected to ChatGPT

## Troubleshooting

### Build Fails

If the build fails, check:
1. The build command includes `pnpm run build`
2. Node version is 18+ (Railway usually auto-detects)

### Server Won't Start

If the server starts but crashes:
1. Check Railway logs for errors
2. Verify the start command is correct
3. Ensure assets were built (check for `assets/badevandet-*.html`)

### Assets Not Loading

If the widget loads but looks broken:
1. Check that `pnpm run build` completed successfully
2. Verify the `BASE_URL` environment variable (usually not needed)
3. Check browser console for 404 errors

### Can't Connect to ChatGPT

If ChatGPT can't connect:
1. Verify the Railway URL is public and accessible
2. Test the `/mcp` endpoint with curl
3. Ensure CORS is enabled (it is by default in the server)
4. Check Railway deployment status

## Cost Considerations

Railway offers:
- **Hobby plan**: $5/month starter credit (usually enough for 2 small apps)
- **Free trial**: Some free usage on new accounts

Both Pizzaz and Badevandet are lightweight servers, so should run comfortably on the Hobby plan.

## Updating Badevandet

When you want to update Badevandet:

1. Make changes to code
2. Commit and push to GitHub
3. Railway automatically redeploys
4. No need to reconnect in ChatGPT (URL stays the same)

## Alternative: One Project, Switch Commands

If you only want ONE deployment at a time, you can:

1. Keep the existing Railway project
2. When you want to switch from Pizzaz to Badevandet:
   - Update `railway.json` to use badevandet start command
   - Push to GitHub
   - Railway redeploys with Badevandet
3. Switch back by updating `railway.json` again

But this means only one will be available in ChatGPT at a time.

## Summary

**Recommended approach:** Create separate Railway projects for each app.

This gives you:
- ✅ Both apps available simultaneously
- ✅ Independent deployments
- ✅ Easy to manage and update
- ✅ Connect both to ChatGPT for different use cases

Happy deploying! 🚀🏖️

