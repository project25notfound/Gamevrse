# Quick Deploy Guide

## 1. Push to GitHub (Run these commands)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Gamevrse - Ready for Render deployment"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/gamevrse.git
git branch -M main
git push -u origin main
```

## 2. Deploy on Render

### Service 1: Homepage + Blackjack
- Go to: https://render.com/dashboard
- Click: **New +** → **Web Service**
- Connect your GitHub repo
- **Name**: `gamevrse-homepage`
- **Build Command**: `npm install`
- **Start Command**: `node server-homepage-blackjack.js`
- Click: **Create Web Service**
- **Copy the URL** (e.g., https://gamevrse-homepage.onrender.com)

### Service 2: ColorRush + Rankly
- Click: **New +** → **Web Service** again
- Connect same repo
- **Name**: `gamevrse-games`
- **Build Command**: `npm install`
- **Start Command**: `node server-colorrush-rankly.js`
- Click: **Create Web Service**
- **Copy the URL** (e.g., https://gamevrse-games.onrender.com)

## 3. Update Homepage URLs

Edit `public/index.html` and replace:

```javascript
// ColorRush button
onclick="window.location.href='https://YOUR-GAMES-URL.onrender.com/colorrush'"

// Rankly button  
onclick="window.location.href='https://YOUR-GAMES-URL.onrender.com/rankly'"

// Blackjack stays as:
onclick="window.location.href='/blackjack'"
```

Then push the update:
```bash
git add public/index.html
git commit -m "Update production URLs"
git push
```

## 4. Done! 🎉

Your games are now live:
- Homepage: https://gamevrse-homepage.onrender.com
- All games accessible from the homepage

**Note**: First load takes 30-60 seconds (cold start on free tier)
