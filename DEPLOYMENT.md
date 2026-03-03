# Gamevrse Deployment Guide

## Deploy to Render via GitHub

### Prerequisites
1. GitHub account
2. Render account (https://render.com)
3. Git installed locally

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Gamevrse with 3 games"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/gamevrse.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

#### Option A: Using render.yaml (Recommended)
1. Go to https://render.com/dashboard
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create 3 services:
   - gamevrse-colorrush (main homepage + ColorRush)
   - gamevrse-rankly (Rankly game)
   - gamevrse-blackjack (Blackjack game)

#### Option B: Manual Setup (Alternative)
1. Create 3 separate Web Services on Render
2. For each service, configure:

**Service 1: ColorRush (Main)**
- Name: gamevrse-colorrush
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment: `PORT=10000`

**Service 2: Rankly**
- Name: gamevrse-rankly
- Build Command: `cd family-feud-game && npm install`
- Start Command: `cd family-feud-game && node server.js`
- Environment: `PORT=10001`

**Service 3: Blackjack**
- Name: gamevrse-blackjack
- Build Command: `npm install`
- Start Command: `node start-blackjack.js`
- Environment: `PORT=10002`

### Step 3: Update Game Links

After deployment, you'll get 3 URLs like:
- https://gamevrse-colorrush.onrender.com
- https://gamevrse-rankly.onrender.com
- https://gamevrse-blackjack.onrender.com

Update `public/index.html` to use these URLs instead of localhost.

### Important Notes

1. **Free Tier Limitations**: Render's free tier spins down after 15 minutes of inactivity
2. **Cold Starts**: First request after spin-down takes 30-60 seconds
3. **WebSocket Support**: Render supports WebSocket connections (required for Socket.IO)
4. **Environment Variables**: Set `NODE_ENV=production` for all services

### Troubleshooting

- If builds fail, check the build logs in Render dashboard
- Ensure all dependencies are in package.json
- Check that ports are correctly configured
- Verify WebSocket connections are working

### Local Development

```bash
# Start all games locally
npm start                    # ColorRush on port 3000
node start-rankly.js        # Rankly on port 3001
node start-blackjack.js     # Blackjack on port 3002
```
