// ERNDUB — station seeds + sidebar genre map
// Live lists come from Radio Browser; seeds fill the drawer when the API is slow/down.

window.STATIONS = window.STATIONS || [];

window.GENRES = window.GENRES || [
  "SOMAFM", "JAZZ", "HOUSE", "TECHNO", "TRANCE", "AMBIENT",
  "SYNTHWAVE", "ROCK", "POP", "CLASSICAL", "CHILL", "NEWS",
  "DISCO", "FUNK", "SOUL", "METAL", "INDIE", "FOLK"
];

/**
 * Sidebar sections → genre / tag labels.
 * renderGenreList() reads window.GENRE_MAP; without it the sidebar stays empty.
 */
window.GENRE_MAP = window.GENRE_MAP || {
  "BROADCASTERS": [
    "SOMAFM", "BBC", "NPR", "CLASSIC FM"
  ],
  "ELECTRONIC": [
    "HOUSE", "TECHNO", "TRANCE", "AMBIENT", "SYNTHWAVE",
    "DRUM AND BASS", "DUBSTEP", "CHILL", "LOFI"
  ],
  "MUSIC": [
    "JAZZ", "ROCK", "POP", "CLASSICAL", "METAL",
    "INDIE", "FOLK", "SOUL", "FUNK", "DISCO", "BLUES", "COUNTRY"
  ],
  "TALK": [
    "NEWS", "TALK", "SPORTS", "COMEDY"
  ]
};

/**
 * Offline / API-fallback seeds — multi-URL where useful.
 * fetchStations() merges these when Radio Browser returns empty or fails.
 */
window.STATION_SEEDS = window.STATION_SEEDS || {
  SOMAFM: [
    { name: "SomaFM Groove Salad", stationuuid: "seed-somafm-gs", tags: "ambient chill", url: "https://ice1.somafm.com/groovesalad-128-mp3", url_resolved: "https://ice2.somafm.com/groovesalad-128-mp3", bitrate: 128 },
    { name: "SomaFM Drone Zone", stationuuid: "seed-somafm-dz", tags: "ambient", url: "https://ice1.somafm.com/dronezone-128-mp3", url_resolved: "https://ice2.somafm.com/dronezone-128-mp3", bitrate: 128 },
    { name: "SomaFM Lush", stationuuid: "seed-somafm-lush", tags: "vocal ambient", url: "https://ice1.somafm.com/lush-128-mp3", url_resolved: "https://ice2.somafm.com/lush-128-mp3", bitrate: 128 },
    { name: "SomaFM DEF CON", stationuuid: "seed-somafm-defcon", tags: "electronica", url: "https://ice1.somafm.com/defcon-128-mp3", url_resolved: "https://ice2.somafm.com/defcon-128-mp3", bitrate: 128 }
  ],
  JAZZ: [
    { name: "SomaFM Jazz Straight Ahead", stationuuid: "seed-somafm-jazz", tags: "jazz", url: "https://ice1.somafm.com/jazzstraightahead-128-mp3", url_resolved: "https://ice2.somafm.com/jazzstraightahead-128-mp3", bitrate: 128 },
    { name: "Radio Swiss Jazz", stationuuid: "seed-swiss-jazz", tags: "jazz", url: "https://stream.srg-ssr.ch/rsj/mp3_128.m3u", url_resolved: "https://stream.srg-ssr.ch/m/rsj/mp3_128", bitrate: 128 }
  ],
  AMBIENT: [
    { name: "SomaFM Deep Space One", stationuuid: "seed-somafm-dso", tags: "ambient space", url: "https://ice1.somafm.com/deepspaceone-128-mp3", url_resolved: "https://ice2.somafm.com/deepspaceone-128-mp3", bitrate: 128 },
    { name: "SomaFM Space Station", stationuuid: "seed-somafm-ss", tags: "ambient", url: "https://ice1.somafm.com/spacestation-128-mp3", url_resolved: "https://ice2.somafm.com/spacestation-128-mp3", bitrate: 128 }
  ],
  CHILL: [
    { name: "SomaFM Groove Salad", stationuuid: "seed-chill-gs", tags: "chill", url: "https://ice1.somafm.com/groovesalad-128-mp3", url_resolved: "https://ice2.somafm.com/groovesalad-128-mp3", bitrate: 128 },
    { name: "SomaFM Illinois Street Lounge", stationuuid: "seed-somafm-isl", tags: "lounge", url: "https://ice1.somafm.com/illstreet-128-mp3", url_resolved: "https://ice2.somafm.com/illstreet-128-mp3", bitrate: 128 }
  ],
  SYNTHWAVE: [
    { name: "SomaFM Metal Detector", stationuuid: "seed-metal-det", tags: "metal", url: "https://ice1.somafm.com/metal-128-mp3", url_resolved: "https://ice2.somafm.com/metal-128-mp3", bitrate: 128 },
    { name: "SomaFM Underground 80s", stationuuid: "seed-ug80s", tags: "synth new wave", url: "https://ice1.somafm.com/u80s-128-mp3", url_resolved: "https://ice2.somafm.com/u80s-128-mp3", bitrate: 128 }
  ],
  HOUSE: [
    { name: "SomaFM Beat Blender", stationuuid: "seed-beatblend", tags: "house downtempo", url: "https://ice1.somafm.com/beatblender-128-mp3", url_resolved: "https://ice2.somafm.com/beatblender-128-mp3", bitrate: 128 }
  ],
  TECHNO: [
    { name: "SomaFM The Trip", stationuuid: "seed-thetrip", tags: "techno progressive", url: "https://ice1.somafm.com/thetrip-128-mp3", url_resolved: "https://ice2.somafm.com/thetrip-128-mp3", bitrate: 128 }
  ],
  ROCK: [
    { name: "SomaFM Boot Liquor", stationuuid: "seed-boot", tags: "americana rock", url: "https://ice1.somafm.com/bootliquor-128-mp3", url_resolved: "https://ice2.somafm.com/bootliquor-128-mp3", bitrate: 128 }
  ],
  CLASSICAL: [
    { name: "Radio Swiss Classic", stationuuid: "seed-swiss-classic", tags: "classical", url: "https://stream.srg-ssr.ch/rsc_de/mp3_128.m3u", url_resolved: "https://stream.srg-ssr.ch/m/rsc_de/mp3_128", bitrate: 128 }
  ],
  NEWS: [
    { name: "NPR News Now (AAC)", stationuuid: "seed-npr", tags: "news", url: "https://npr-ice.streamguys1.com/live.mp3", url_resolved: "https://npr-ice.streamguys1.com/live.mp3", bitrate: 128 }
  ]
};
