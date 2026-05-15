# Hermes Workspace (React 2D Simulation)

The standalone Hermes workspace is now a React + Vite single-page app.
Source lives in [`webui/`](../webui/); build output is committed to
[`static/nixon-workspace/`](./nixon-workspace/) so the existing URL keeps
working without any server-side changes.

## Layout

```
webui/
  index.html           Vite entry
  vite.config.js       outDir -> ../static/nixon-workspace
  src/
    main.jsx
    App.jsx            Top-level shell (Navbar + Workspace)
    styles.css         Dark theme, fixed navbar, mobile rules
    components/
      Navbar.jsx       Fixed top bar, hamburger on mobile
      Workspace.jsx    Floor plan + simulation tick
      Room.jsx         Absolute-positioned room with furniture
      Agent.jsx        PNG sprite + name label, animates via CSS
  public/sprites/      dev.png, manager.png, ops.png, research.png
```

## Running

### Production build

```bash
cd webui
npm install
npm run build
```

Then open <http://localhost:8081/nixon-workspace/> via the bundled preview
script:

```bash
python3 test_nixon_workspace.py
```

### Hot-reload development

```bash
cd webui
npm install
npm run dev
```

This serves the app from Vite's dev server on <http://localhost:5173>.

## Design notes

* **Navbar**: `position: fixed; top: 0; height: 60px; z-index: 100`.
  Always visible, always clickable, never overlapped by the workspace.
* **Workspace**: `position: absolute; top: 60px; height: calc(100dvh - 60px)`.
  Uses `dvh` so mobile Safari's URL bar can't crop it.
* **Mobile**: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
  No horizontal overflow, no zoom. Below 768 px the link list collapses
  into a hamburger menu.
* **Rooms** are absolute % boxes inside the workspace, so they scale to
  any viewport. Engineering / Research / Operations / Meeting / Lounge.
* **Agents** are PNG sprites positioned with `left/top` percentages and
  a CSS `transition` that animates their movement smoothly. A 4 s tick
  picks new positions; no `requestAnimationFrame` loop is needed.
