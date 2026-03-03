# Deployment Fix - Separate Services

## Problem
- ColorRush CSS not loading (expects `/style.css` but served from `/colorrush/style.css`)
- Rankly not found (route configuration issue)
- Both games expect files at root path, not subpaths

## Solution: Deploy 4 Separate Services

Instead of combining games, deploy each separately:

### Service 1: Homepage
- **Root Directory**: `.` (root)
- **Build Command**: `npm install`
- **Start Command**: `node server-homepage-only.js`
- **URL**: https://gamevrse-homepage.onrender.com
- **Status**: ✅ Live

### Service 2: ColorRush
- **Root Directory**: `game-colorrush`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **URL**: https://gamevrse-colorrush.onrender.com
- **Status**: ⏳ Need to deploy

### Service 3: Rankly
- **Root Directory**: `game-rankly`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **URL**: https://gamevrse-rankly.onrender.com
- **Status**: ⏳ Need to deploy

### Service 4: Blackjack
- **Root Directory**: `game-blackjack`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **URL**: https://gamevrse-blackjack.onrender.com
- **Status**: ✅ Live

## Next Steps

1. Delete Service 2 (gamevrse-colorrush-rankly) from Render
2. Create new Service 2: ColorRush
   - Root Directory: `game-colorrush`
   - Name: `gamevrse-colorrush`
3. Create new Service 3: Rankly
   - Root Directory: `game-rankly`
   - Name: `gamevrse-rankly`
4. Update homepage URLs to point to new services
5. Commit and push changes

## Updated Homepage URLs

```javascript
// ColorRush
onclick="window.open('https://gamevrse-colorrush.onrender.com', '_blank')"

// Rankly
onclick="window.open('https://gamevrse-rankly.onrender.com', '_blank')"

// Blackjack
onclick="window.open('https://gamevrse-blackjack.onrender.com', '_blank')"
```
