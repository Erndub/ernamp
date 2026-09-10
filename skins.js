/**
 * ERNDUB AUDIO - SKIN DEFINITIONS
 * These values map directly to the CSS :root variables in index.html
 */

const SKINS = {
"Amiga Cream": { 
    bg: "#F8F4E6", 
    panel: "#ECE4C8", 
    border: "#D7CB9E", 
    text: "#302F26", 
    textDim: "#73715C", 
    accent: "#BB8844", 
    ledOff: "#BBBB88", 
    crtBg: "#050110", 
    knob: "conic-gradient(#ECE4C8, #F8F4E6, #D7CB9E, #ECE4C8)", 
    
    /* THE SUBTLE TIGHT DOTTED LOOK */
    surface: "radial-gradient(rgba(0,0,0,0.08) 0.5px, transparent 0.5px)", 
    size: "2px 2px",
    
    led: { shape: "50%", glow: "0 0 6px #BB8844", count: 6 } 
},

    "Industrial Beige": {
        bg: "#D9D4C2", panel: "#C7C1AD", border: "#A6A08A", text: "#2A2821",
        accent: "#FF5500", ledOff: "#BBB7A0",
        knob: "conic-gradient(#C7C1AD, #D9D4C2, #A6A08A, #C7C1AD)",
        surface: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)", size: "4px 4px"
    },

    "Obsidian Neon": {
        bg: "#0D0D0D", panel: "#151515", border: "#222222", text: "#00D4FF",
        accent: "#00D4FF", ledOff: "#111", crtBg: "#000",
        knob: "conic-gradient(#222, #0D0D0D, #222)", surface: "none"
    },

"Baltic Birch": {
    // Uses a repeating grain pattern as the base chassis background
     bg: "repeating-linear-gradient(90deg, #BFAF8F 0px, #BFAF8F 5px, #BFAF8F 5px, #BFAF8F 7px, #BFAF8F 7px, #F8F4E6 12px, #BFAF8F 12px, #F8F4E6 14px)",
    
    // Defined separately to allow the chassis grain to show through or be tinted
    sidebar: "rgba(0, 0, 0, 0.03)", 
    footer: "rgba(0, 0, 0, 0.05)",
    
    border: "#BFAF8F", 
    text: "#4A453A", 
    accent: "#8B7E66",
    
    // Conic gradient ensures the JS engine renders the knob correctly
    knob: "conic-gradient(#E8DCC4, #C4B9A3, #BFAF8F, #E8DCC4)",
    
    // Subtle surface texture to simulate wood pores
    surface: "radial-gradient(#BFAF8F 0.5px, transparent 0.5px)"
},

"Vantablack V2": {
    bg: "#050505",
    panel: "#0a0a0a",
    sidebar: "transparent",
    footer: "#0a0a0a",
    border: "#111",
    text: "#fff",
    accent: "#ffffff",
    // Extreme conic gradient for high-contrast "spun metal"
    knob: "conic-gradient(from 0deg, #000, #333, #000, #333, #000)",
    surface: "none"
},

"Phased Array": {
        bg: "linear-gradient(90deg, #0f1715 0%, #1a2b27 50%, #0f1715 100%)",
        sidebar: "rgba(0, 0, 0, 0.4)",
        footer: "rgba(0, 50, 40, 0.6)",
        panel: "#121f1b",
        border: "#00ffcc",
        text: "#aafff0",
        accent: "#00ffcc",
        crtBg: "#050a09",
        knob: "conic-gradient(from 180deg at 50% 50%, #00ffcc 0%, #050a09 25%, #00ffcc 50%, #050a09 75%, #00ffcc 100%)",
        surface: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 255, 204, 0.05) 2px)",
        size: "100% 3px",
        radius: "0px",
        led: { shape: "2px", glow: "0 0 12px #00ffcc, 0 0 4px #ffffff", count: 16 }
    },

"Midnight Tokyo": {
    // Tests: High-saturation neon glow
    bg: "#1a1a2e", 
    sidebar: "transparent", // Let the deep navy flow through
    footer: "#16213e", 
    panel: "#16213e", 
    border: "#0f3460", 
    text: "#e94560",
    accent: "#e94560", 
    knob: "conic-gradient(#16213e, #0f3460, #16213e)",
    led: { shape: "2px", glow: "0 0 10px #e94560" }, // Testing square LEDs
    surface: "none"
},
    
"Retro Spectraply": {
    bg: "repeating-linear-gradient(180deg, #8b5a2b 0px, #8b5a2b 5px, #20b2aa 5px, #20b2aa 7px, #cd853f 7px, #cd853f 12px, #ff8c00 12px, #ff8c00 14px)",
    // Define these separately so they can have their own gradients or colors
    sidebar: "transparent", 
    footer: "rgba(0,0,0,0.1)",
    border: "#5d3a1a", 
    text: "#ffffff", 
    accent: "#00ffee",
    knob: "conic-gradient(#cd853f, #8b5a2b, #5d3a1a, #cd853f)",
    surface: "none"
},
	
    "Brushed Champagne": { bg: "#F0EAD6", panel: "#E8E1CC", border: "#D8D0BA", text: "#3E3722", textDim: "#786F55", accent: "#A67F4F", ledOff: "#C2BCAD", crtBg: "#E0DCC8", knob: "linear-gradient(135deg, #FFF, #C0B080 30%, #FFF 60%, #C0B080)", surface: "none", size: "0px" },
    "Walnut Hi-Fi": { bg: "#3d2b1f", panel: "#4d3b2f", border: "#2d1b0f", text: "#e0c090", textDim: "#8d6b4f", accent: "#ff9000", ledOff: "#2d1b0f", crtBg: "#0a0805", knob: "conic-gradient(#5d4b3f, #3d2b1f, #5d4b3f)", surface: "radial-gradient(rgba(0,0,0,0.2) 0.5px, transparent 0.5px)", size: "2px 2px" },
    "Hammered Tin": { bg: "#888", panel: "#777", border: "#555", text: "#FFF", textDim: "#BBB", accent: "#00FFCC", ledOff: "#444", crtBg: "#050505", knob: "conic-gradient(#999, #666, #999)", surface: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", size: "6px 6px" },
    "Carbon Weave": { bg: "#1a1a1a", panel: "#111", border: "#000", text: "#00FF00", textDim: "#004400", accent: "#00FF00", ledOff: "#050505", crtBg: "#000", knob: "radial-gradient(#333, #000)", surface: "repeating-linear-gradient(45deg, #222, #222 2px, #111 2px, #111 4px)", size: "4px 4px" },
    "Military Grade": { bg: "#4B5320", panel: "#3E441A", border: "#2E3314", text: "#D0D0B0", textDim: "#7B8150", accent: "#D0D0B0", ledOff: "#2E3314", crtBg: "#050602", knob: "conic-gradient(#3E441A, #4B5320, #3E441A)", surface: "radial-gradient(rgba(0,0,0,0.3) 0.5px, transparent 0.5px)", size: "3px 3px" },
    "Slate Blue": { bg: "#2C3E50", panel: "#34495E", border: "#1A252F", text: "#ECF0F1", textDim: "#95A5A6", accent: "#E74C3C", ledOff: "#1A252F", crtBg: "#0B1117", knob: "conic-gradient(#34495E, #2C3E50, #34495E)", surface: "none", size: "0px" },
    "Studio White": { bg: "#FFFFFF", panel: "#F2F2F2", border: "#E0E0E0", text: "#111111", textDim: "#999999", accent: "#007AFF", ledOff: "#E0E0E0", crtBg: "#F9F9F9", knob: "conic-gradient(#F2F2F2, #FFF, #F2F2F2)", surface: "none", size: "0px" },
    "8-Bit Gray": { bg: "#C0C0C0", panel: "#A0A0A0", border: "#808080", text: "#000", textDim: "#444", accent: "#FF00FF", ledOff: "#666", crtBg: "#0000AA", knob: "conic-gradient(#C0C0C0, #808080, #C0C0C0)", surface: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)", size: "4px 4px" },
    "Tape Deck": { bg: "#222", panel: "#333", border: "#111", text: "#C4C4C4", textDim: "#666", accent: "#FFB800", ledOff: "#111", crtBg: "#0A0A0A", knob: "linear-gradient(#444, #111)", surface: "radial-gradient(rgba(255,255,255,0.03) 0.5px, transparent 0.5px)", size: "2px 2px" },
    "Bakelite Radio": { bg: "#3D0C02", panel: "#5C1605", border: "#240701", text: "#E9D7A5", textDim: "#8B4513", accent: "#FFD700", ledOff: "#1A0500", crtBg: "#110400", knob: "conic-gradient(#5C1605, #3D0C02, #5C1605)", surface: "none", size: "0px", radius: "30px" },
    "Polaroid White": { bg: "#E8E8E8", panel: "#DCDCDC", border: "#C0C0C0", text: "#333", textDim: "#888", accent: "#00AEEF", ledOff: "#BBB", crtBg: "#F5F5F5", knob: "conic-gradient(#EEE, #CCC, #EEE)", surface: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)", size: "6px 6px" },
    "Zenith Gold": { bg: "#B8860B", panel: "#8B4513", border: "#5D2E0C", text: "#FFF8E1", textDim: "#D2691E", accent: "#00FF00", ledOff: "#3D1F08", crtBg: "#050200", knob: "linear-gradient(135deg, #FFD700, #B8860B)", surface: "radial-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)", size: "3px 3px" },
    "Mars Base": { bg: "#1A1A1D", panel: "#2C2C2E", border: "#C3073F", text: "#950740", textDim: "#4E4E50", accent: "#C3073F", ledOff: "#1A1A1D", crtBg: "#000", knob: "conic-gradient(#4E4E50, #1A1A1D, #4E4E50)", surface: "none", size: "0px" },
    "Deep Sea": { bg: "#001B2E", panel: "#003554", border: "#006494", text: "#E1E1E1", textDim: "#0582CA", accent: "#00A6FB", ledOff: "#001B2E", crtBg: "#000814", knob: "radial-gradient(#006494, #001B2E)", surface: "none", size: "0px" },
    "Plasma Coil": { bg: "#0F001A", panel: "#1F0033", border: "#7A00CC", text: "#E0B3FF", textDim: "#4D0080", accent: "#BC13FE", ledOff: "#0F001A", crtBg: "#05000A", knob: "conic-gradient(#1F0033, #7A00CC, #1F0033)", surface: "none", size: "0px" },
    "Apollo 11": { bg: "#D1D1D1", panel: "#BDBDBD", border: "#757575", text: "#212121", textDim: "#616161", accent: "#D32F2F", ledOff: "#424242", crtBg: "#0D0D0D", knob: "conic-gradient(#EEE, #AAA, #EEE)", surface: "radial-gradient(#999 0.5px, transparent 0.5px)", size: "5px 5px" },
    "Gundam Wing": { bg: "#F5F5F5", panel: "#FFFFFF", border: "#1976D2", text: "#D32F2F", textDim: "#1976D2", accent: "#FBC02D", ledOff: "#BDBDBD", crtBg: "#0A0A1A", knob: "conic-gradient(#FFF,#D32F2F, #FFF)", surface: "none", size: "0px" },
    "Bunker Green": { bg: "#1B241B", panel: "#243024", border: "#0A0F0A", text: "#4CAF50", textDim: "#1B241B", accent: "#8BC34A", ledOff: "#0A0F0A", crtBg: "#000", knob: "conic-gradient(#243024, #1B241B, #243024)", surface: "radial-gradient(rgba(0,255,0,0.05) 1px, transparent 1px)", size: "8px 8px" },
    "Cold War": { bg: "#2B2D2F", panel: "#3F4245", border: "#1A1B1C", text: "#E0E0E0", textDim: "#5C5E60", accent: "#FF3B30", ledOff: "#1A1B1C", crtBg: "#0A0B0C", knob: "linear-gradient(#5C5E60, #1A1B1C)", surface: "radial-gradient(rgba(0,0,0,0.4) 0.5px, transparent 0.5px)", size: "3px 3px" },
    "Vampire": { bg: "#000", panel: "#1A0000", border: "#330000", text: "#FF0000", textDim: "#660000", accent: "#FF0000", ledOff: "#000", crtBg: "#000", knob: "conic-gradient(#1A0000, #330000, #1A0000)", surface: "none", size: "0px" },
    "Interstellar": { bg: "#0B0D17", panel: "#161B22", border: "#30363D", text: "#C9D1D9", textDim: "#484F58", accent: "#58A6FF", ledOff: "#0D1117", crtBg: "#010409", knob: "radial-gradient(#30363D, #0B0D17)", surface: "none", size: "0px" },
    "Forest Floor": { bg: "#2D3419", panel: "#3E442B", border: "#1E2411", text: "#D4D8C1", textDim: "#5C6641", accent: "#A4B41A", ledOff: "#1E2411", crtBg: "#0A0C06", knob: "conic-gradient(#3E442B, #2D3419, #3E442B)", surface: "radial-gradient(rgba(0,0,0,0.5) 1px, transparent 1px)", size: "5px 5px" },
    "Terracotta": { bg: "#E2725B", panel: "#B35A48", border: "#8A4537", text: "#F4EBD0", textDim: "#633128", accent: "#FFD700", ledOff: "#4A251E", crtBg: "#2A1410", knob: "conic-gradient(#B35A48, #E2725B, #B35A48)", surface: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)", size: "4px 4px" },
    "Slate Rock": { bg: "#4A4E69", panel: "#22223B", border: "#1A1A2E", text: "#F2E9E4", textDim: "#9A8C98", accent: "#C9ADA7", ledOff: "#1A1A2E", crtBg: "#0F0F1B", knob: "conic-gradient(#4A4E69, #22223B, #4A4E69)", surface: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", size: "6px 6px" },
    "Sandalwood": { bg: "#C19A6B", panel: "#A67B5B", border: "#8B5E3C", text: "#FFF4E6", textDim: "#5D4037", accent: "#FF9800", ledOff: "#3E2723", crtBg: "#1B110E", knob: "conic-gradient(#A67B5B, #C19A6B, #A67B5B)", surface: "radial-gradient(rgba(0,0,0,0.2) 0.5px, transparent 0.5px)", size: "2px 2px" },
    "Obsidian Ice": { bg: "#000814", panel: "#001D3D", border: "#003566", text: "#FFC300", textDim: "#001D3D", accent: "#FFD60A", ledOff: "#000814", crtBg: "#000", knob: "linear-gradient(#003566, #000814)", surface: "none", size: "0px" },
    "Vaporwave": { bg: "#FF71CE", panel: "#01CDFE", border: "#05FFA1", text: "#FFF", textDim: "#B967FF", accent: "#FFFB96", ledOff: "#000", crtBg: "#2D1B33", knob: "conic-gradient(#01CDFE, #FF71CE, #01CDFE)", surface: "none", size: "0px" },
    "Cyberdeck": { bg: "#00FF41", panel: "#003B00", border: "#008F11", text: "#00FF41", textDim: "#003B00", accent: "#00FF41", ledOff: "#000", crtBg: "#000", knob: "radial-gradient(#008F11, #000)", surface: "repeating-linear-gradient(0deg, rgba(0,255,65,0.03), rgba(0,255,65,0.03) 1px, transparent 1px, transparent 2px)", size: "2px 2px" },
    "Synthwave 84": { bg: "#241734", panel: "#2E2157", border: "#FF0055", text: "#33CCFF", textDim: "#FF0055", accent: "#FFCC00", ledOff: "#140D21", crtBg: "#050308", knob: "conic-gradient(#2E2157, #FF0055, #2E2157)", surface: "none", size: "0px" },
    "Tokyo Night": { bg: "#1A1B26", panel: "#24283B", border: "#414868", text: "#C0CAF5", textDim: "#565F89", accent: "#7AA2F7", ledOff: "#15161E", crtBg: "#16161E", knob: "conic-gradient(#24283B, #1A1B26, #24283B)", surface: "none", size: "0px" },
    "Acid Lab": { bg: "#000", panel: "#111", border: "#C0FF00", text: "#C0FF00", textDim: "#333", accent: "#C0FF00", ledOff: "#000", crtBg: "#000", knob: "conic-gradient(#111, #C0FF00, #111)", surface: "none", size: "0px" },
    "Genelec Gray": { bg: "#3C3C3C", panel: "#4A4A4A", border: "#2A2A2A", text: "#E0E0E0", textDim: "#666", accent: "#90EE90", ledOff: "#1A1A1A", crtBg: "#0A0A1A", knob: "conic-gradient(#4A4A4A, #3C3C3C, #4A4A4A)", surface: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)", size: "3px 3px" },
    "SSL Silver": { bg: "#D0D0D0", panel: "#E0E0E0", border: "#B0B0B0", text: "#333", textDim: "#777", accent: "#007BFF", ledOff: "#A0A0A0", crtBg: "#111", knob: "conic-gradient(#E0E0E0, #D0D0D0, #E0E0E0)", surface: "radial-gradient(rgba(0,0,0,0.1) 0.5px, transparent 0.5px)", size: "2px 2px" },
    "Neumann Black": { bg: "#121212", panel: "#1A1A1A", border: "#000", text: "#D4AF37", textDim: "#444", accent: "#D4AF37", ledOff: "#050505", crtBg: "#000", knob: "radial-gradient(#333, #000)", surface: "none", size: "0px" },
    "Nord Red": { bg: "#C62828", panel: "#B71C1C", border: "#7F0000", text: "#FFF", textDim: "#FF8A80", accent: "#FFF", ledOff: "#7F0000", crtBg: "#000", knob: "conic-gradient(#B71C1C, #C62828, #B71C1C)", surface: "none", size: "0px" },
    "Dieter Rams": { bg: "#F5F5F5", panel: "#E0E0E0", border: "#9E9E9E", text: "#000", textDim: "#757575", accent: "#FFD600", ledOff: "#BDBDBD", crtBg: "#FFFFFF", knob: "conic-gradient(#EEE, #CCC, #EEE)", surface: "none", size: "0px" },
    "Blueprint": { bg: "#0047AB", panel: "#003380", border: "#FFFFFF", text: "#FFFFFF", textDim: "#6699FF", accent: "#FFFF00", ledOff: "#002B66", crtBg: "#001A40", knob: "conic-gradient(#0047AB, #003380, #0047AB)", surface: "repeating-linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(0deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 1px, transparent 1px, transparent 20px)", size: "20px 20px" },
    "Paper Bag": { bg: "#D2B48C", panel: "#C19A6B", border: "#A67C52", text: "#5D4037", textDim: "#8D6E63", accent: "#D32F2F", ledOff: "#A67C52", crtBg: "#F5F5F5", knob: "conic-gradient(#D2B48C, #C19A6B, #D2B48C)", surface: "radial-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)", size: "2px 2px" },
    "Copper Mine": { bg: "#B87333", panel: "#A0522D", border: "#5D2E0C", text: "#000", textDim: "382211", accent: "#00FFFF", ledOff: "#3E2723", crtBg: "#1A0D06", knob: "linear-gradient(135deg, #E3A676, #B87333)", surface: "radial-gradient(rgba(0,0,0,0.4) 1px, transparent 1px)", size: "3px 3px" },
    "Lava Lamp": { bg: "#230903", panel: "#3E140C", border: "#C23A22", text: "#FF8C00", textDim: "#8B0000", accent: "#FF4500", ledOff: "#1A0602", crtBg: "#0A0301", knob: "conic-gradient(#3E140C, #230903, #3E140C)", surface: "none", size: "0px" },
    "Obsidian": { bg: "#1A1A1A", panel: "#2D2D2D", border: "#4A4A4A", text: "#E0E0E0", textDim: "#888888", accent: "#FF4500", ledOff: "#121212", crtBg: "#0D0D0D", knob: "conic-gradient(#4A4A4A, #1A1A1A, #4A4A4A)", surface: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)", size: "4px 4px" },
    "Copper": { bg: "#3D1F16", panel: "#5C2E21", border: "#B87333", text: "#FFDAB9", textDim: "#A0522D", accent: "#00CED1", ledOff: "#2A1510", crtBg: "#1F0F0B", knob: "conic-gradient(#B87333, #5C2E21, #B87333)", surface: "linear-gradient(90deg, rgba(184,115,51,0.1) 10%, transparent 10.5%)", size: "3px 100%" },
    "Cyber": { bg: "#0F001A", panel: "#1A0033", border: "#BC13FE", text: "#FFFFFF", textDim: "#8A2BE2", accent: "#39FF14", ledOff: "#080010", crtBg: "#05000A", knob: "conic-gradient(#BC13FE, #1A0033, #BC13FE)", surface: "linear-gradient(rgba(188,19,254,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(188,19,254,0.1) 1px, transparent 1px)", size: "40px 40px" },
    "Sahara": { bg: "#C2B280", panel: "#A6935F", border: "#8B7D50", text: "#3E3623", textDim: "#73674A", accent: "#FF8C00", ledOff: "#92845A", crtBg: "#2B261B", knob: "conic-gradient(#C2B280, #8B7D50, #C2B280)", surface: "repeating-radial-gradient(circle at 0 0, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 4px)", size: "8px 8px" },
    "Arctic": { bg: "#E0F7FA", panel: "#B2EBF2", border: "#FFFFFF", text: "#006064", textDim: "#4DD0E1", accent: "#FF1744", ledOff: "#80DEEA", crtBg: "#002629", knob: "conic-gradient(#FFFFFF, #B2EBF2, #FFFFFF)", surface: "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.4) 0deg 90deg, transparent 90deg 180deg)", size: "10px 10px" },
    "Ranger": { bg: "#2E3B23", panel: "#3C4D2E", border: "#1B2414", text: "#D9E0D0", textDim: "#6B8E23", accent: "#FFD700", ledOff: "#1F2917", crtBg: "#0F140B", knob: "conic-gradient(#6B8E23, #2E3B23, #6B8E23)", surface: "linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1)), linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1))", size: "10px 10px" },
    "Lux": { bg: "#000000", panel: "#1A1A1A", border: "#D4AF37", text: "#FFFFFF", textDim: "#C0C0C0", accent: "#FFDF00", ledOff: "#0A0A0A", crtBg: "#050505", knob: "conic-gradient(#D4AF37, #000000, #D4AF37)", surface: "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)", size: "4px 4px" },
    "Lab": { bg: "#E8E6D9", panel: "#D1CDB8", border: "#A8A48E", text: "#434343", textDim: "#8E8A75", accent: "#FF6600", ledOff: "#BDB9A3", crtBg: "#1A1A10", knob: "conic-gradient(#A8A48E, #E8E6D9, #A8A48E)", surface: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 0)", size: "2px 2px" },
    "Trench": { bg: "#001219", panel: "#005F73", border: "#94D2BD", text: "#E9D8A6", textDim: "#0A9396", accent: "#EE9B00", ledOff: "#002129", crtBg: "#00080B", knob: "conic-gradient(#005F73, #001219, #005F73)", surface: "repeating-linear-gradient(135deg, rgba(148,210,189,0.05) 0px, rgba(148,210,189,0.05) 2px, transparent 2px, transparent 15px)", size: "20px 20px" },
    "Silver Metal": { className: "skin-metal skin-metal-silver", text: "#2F2F2F", accent: "#FFFFFF" },
    "Copper Metal": { className: "skin-metal skin-metal-copper", text: "#3E1D09", accent: "#FFD39B" },
   "Uranium Metal": { className: "skin-metal skin-metal-uranium", text: "#39FF14", accent: "#CCFF00" },
   "Development Skin": {
    "bg": "#fec806",
    "panel": "#ece4c8",
    "border": "#d7cb9e",
    "text": "#302f26",
    "textDim": "#73715c",
    "accent": "#bb8844",
    "ledOff": "#bbbb88",
    "crtBg": "#050110",
    "knob": "conic-gradient(#ece4c8, #f8f4e6, #d7cb9e, #ece4c8)",
    "surface": "radial-gradient(rgba(0,0,0,0.2) 0.5px, transparent 0.5px)",
    "size": "5px"
},
"Tangerine lee": {
    bg: "linear-gradient(90deg, #ffaa00 0%, #bfaf8f 50%, #bfaf8f 100%)",
    sidebar: "rgba(0,0,0,0.03)", 
    footer: "rgba(0,0,0,0.05)",
    panel: "#ece4c8",
    border: "#d7cb9e", 
    text: "#302f26", 
    accent: "#0091ff",
    crtBg: "#ffaa00",
    knob: "conic-gradient(#ffffff, #ffaa00, #e6b85c, #ffffff)",
    surface: "none",
    size: "5px",
    led: { shape: "2px", glow: "0 0 12px #bb8844", count: 12 }
},

"Neo-Noir Master": {
    bg: "linear-gradient(135deg, #05080A 0%, #1A1A1B 50%, #05080A 100%)",
    sidebar: "rgba(10, 15, 20, 0.45)",
    footer: "rgba(0, 0, 0, 0.7)",
    panel: "#020B0D",
    border: "#2D3436",
    text: "#00FFD1",
    accent: "#FF3E00",
    crtBg: "#01080A",
    knob: "conic-gradient(#2D3436, #05080A, #2D3436)",
    surface: "linear-gradient(0deg, rgba(0,0,0,0.1) 50%, transparent 50%)",
    size: "2px",
    led: { shape: "2px", glow: "0 0 15px #FF3E00", count: 16 }
},

"Blaster Resin": {
    bg: "linear-gradient(45deg, #2B1605 0%, #D27D2D 50%, #F8C05D 100%)",
    sidebar: "rgba(0, 0, 0, 0.4)",
    footer: "rgba(20, 10, 5, 0.6)",
    panel: "#080400",
    border: "#5F5B58",
    text: "#E8DCC4",
    accent: "#FF2200",
    crtBg: "#050200",
    knob: "conic-gradient(#8E8E8E, #444444, #8E8E8E)",
    surface: "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)",
    size: "100px",
    led: { shape: "2px", glow: "0 0 15px #FF2200", count: 12 }
},

/* ═══════════════════════════════════════════════════════════
   FUNKY / REFRESHING SKINS  –  Stripey · Gradients · Dotty · Animated
   ═══════════════════════════════════════════════════════════ */

/* ── Stripey ─────────────────────────────────────────────── */

"Candy Stripes": {
    bg: "repeating-linear-gradient(45deg, #ff2d6a 0px, #ff2d6a 12px, #ff9f43 12px, #ff9f43 24px, #feca57 24px, #feca57 36px, #48dbfb 36px, #48dbfb 48px)",
    panel: "#2a1020",
    sidebar: "rgba(0,0,0,0.25)",
    footer: "rgba(0,0,0,0.35)",
    border: "#ff6b9d",
    text: "#ffe0ec",
    textDim: "#c080a0",
    accent: "#ff2d6a",
    ledOff: "#3a1830",
    crtBg: "#12080e",
    knob: "conic-gradient(#ff2d6a, #ff9f43, #feca57, #48dbfb, #ff2d6a)",
    surface: "none",
    size: "0px",
    led: { shape: "50%", glow: "0 0 10px #ff2d6a", count: 8 }
},

"Zebra Pop": {
    bg: "repeating-linear-gradient(90deg, #0d0d0d 0px, #0d0d0d 14px, #f5f5f5 14px, #f5f5f5 28px)",
    panel: "#1a1a1a",
    sidebar: "rgba(0,0,0,0.4)",
    footer: "rgba(0,0,0,0.5)",
    border: "#ffffff",
    text: "#f5f5f5",
    textDim: "#999999",
    accent: "#ffee00",
    ledOff: "#222",
    crtBg: "#050505",
    knob: "conic-gradient(#ffee00, #0d0d0d, #ffee00)",
    surface: "none",
    size: "0px",
    led: { shape: "2px", glow: "0 0 8px #ffee00", count: 10 }
},

"Retro Scanlines": {
    bg: "#001a00",
    panel: "#002200",
    sidebar: "rgba(0,0,0,0.3)",
    footer: "rgba(0,30,0,0.5)",
    border: "#00ff66",
    text: "#b8ffb8",
    textDim: "#4a9a4a",
    accent: "#00ff66",
    ledOff: "#003300",
    crtBg: "#000f00",
    knob: "conic-gradient(#00ff66, #001a00, #00ff66)",
    surface: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,0.07) 2px, rgba(0,255,100,0.07) 4px)",
    size: "100% 4px",
    led: { shape: "2px", glow: "0 0 12px #00ff66, 0 0 4px #ffffff", count: 16 }
},

"Barber Pole": {
    bg: "repeating-linear-gradient(-45deg, #e63946 0px, #e63946 10px, #f1faee 10px, #f1faee 20px, #1d3557 20px, #1d3557 30px)",
    panel: "#1d3557",
    sidebar: "rgba(0,0,0,0.3)",
    footer: "rgba(0,0,0,0.4)",
    border: "#e63946",
    text: "#f1faee",
    textDim: "#a8dadc",
    accent: "#e63946",
    ledOff: "#0d1b2a",
    crtBg: "#0a1628",
    knob: "conic-gradient(#e63946, #f1faee, #1d3557, #e63946)",
    surface: "none",
    size: "0px",
    led: { shape: "50%", glow: "0 0 10px #e63946", count: 8 }
},

/* ── Gradients ───────────────────────────────────────────── */

"Sunset Bloom": {
    bg: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 40%, #4a1942 100%)",
    panel: "#2a1538",
    sidebar: "rgba(20,5,30,0.4)",
    footer: "rgba(10,0,20,0.6)",
    border: "#ff6b35",
    text: "#ffe8d6",
    textDim: "#c09080",
    accent: "#ff6b35",
    ledOff: "#3d1f4f",
    crtBg: "#12081c",
    knob: "conic-gradient(#ff6b35, #2a1538, #ffd166, #2a1538)",
    surface: "none",
    size: "0px",
    led: { shape: "50%", glow: "0 0 12px #ff6b35", count: 8 }
},

"Aurora Borealis": {
    bg: "linear-gradient(135deg, #0a1628 0%, #0d2b45 35%, #1a3a4a 70%, #0f2a3a 100%)",
    panel: "#0f2438",
    sidebar: "rgba(5,15,25,0.45)",
    footer: "rgba(0,20,30,0.6)",
    border: "#4ecdc4",
    text: "#e0f7f5",
    textDim: "#6a9a98",
    accent: "#4ecdc4",
    ledOff: "#163048",
    crtBg: "#061018",
    knob: "conic-gradient(#4ecdc4, #0f2438, #95e1a3, #0f2438)",
    surface: "none",
    size: "0px",
    led: { shape: "2px", glow: "0 0 14px #4ecdc4", count: 12 }
},

"Molten Core": {
    bg: "linear-gradient(180deg, #1a0500 0%, #3d0c00 40%, #7a1a00 100%)",
    panel: "#2a0c00",
    sidebar: "rgba(30,5,0,0.4)",
    footer: "rgba(20,0,0,0.55)",
    border: "#ff4500",
    text: "#ffdcc0",
    textDim: "#c08060",
    accent: "#ff4500",
    ledOff: "#3d1400",
    crtBg: "#100300",
    knob: "conic-gradient(#ff4500, #2a0c00, #ffaa00, #2a0c00)",
    surface: "none",
    size: "0px",
    led: { shape: "50%", glow: "0 0 16px #ff4500, 0 0 4px #ffaa00", count: 10 }
},

"Pastel Dream": {
    bg: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 50%, #fad0c4 100%)",
    panel: "#ffe0e8",
    sidebar: "rgba(255,255,255,0.35)",
    footer: "rgba(255,200,210,0.5)",
    border: "#ff6b9d",
    text: "#5a3040",
    textDim: "#a07080",
    accent: "#ff6b9d",
    ledOff: "#f0c0d0",
    crtBg: "#2a1520",
    knob: "conic-gradient(#ff9a9e, #fad0c4, #ff9a9e)",
    surface: "none",
    size: "0px",
    led: { shape: "50%", glow: "0 0 8px #ff6b9d", count: 6 }
},

/* ── Dotty / Patterned ───────────────────────────────────── */

"Polka Night": {
    bg: "#12081c",
    panel: "#1e1030",
    sidebar: "rgba(10,5,20,0.4)",
    footer: "rgba(5,0,15,0.55)",
    border: "#c77dff",
    text: "#f0e6ff",
    textDim: "#9a80b8",
    accent: "#c77dff",
    ledOff: "#2a1840",
    crtBg: "#0a0514",
    knob: "conic-gradient(#c77dff, #1e1030, #c77dff)",
    surface: "radial-gradient(#c77dff 1.2px, transparent 1.2px)",
    size: "14px 14px",
    led: { shape: "50%", glow: "0 0 12px #c77dff", count: 8 }
},

"Confetti Pop": {
    bg: "#0f0f1a",
    panel: "#1a1a2e",
    sidebar: "rgba(0,0,0,0.35)",
    footer: "rgba(0,0,0,0.5)",
    border: "#ffd60a",
    text: "#fff8e0",
    textDim: "#a0a080",
    accent: "#ffd60a",
    ledOff: "#252545",
    crtBg: "#080810",
    knob: "conic-gradient(#ffd60a, #ff006e, #8338ec, #3a86ff, #ffd60a)",
    surface: "radial-gradient(#ff006e 1px, transparent 1px), radial-gradient(#8338ec 1px, transparent 1px), radial-gradient(#3a86ff 1px, transparent 1px), radial-gradient(#ffbe0b 1px, transparent 1px)",
    size: "18px 18px",
    led: { shape: "50%", glow: "0 0 10px #ffd60a", count: 10 }
},

"Grid Punk": {
    bg: "#0a0a0a",
    panel: "#141414",
    sidebar: "rgba(0,0,0,0.4)",
    footer: "rgba(0,0,0,0.55)",
    border: "#00ff9f",
    text: "#e0ffe8",
    textDim: "#60a080",
    accent: "#00ff9f",
    ledOff: "#1e1e1e",
    crtBg: "#050505",
    knob: "conic-gradient(#00ff9f, #0a0a0a, #00e5ff, #0a0a0a)",
    surface: "linear-gradient(rgba(0,255,159,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,159,0.12) 1px, transparent 1px)",
    size: "16px 16px",
    led: { shape: "2px", glow: "0 0 12px #00ff9f", count: 14 }
},

"Honeycomb": {
    bg: "#1a1208",
    panel: "#2a1e10",
    sidebar: "rgba(20,10,0,0.35)",
    footer: "rgba(10,5,0,0.5)",
    border: "#f0a500",
    text: "#ffe8c0",
    textDim: "#a08040",
    accent: "#f0a500",
    ledOff: "#3a2a18",
    crtBg: "#0e0a04",
    knob: "conic-gradient(#f0a500, #2a1e10, #f0a500)",
    surface: "radial-gradient(circle, transparent 40%, #f0a50033 40%, #f0a50033 55%, transparent 55%)",
    size: "20px 20px",
    led: { shape: "50%", glow: "0 0 10px #f0a500", count: 8 }
},

/* ── Animated (CSS className driven) ─────────────────────── */
/* These rely on matching CSS keyframes in your stylesheet.
   className values: anim-pulse-glow, anim-rainbow-border,
   anim-wave-bg, anim-glitter, anim-matrix-rain              */

"Pulse Neon": {
    bg: "#0a0014",
    panel: "#12001f",
    sidebar: "rgba(15,0,30,0.4)",
    footer: "rgba(10,0,20,0.55)",
    border: "#ff00aa",
    text: "#f0e6ff",
    textDim: "#a080c0",
    accent: "#ff00aa",
    ledOff: "#1a002c",
    crtBg: "#080010",
    knob: "conic-gradient(#ff00aa, #12001f, #00ff9d, #12001f)",
    surface: "none",
    size: "0px",
    className: "anim-pulse-glow",
    led: { shape: "50%", glow: "0 0 18px #ff00aa, 0 0 6px #ffffff", count: 10 }
},

"Rainbow Flow": {
    bg: "#0d0d12",
    panel: "#1a1a22",
    sidebar: "rgba(0,0,0,0.35)",
    footer: "rgba(0,0,0,0.5)",
    border: "#ff6b6b",
    text: "#f0f0f8",
    textDim: "#9090a8",
    accent: "#ff6b6b",
    ledOff: "#262630",
    crtBg: "#08080c",
    knob: "conic-gradient(#ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b)",
    surface: "none",
    size: "0px",
    className: "anim-rainbow-border",
    led: { shape: "50%", glow: "0 0 12px #ff6b6b", count: 8 }
},

"Wave Drift": {
    bg: "#061820",
    panel: "#0c2830",
    sidebar: "rgba(0,20,30,0.4)",
    footer: "rgba(0,15,25,0.55)",
    border: "#00d4ff",
    text: "#e0f8ff",
    textDim: "#60a0b0",
    accent: "#00d4ff",
    ledOff: "#143840",
    crtBg: "#030c10",
    knob: "conic-gradient(#00d4ff, #0c2830, #00ffaa, #0c2830)",
    surface: "none",
    size: "0px",
    className: "anim-wave-bg",
    led: { shape: "2px", glow: "0 0 14px #00d4ff", count: 12 }
},

"Glitter Bomb": {
    bg: "#12081c",
    panel: "#1e1030",
    sidebar: "rgba(15,5,25,0.4)",
    footer: "rgba(10,0,20,0.55)",
    border: "#ffd700",
    text: "#fff8e0",
    textDim: "#b0a070",
    accent: "#ffd700",
    ledOff: "#2a1840",
    crtBg: "#0a0514",
    knob: "conic-gradient(#ffd700, #1e1030, #ffd700)",
    surface: "none",
    size: "0px",
    className: "anim-glitter",
    led: { shape: "50%", glow: "0 0 14px #ffd700, 0 0 4px #fff", count: 10 }
},

"Matrix Rain": {
    bg: "#000a00",
    panel: "#001400",
    sidebar: "rgba(0,15,0,0.4)",
    footer: "rgba(0,10,0,0.55)",
    border: "#00ff41",
    text: "#b0ffb0",
    textDim: "#3a8a3a",
    accent: "#00ff41",
    ledOff: "#001e00",
    crtBg: "#000500",
    knob: "conic-gradient(#00ff41, #001400, #00ff41)",
    surface: "none",
    size: "0px",
    className: "anim-matrix-rain",
    led: { shape: "2px", glow: "0 0 12px #00ff41, 0 0 3px #fff", count: 16 }
}

}; 

// Expose to module scripts (top-level const isn't a window property)
window.SKINS = SKINS;
