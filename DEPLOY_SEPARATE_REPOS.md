# Deploy Each Game as Separate Repository

## Overview
Each game will be deployed as a separate Render service from its own GitHub repository.

## Step 1: Create 4 GitHub Repositories

1. **gamevrse-homepage** - Main landing page
2. **gamevrse-colorrush** - ColorRush game
3. **gamevrse-rankly** - Rankly game  
4. **gamevrse-blackjack** - Blackjack Roulette game

## Step 2: Push Each Game to GitHub

### Homepage
```bash
cd gamevrse
git init
git add public/ homepage-server.js package.json
git commit -m "Homepage"
git remote add origin https://github.com/YOUR_USERNAME/gamevrse-homepage.git
git push -u origin main
```

### ColorRush
```bash
cd game-colorrush
git init
git add .
git commit -m "ColorRush game"
git remote add origin https://github.com/YOUR_USERNAME/gamevrse-colorrush.git
git push -u origin main
```

### Rankly
```bash
cd game-rankly
git init
git add .
git commit -m "Rankly game"
git remote add origin https://github.com/YOUR_USERNAME/gamevrse-rankly.git
git push -u origin main
```

### Blackjack
```bash
cd game-blackjack
git init
git add .
git commit -m "Blackjack game"
git remote add origin https://github.com/YOUR_USERNAME/gamevrse-blackjack.git
git push -u origin main
```

## Step 3: Deploy on Render

For each repository, create a new Web Service on Render:

### Homepage Service
- **Name**: gamevrse-homepage
- **Repository**: gamevrse-homepage
- **Build Command**: `npm install`
- **Start Command**: `node homepage-server.js`
- **Environment Variables**: None needed

### ColorRush Service
- **Name**: gamevrse-colorrush
- **Repository**: gamevrse-colorrush
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**: None needed

### Rankly Service
- **Name**: gamevrse-rankly
- **Repository**: gamevrse-rankly
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**: None needed

### Blackjack Service
- **Name**: gamevrse-blackjack
- **Repository**: gamevrse-blackjack
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**: None needed

## Step 4: Update Homepage Links

After deployment, you'll get URLs like:
- https://gamevrse-homepage.onrender.com
- https://gamevrse-colorrush.onrender.com
- https://gamevrse-rankly.onrender.com
- https://gamevrse-blackjack.onrender.com

Update `public/index.html` in the homepage repository:

```javascript
// Replace localhost URLs with your Render URLs
onclick="window.open('https://gamevrse-colorrush.onrender.com', '_blank')"
onclick="window.open('https://gamevrse-rankly.onrender.com', '_blank')"
onclick="window.open('https://gamevrse-blackjack.onrender.com', '_blank')"
```

Then commit and push the changes:
```bash
git add public/index.html
git commit -m "Update game URLs for production"
git push
```

Render will automatically redeploy the homepage.

## Benefits of Separate Repositories

1. ✅ Each game can be updated independently
2. ✅ Easier to manage and debug
3. ✅ Better for team collaboration
4. ✅ Cleaner deployment process
5. ✅ Each game has its own logs and metrics

## Notes

- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- All services support WebSocket connections (required for Socket.IO)
