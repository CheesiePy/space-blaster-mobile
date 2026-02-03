# Space Blaster - Smart TV Game

A Phaser 2 CE space shooter game optimized for Smart TV platforms (webOS and Tizen).

## Project Structure

```
smart_tv_game/
├── index.html      # Main HTML (1080p fullscreen layout)
├── game.js         # Game logic with CursorManager
├── appinfo.json    # LG webOS manifest
├── config.xml      # Samsung Tizen manifest
└── README.md       # This file
```

## Features

- **Space Shooter Gameplay**: Destroy enemies, dodge bullets, achieve high scores
- **Smart TV Navigation**: Full D-pad (←→↑↓) and Enter key support
- **CursorManager Class**: Spatial navigation for menu screens
- **Safe Zone Compliance**: All UI elements stay 5% away from screen edges
- **Back Button Support**: webOS (461) and Tizen (10009) back keys handled
- **Geometric Assets**: No external image dependencies

## Controls

| Key | Action |
|-----|--------|
| ← → | Move ship left/right |
| Enter | Fire / Select menu |
| ↑ ↓ | Navigate menus |
| Back | Return to menu / Exit |

## Deployment

### LG webOS
1. Install webOS SDK
2. Package: `ares-package .`
3. Install: `ares-install --device <TV> com.openclaw.spaceblaster_1.0.0_all.ipk`

### Samsung Tizen
1. Install Tizen Studio
2. Build project as TV Web Application
3. Package and sign with your certificate
4. Deploy via Device Manager

## Testing Locally

Open `index.html` in a browser. The game runs at 1920x1080 resolution.

```bash
# Simple HTTP server
python -m http.server 8080
# or
npx serve .
```

## Technical Notes

- **Phaser 2 CE** loaded from CDN (v2.19.2)
- All game objects use Phaser Graphics (no external assets)
- Key codes follow Smart TV standards
- Resolution: 1920x1080 (Full HD)
