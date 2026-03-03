# Deploy Gamevrse to Render

## Overview
We'll deploy 2 services on Render:
1. **Server 1**: Homepage + Blackjack (port 3000)
2. **Server 2**: ColorRush + Rankly (port 3001)

## Step 1: Prepare Your GitHub Repository

### Initialize Git and Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Gamevrse with 2 combined servers"

# Create a new repository on GitHub (https://github.com/new)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/gamevrse.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Server 1 (Homepage + Blackjack)

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Service Configuration:**
- **Name**: `gamevrse-homepage`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server-homepage-blackjack.js`
- **Instance Type**: `Free`

**Environment Variables:**
- `NODE_ENV` = `production`

5. Click **"Create Web Service"**
6. Wait for deployment (takes 2-5 minutes)
7. Copy the URL (e.g., `https://gamevrse-homepage.onrender.com`)

## Step 3: Deploy Server 2 (ColorRush + Rankly)

1. Click **"New +"** → **"Web Service"** again
2. Connect the same GitHub repository
3. Configure the service:

**Service Configuration:**
- **Name**: `gamevrse-games`
- **Region**: Same as Server 1
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server-colorrush-rankly.js`
- **Instance Type**: `Free`

**Environment Variables:**
- `NODE_ENV` = `production`

4. Click **"Create Web Service"**
5. Wait for deployment
6. Copy the URL (e.g., `https://gamevrse-games.onrender.com`)

## Step 4: Update Homepage Links

After both services are deployed, update `public/index.html` with your production URLs:

```javascript
// Replace the game links with your Render URLs
// ColorRush
onclick="window.location.href='https://gamevrse-games.onrender.com/colorrush'"

// Rankly
onclick="window.location.href='https://gamevrse-games.onrender.com/rankly'"

// Blackjack stays on same server
onclick="window.location.href='/blackjack'"
```

Then commit and push:
```bash
git add public/index.html
git commit -m "Update game URLs for production"
git push
```

Render will automatically redeploy Server 1 with the updated links.

## Step 5: Test Your Deployment

Visit your homepage URL:
- `https://gamevrse-homepage.onrender.com`

Click on each game to test:
- ✅ Blackjack (same server)
- ✅ ColorRush (redirects to games server)
- ✅ Rankly (redirects to games server)

## Important Notes

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- Cold start takes 30-60 seconds on first request
- 750 hours/month free (enough for 2 services running 24/7)

### WebSocket Support
- Render fully supports WebSocket connections
- Socket.IO will work without additional configuration

### Custom Domain (Optional)
- You can add a custom domain in Render dashboard
- Example: `gamevrse.com` → Server 1
- Example: `games.gamevrse.com` → Server 2

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### Games Don't Load
- Check browser console for errors
- Verify URLs are correct (https, not http)
- Check that WebSocket connections are established

### Cold Start Issues
- First request after 15 min takes longer
- Consider upgrading to paid tier for always-on services
- Or use a service like UptimeRobot to ping your apps

## Monitoring

Render provides:
- Real-time logs
- Metrics (CPU, memory, bandwidth)
- Deploy history
- Automatic HTTPS certificates

## Cost

**Free Tier:**
- 2 web services = FREE
- 750 hours/month each
- Automatic HTTPS
- Custom domains supported

**Paid Tier** (if needed):
- $7/month per service
- Always-on (no cold starts)
- More resources

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Deploy Server 1 on Render
3. ✅ Deploy Server 2 on Render
4. ✅ Update homepage URLs
5. ✅ Test all games
6. 🎉 Share your live game hub!

Your Gamevrse will be live at:
- **Homepage**: `https://gamevrse-homepage.onrender.com`
- **Games Server**: `https://gamevrse-games.onrender.com`
