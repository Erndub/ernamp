ERNDUB AUDIO

ERNDUB AUDIO v0.9 Modular is a highly customized, skinable web-based media player (primarily radio/internet audio + local files + video) with a strong retro/hi-fi/arcade aesthetic. It is built around a chassis UI with sidebar, CRT-style stage, and footer controls, and is powered by Video.js plus extensive custom JavaScript modules.
Core Architecture & Files

Main file: ernamp.html (the complete player shell, CSS, layout, and most app logic).
skins.js: Large collection of pre-defined visual themes + live skin editor support.
stations.js: Genre map / station categorization.
visualizers.js: Dozens of audio-reactive visualizer modes + special modes.
games.js: Full arcade layer with built-in games, emulation, and embeds.
utilities.js: In-CRT utilities panel (open-directory search, Drive, links, etc.).
Additional integrations: Video.js, Ruffle (Flash), EmulatorJS-style cores, Google Fonts (Share Tech Mono / VT323).

Major Feature Categories
1. Audio / Media Playback

Internet radio / station streaming with genre browsing and search.
Local file support (“My Files” drawer + sidebar mini-browser).
Playlist management (drawer with ADD / CLEAR, sticky header, history, favorites, last played).
Video.js engine for audio + video.
Full transport controls, seek bar, volume, and telemetry.
Fullscreen mode with auto-hiding chrome (title, seek, transport, FS/CC buttons).
Subtitle/CC button (shown in VIDEO_MODE).
Stage title hover / station label handling.
Compact / responsive scaling for smaller screens.

2. Visualizers (visualizers.js – extensive curated set)
Utility / special modes:

INFO-HUD, VIDEO_MODE, VIS_OFF, GAMES, PIC, AI-VIDEO, DEBUG-HUD, UTILITIES

Classic & geometric:

GLISTEN, RUMPLE, POLAR, VU-METER, SINGULARITY, LED-BAR, SPIRALS, PARTICLES, PARTICLES2, UNKNOWN-PLEASURES, THOREAU-MESH, RIDGE-RUN, SPECTRAL-FALL, LISSAJOUS-SCOPE, RADIAL-RIBS, HELIX-LADDER, STRING-FIELD, MOIRE-WAVE

Colour / spectrum analysis:

SPECTRUM-HEATMAP, SPECTRO-WATERFALL, HEAT-SPIRAL, CIRCULAR-EQ, PEAK-HOLD-BARS

Genre-tuned:

VOCAL-AURORA, PHONEME-RINGS, TECHNO-KICK-GRID, TRANCE-TUNNEL, POP-BOUNCE-BARS, DNB-STREAKS, LOFI-DUST, SYNTHWAVE-SUN, METAL-LIGHTNING, RAVE-STROBE, JAZZ-SMOKE, AMBIENT-CHLADNI

Signature / unique:

NEON-TUNNEL, PLASMA-STORM, KALEIDO-BLOOM, REACTION-DIFFUSION, CRT-SCOPE, HYPERSPACE, AURA-ORB, LAVA-LAMP, NEURAL-NET, SOLAR-FLARE, THE-EYE, DARK-MATTER, MATRIX-RAIN, FERROFLUID, OSCILLOSCOPE-XY, WINAMP-HYPERSPACE, TRON, KOI-POND, GEOMETRIC-BLOOM, VOLUMETRIC-LED-FIELD, ENERGY-UNLOCKED, BITLESS, POINT-CLOUD, UKG-SKYLINE-PULSE

Special highlights:

AI-VIDEO: Procedural “AI cinema” scenes seeded by the current track (deterministic per track, audio-reactive camera/crowds/FX, letterboxed).
PIC: Album-art / image display with bass reaction.
Soft-trail, heatmaps, particle systems, phosphor-style scopes, etc.

3. Skins & Theming (skins.js + Omni-Forge)

Large library of named skins (Amiga Cream, Obsidian Neon, Baltic Birch, Vantablack, Phased Array, Midnight Tokyo, Walnut Hi-Fi, Cyberdeck, Synthwave 84, Matrix Rain, Candy Stripes, Aurora Borealis, etc.).
CSS custom properties for chassis, panels, borders, text, accent, knobs (conic gradients), textures (wood, linen, brushed, grain, dots, stripes…), CRT background, LEDs, radius, glow.
Live Omni-Forge skin editor (#forge):
Edit chassis gradient (S1/S3/S5 + angle).
Core identity (panel / border / text / accent).
Sidebar & footer tint + alpha.
CRT background + custom viz picture upload.
Texture type, blend mode, opacity, scale.
5-stop knob gradient with live preview.
Snapshot / load presets (localStorage), export skins.js entry, copy JSON.

Animated skin classes (pulse glow, rainbow border, wave, glitter, matrix rain).
Metal variants and many gradient / patterned / neon themes.

4. Station / Content Organization (stations.js)
Genre map includes:

SYSTEM: Last Played, History, Favorites
BROADCASTERS: BBC, NTS, KEXP, FIP, SomaFM, Worldwide FM, Rinse FM, Dublab
ELECTRONIC, GROOVE, ROCK & ALT, HIP-HOP, GLOBAL, ATMOSPHERE, DECADES
Search box and genre list in the sidebar.

5. Arcade / Games Layer (games.js)

Full-screen games mode overlaid on the stage.
Built-in canvas engines:
Tetris (full bag randomizer, scoring, levels, ghost, hard drop, etc.)
Breakout & Snake (demo slots)
Sandpit 107: Advanced falling-sand reactor (wind, heat, cloners, mites, fungus, rockets, thermite, void, plasma, gravity control, demo scenes, fireworks…)

Emulation slots (EmulatorJS-style):
Game Boy / Game Boy Color
Sega Genesis / Mega Drive
Local ROM file picking or URL

Iframe / itch.io / custom web embeds
Ruffle Flash (.swf) support
Gamepad keymap + virtual controls support
Menu with titles, genres, descriptions, and controls help

6. Utilities Layer (utilities.js)
In-CRT tabbed panel:

Open Dir: Google/DuckDuckGo/Bing dork search for open directories / indexes (quick chips for audio, video, books, ZIP, FTP, backups…).
Drive: Google Drive embed (with fallback open-in-new-tab).
My Links: Editable, persisted link list (plain URLs or Markdown-style [label](url)), preview mode.
Two blank tabs for future expansion.

7. UI / UX Details

Chassis layout: left sidebar (genres + local mini-browser + mode LCD), large CRT stage, multi-column footer.
Mode LCD readout (marquee when long).
“Oh no” face easter-egg (clickable, animated blink).
About overlay.
Drawer for playlists / My Files / Forge editor (auto-close timer, sticky chrome).
Fullscreen stage expansion with chrome auto-hide on idle.
Responsive scaling + compact mode.
Heavy use of mono fonts, LED/knob aesthetics, texture overlays, and skin-driven colors/glows.

8. Technical / Extensibility

Modular script loading (skins, stations, visualizers, games, utilities).
LocalStorage for forge drafts/presets, utility links, etc.
Ruffle for Flash.
Video.js for media.
Canvas-based everything for visualizers and inline games.
Support for local files, remote streams, ROMs, SWFs, and iframe games.
Debug / info HUDs and error fallbacks in the visualizer system.

This is essentially a full “media workstation + arcade + utilities + skin laboratory” packaged as a single modular web app with a strong retro/hi-fi visual identity. The accompanying files give you deep customization of appearance (skins + Forge), dozens of reactive visualizations, a complete mini-arcade, and practical utilities, all integrated into one chassis.
