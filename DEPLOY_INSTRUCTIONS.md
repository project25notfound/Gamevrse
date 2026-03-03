# Deployment Instructions - 4 Separate Services

## Current Status
- ✅ Homepage: https://gamevrse-homepage.onrender.com (LIVE)
- ✅ Blackjack: https://gamevrse-blackjack.onrender.com (LIVE - redeploying with fixes)
- ⏳ ColorRush: Need to deploy
- ⏳ Rankly: Need to deploy

## Step-by-Step Deployment

### Step 1: Delete Old Combined Service (if exists)
1. Go to Render Dashboard
2. Find service named `gamevrse-colorrush-rankly`
3. Click on it → Settings → Delete Service

### Step 2: Deploy ColorRush
1. Click "New +" → "Web Service"
2. Connect to GitHub: `project25notfound/Gamevrse`
3. Configure:
   - **Name**: `gamevrse-colorrush`
   - **Root Directory**: `game-colorrush`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
4. Click "Create Web Service"
5. Wait for deployment (takes 2-3 minutes)
6. Your URL will be: `https://gamevrse-colorrush.onrender.com`

### Step 3: Deploy Rankly
1. Click "New +" → "Web Service"
2. Connect to GitHub: `project25notfound/Gamevrse`
3. Configure:
   - **Name**: `gamevrse-rankly`
   - **Root Directory**: `game-rankly`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
4. Click "Create Web Service"
5. Wait for deployment (takes 2-3 minutes)
6. Your URL will be: `https://gamevrse-rankly.onrender.com`

### Step 4: Verify All Services
Once all deployments complete, test each URL:
- Homepage: https://gamevrse-homepage.onrender.com
- ColorRush: https://gamevrse-colorrush.onrender.com
- Rankly: https://gamevrse-rankly.onrender.com
- Blackjack: https://gamevrse-blackjack.onrender.com

## Troubleshooting

### If ColorRush shows "Not Found"
- Check Render logs for errors
- Verify Root Directory is exactly: `game-colorrush`
- Verify Start Command is: `node server.js`

### If Rankly shows "Not Found"
- Check Render logs for errors
- Verify Root Directory is exactly: `game-rankly`
- Verify Start Command is: `node server.js`
- Rankly uses ES modules, ensure Node version is 14+

### If Blackjack timer still shows 19000 seconds
- Wait for automatic redeploy to complete
- Or manually trigger redeploy from Render dashboard
- The fresh code has been pushed to GitHub

## Final URLs (After All Deployments)

All games will be accessible from the homepage at:
https://gamevrse-homepage.onrender.com

Direct game links:
- ColorRush: https://gamevrse-colorrush.onrender.com
- Rankly: https://gamevrse-rankly.onrender.com
- Blackjack: https://gamevrse-blackjack.onrender.com

## Notes
- First load may take 30 seconds (cold start on free tier)
- All services auto-deploy when you push to GitHub
- Homepage already has correct URLs configured
