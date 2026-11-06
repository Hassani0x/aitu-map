# AITU Map

A mobile-first campus guide for **Astana IT University**, with searchable rooms, walking routes, phone geolocation, and 2D/3D floor views.

**[Open the app](https://aitu-campus-map.vercel.app)** · [Telegram @hhassani1](https://t.me/hhassani1) · [GitHub Hassani0x](https://github.com/Hassani0x)

<img src="public/aitu-logo.png" alt="Astana IT University" width="270">

## Features

- 262 searchable destinations across three floors
- Normal, 2D, and interactive 3D views
- Phone and tablet layouts with touch controls
- Room-to-room routing with stair connections
- Real phone-location updates with accuracy and freshness checks
- Two-point indoor map alignment
- Manual waypoints and a separately labelled animated preview
- Saved places and shareable route links

## Location and accuracy

The app uses the browser Geolocation API (watchPosition) for genuine phone updates. Permission is requested only after tapping **Use my location**. Coordinates and alignment stay in memory on your device and are not uploaded. Stopping tracking clears the watcher. Saved bookmarks use local storage.

The original plans have no geographic coordinates and there is no deployed BLE or Wi-Fi positioning infrastructure. **Accurate room-level indoor tracking is not guaranteed.** GPS can be unreliable indoors.

### Enable approximate indoor guidance

1. Open the HTTPS app on your phone and tap **Find a place**.
2. Tap **Use my location**, allow permission, and select your current floor.
3. Open **Set up indoor alignment**. Stand at a known room doorway, select it, and capture the first point.
4. Walk to a second known doorway far away, select it, and capture the second point.
5. Both fixes must have reported accuracy of 10 m or better. The baseline must be at least 60 m and at least four times the combined reported errors.
6. Choose a destination and start directions. The route updates from your aligned location while the signal is usable.

Alignment is approximate, has not been surveyed or tested on site, and must be repeated after a reload. Floor selection remains manual. A fix older than 15 seconds, less accurate than 10 m, or outside the aligned map cannot drive live indoor guidance. Manual directions remain available.

Reliable indoor positioning needs surveyed geographic alignment and suitable positioning infrastructure. The app never substitutes simulated preview movement for GPS.

## Map limitations

Plans are archival; check current campus signs. Routes use stairs and are not accessibility or emergency guidance. Precise distances and walking times are not claimed. 3D extrudes room footprints to an illustrative height, not a measured architectural model. WebGL is required for 3D; 2D remains available.

Disconnected source geometry prevents routing to C1.1.228P and C1.1.230P (floor 2), and C1.2.320 (floor 3). These connections display unavailable routes.

## Development

Requires Node.js 24 and npm.

```sh
git clone https://github.com/Hassani0x/aitu-map.git
cd aitu-map
npm ci
npm run dev
```

```sh
npm test          # Routing, geometry, alignment and location validation
npm run build     # Production output: dist/
npm run preview   # Preview production locally
```

Use HTTPS for phone geolocation testing. A laptop LAN HTTP address generally is not a secure context.

## Architecture

| Path | Purpose |
| --- | --- |
| app/App.jsx | Mobile shell, search, routes and floor controls |
| app/LocationPanel.jsx | Location watcher, accuracy and alignment UI |
| app/location.js | Geographic alignment and fix validation |
| app/Map3D.jsx | Lazy-loaded Three.js room geometry and touch controls |
| app/routing.js | Walkable grid, wall checks, smoothing and progress |
| app/rooms.json | Destination metadata |
| public/maps/ | Original SVG floor plans |
| src/ | Preserved original source |
| scripts/extract_maps.py | Geometry extraction; requires Python and Pillow |

## Deployment

Import the repository into Vercel with the Vite preset, build command `npm run build`, and output `dist`. Configuration is in vercel.json. No database or API key is needed. Cloudflare Pages can also serve the static dist folder.

## Contributing

Floor-plan corrections are welcome. Include floor, block, room number, and evidence for geometry changes. Run tests and the production build before submitting changes. Never commit coordinates, alignment captures, or credentials.

## Maintainer and attribution

[Hassani0x](https://github.com/Hassani0x) · [Telegram @hhassani1](https://t.me/hhassani1)

Original source and geometry: [Yuujiso/aitumap](https://github.com/Yuujiso/aitumap), MIT. Original LICENSE.md retained. University branding belongs to its respective owner; this community project does not imply university endorsement. Workflow acknowledgements are in NOTICE.md.
