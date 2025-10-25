# Kaixin (開心) - Chinese Poetry Lyrics Viewer

A minimalist, elegant web application for viewing synchronized Chinese lyrics with golden spotlight animation following the audio. Inspired by mahjong tiles on washi paper.

## Architecture

This application uses a clean, modular architecture with proper separation of concerns:

### File Structure

```
kaixin/
├── index.html                  # Entry point (minimal HTML)
├── song.mp4                    # Audio file
├── styles/                     # CSS modules
│   ├── reset.css              # CSS reset
│   ├── variables.css          # Design tokens & CSS variables
│   ├── typography.css         # Font & text styles
│   ├── stone.css              # Mahjong tile components
│   └── animations.css         # Golden glow effects
├── scripts/                    # JavaScript modules (ES6)
│   ├── main.js                # Application entry point
│   ├── state-manager.js       # Centralized state (observer pattern)
│   ├── audio-sync.js          # Audio timing engine
│   ├── verse-renderer.js      # DOM rendering
│   └── animation-controller.js # Visual feedback orchestration
└── data/
    └── dan-yuan-ren-chang-jiu.json # Song data with timestamps
```

## Core Components

### 1. StateManager
**Purpose**: Single source of truth for application state
- Implements observer pattern for reactive updates
- Components subscribe to state changes
- Prevents state management chaos

### 2. AudioSyncEngine
**Purpose**: Master clock that drives all timing
- Simple forward-only algorithm (no binary search complexity)
- Emits events: `character-change`, `verse-change`, `time-update`
- Handles seeking and time synchronization

### 3. VerseRenderer
**Purpose**: Renders verses as DOM, manages verse visibility
- Minimal DOM manipulation
- Stores references for efficient lookups
- Handles verse transitions

### 4. AnimationController
**Purpose**: Orchestrates visual feedback (golden glow)
- Pure CSS animations, JS only toggles classes
- No direct style manipulation
- Clean, declarative approach

## Design Principles

1. **Single Source of Truth**: One state object, one-way data flow
2. **Declarative Animations**: CSS handles ALL visual effects
3. **Separation of Concerns**: Data, Logic, Presentation clearly separated
4. **Event-Driven**: Components communicate through events
5. **Modularity**: Easy to add new songs or features

## Data Format

Song data is stored in JSON with this structure:

```json
{
  "metadata": {
    "title": "但願人長久",
    "artist": "鄧麗君",
    "audioFile": "./song.mp4"
  },
  "verses": [
    {
      "characters": [
        {"char": "明", "pinyin": "míng", "meaning": "bright", "time": 11.44}
      ],
      "translation": "When did the bright moon..."
    }
  ]
}
```

## Features

- ✨ **Golden Spotlight**: Smooth animation following sung characters
- 🎵 **Audio Sync**: Precise timing with forward-only algorithm
- 📜 **Verse Transitions**: Elegant fade in/out between verses
- ⏯️ **Plum Blossom Button**: Beautiful SVG play/pause control
- 📊 **Timeline Scrubber**: Interactive audio seeking
- ⌨️ **Keyboard Shortcuts**: Space to play/pause, Escape to stop
- 🎨 **Neumorphic Design**: White-on-white Japanese paper aesthetic

## Running the Application

Since this uses ES6 modules, you need to serve it through a web server (not file://).

### Quick Start (Easiest)

```bash
./serve.sh
```

Then open **http://localhost:8000/index.html** in your browser.

### Alternative Methods

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

### Important Notes

⚠️ **Do not open `index.html` directly** - ES6 modules require HTTP protocol
✅ **Always use a local server** - Access via `http://localhost:8000/index.html`
🔧 **Server is running** - A Python server is currently running on port 8000

## Adding New Songs

1. Create a new JSON file in `data/` directory
2. Follow the data format with character timestamps
3. Update `main.js` to load your JSON file
4. Add corresponding audio file

## Browser Support

- Modern browsers with ES6 module support
- Chrome, Firefox, Safari, Edge (latest versions)

## Design Credits

- Typography: Noto Serif SC (Google Fonts)
- Aesthetic: Inspired by traditional Chinese calligraphy and mahjong
- Colors: Warm white palette reminiscent of washi paper

## Legacy Files

- `kaixin-viewer-old.html` - Previous monolithic implementation (backup)
- `kaixin-viewer-individual.html` - Alternative version
- `lyrics-viewer.html` - Early prototype

These are kept for reference but the new modular architecture in `index.html` + modules is the recommended version.

