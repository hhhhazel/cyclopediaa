/* Meme editor data — ported from script.js */

export const MEME_LAYOUTS = [
    {
      id: "classic",
      channel: "CYBERCLONE CHANNEL",
      kicker: "MEME EXPOSURE ALERT",
      fx: null,
      bubbles: false,
      channelBar: false,
      ticker: false,
      slots: [
        {
          id: "main",
          label: "Main line",
          maxLen: 26,
          defaultText: "YEAH I GOT A PHD",
          upper: true,
          wordart: ["wordart-deep-gray", "wordart-free", "wordart-deep-orange"],
          slotClass: "meme-slot--main-tl",
          sizeClass: "meme-text-xl"
        },
        {
          id: "punch",
          label: "Punchline",
          maxLen: 30,
          defaultText: "A PRETTY HEAVY DRINKING PROBLEM",
          upper: true,
          wordart: ["wordart-deep-gray", "wordart-make", "wordart-deep-orange"],
          slotClass: "meme-slot--punch-mid",
          sizeClass: "meme-text-lg"
        },
        {
          id: "aside",
          label: "Aside",
          maxLen: 40,
          defaultText: "i don't really like to talk about it though",
          upper: false,
          wordart: ["wordart-jazz", "wordart-outline-black", "wordart-win95"],
          slotClass: "meme-slot--aside",
          sizeClass: "meme-text-sm",
          rotate: -14
        }
      ],
      chars: [
        { id: "a", w: 42, left: 72, top: 48 },
        { id: "b", w: 38, left: 24, top: 62, flip: true }
      ]
    },
    {
      id: "frame",
      channel: "BLESSING CHANNEL",
      kicker: "POSITIVE MEME OUTLOOK",
      fx: "sunny",
      bubbles: true,
      channelBar: false,
      ticker: false,
      slots: [
        {
          id: "top",
          label: "Top line",
          maxLen: 16,
          defaultText: "TOO BLESSED",
          upper: true,
          wordart: ["wordart-classy", "wordart-neon-pink", "wordart-rainbow"],
          slotClass: "meme-slot--top",
          sizeClass: "meme-text-xl"
        },
        {
          id: "bottom",
          label: "Bottom line",
          maxLen: 16,
          defaultText: "2 BE STRESSED",
          upper: true,
          wordart: ["wordart-classy", "wordart-neon-pink", "wordart-deep-cyan"],
          slotClass: "meme-slot--bottom",
          sizeClass: "meme-text-xl"
        }
      ],
      chars: [{ id: "a", w: 58, left: 50, top: 54 }]
    },
    {
      id: "caption",
      channel: "FIELD CHANNEL",
      kicker: "SURREAL MEME ADVISORY",
      fx: null,
      bubbles: false,
      channelBar: false,
      ticker: false,
      slots: [
        {
          id: "title",
          label: "Title",
          maxLen: 34,
          defaultText: "DO NOT FORGET TO WATER YOUR FINGERS",
          upper: true,
          wordart: ["wordart-logos", "wordart-taper-left", "wordart-make"],
          slotClass: "meme-slot--stretch-title",
          sizeClass: "meme-text-stretch"
        },
        {
          id: "subtitle",
          label: "Subtitle",
          maxLen: 28,
          defaultText: "For they will not be merciful",
          upper: false,
          wordart: ["wordart-win95", "wordart-outline-black"],
          slotClass: "meme-slot--subtitle",
          sizeClass: "meme-text-md"
        },
        {
          id: "capL",
          label: "Left caption",
          maxLen: 22,
          defaultText: "we require the liquid",
          upper: false,
          wordart: ["wordart-outline-black", "wordart-jazz"],
          slotClass: "meme-slot--cap-l",
          sizeClass: "meme-text-cap"
        },
        {
          id: "capR",
          label: "Right caption",
          maxLen: 14,
          defaultText: "forgive me",
          upper: false,
          wordart: ["wordart-outline-black", "wordart-jazz"],
          slotClass: "meme-slot--cap-r",
          sizeClass: "meme-text-cap"
        }
      ],
      chars: [{ id: "a", w: 50, left: 72, top: 56, blur: true }]
    },
    {
      id: "fire",
      channel: "",
      kicker: "",
      fx: "fire",
      bubbles: false,
      channelBar: false,
      ticker: false,
      slots: [
        {
          id: "line",
          label: "Caption",
          maxLen: 32,
          defaultText: "On my healing journey",
          upper: false,
          wordart: ["wordart-win95", "wordart-outline-black", "wordart-classy"],
          slotClass: "meme-slot--fire-caption",
          sizeClass: "meme-text-fire-caption"
        }
      ],
      chars: [{ id: "a", w: 70, left: 50, top: 50 }]
    },
    {
      id: "white",
      channel: "",
      kicker: "",
      fx: "sparkle",
      bubbles: false,
      channelBar: false,
      ticker: false,
      slots: [
        {
          id: "top",
          label: "Top line",
          maxLen: 24,
          defaultText: "due to personal reasons",
          upper: false,
          wordart: ["wordart-outline-black", "wordart-win95"],
          slotClass: "meme-slot--white-top",
          sizeClass: "meme-text-sm"
        },
        {
          id: "hero",
          label: "Main line",
          maxLen: 22,
          defaultText: "going to sleep",
          upper: false,
          wordart: ["wordart-rainbow", "wordart-arch-rainbow", "wordart-free"],
          slotClass: "meme-slot--white-hero",
          sizeClass: "meme-text-xxl"
        }
      ],
      chars: [{ id: "a", w: 48, left: 52, top: 60 }]
    },
    {
      id: "dream",
      channel: "",
      kicker: "",
      fx: null,
      bubbles: true,
      channelBar: false,
      ticker: false,
      slots: [
        {
          id: "main",
          label: "Main",
          maxLen: 28,
          defaultText: "dreams do come true",
          upper: false,
          wordart: ["wordart-deep-gray", "wordart-underline-slab", "wordart-make"],
          slotClass: "meme-slot--dream-main",
          sizeClass: "meme-text-lg"
        },
        {
          id: "sub",
          label: "Punchline",
          maxLen: 24,
          defaultText: "just go back to sleep",
          upper: false,
          wordart: ["wordart-deep-gray", "wordart-deep-orange", "wordart-make"],
          slotClass: "meme-slot--dream-sub",
          sizeClass: "meme-text-xl"
        }
      ],
      chars: [
        { id: "ghost", ghost: true, w: 64, left: 70, top: 38, opacity: 0.4 },
        { id: "a", w: 60, left: 46, top: 56 }
      ]
    },
    {
      id: "muted",
      channel: "",
      kicker: "",
      fx: null,
      bubbles: false,
      channelBar: false,
      ticker: false,
      slots: [
        {
          id: "main",
          label: "Main line",
          maxLen: 30,
          defaultText: "Different day same dumb bitch",
          upper: false,
          wordart: ["wordart-deep-gray", "wordart-underline-slab", "wordart-deep-orange"],
          slotClass: "meme-slot--muted-center",
          sizeClass: "meme-text-xxl"
        }
      ],
      chars: [
        { id: "ghost", ghost: true, w: 58, left: 76, top: 30, opacity: 0.42 },
        { id: "a", w: 50, left: 30, top: 66 }
      ]
    },
    {
      id: "sky",
      channel: "",
      kicker: "",
      fx: null,
      bubbles: false,
      channelBar: false,
      ticker: false,
      slots: [
        {
          id: "lineA",
          label: "Line 1",
          maxLen: 20,
          defaultText: "Your Personality",
          upper: false,
          wordart: ["wordart-outline-black", "wordart-jazz"],
          slotClass: "meme-slot--sky-a",
          sizeClass: "meme-text-md"
        },
        {
          id: "lineB",
          label: "Line 2",
          maxLen: 12,
          defaultText: "CREATES",
          upper: true,
          wordart: ["wordart-outline-black", "wordart-deep-gray"],
          slotClass: "meme-slot--sky-b",
          sizeClass: "meme-text-xl"
        },
        {
          id: "lineC",
          label: "Line 3",
          maxLen: 24,
          defaultText: "Your Personal Reality",
          upper: false,
          wordart: ["wordart-outline-black", "wordart-jazz"],
          slotClass: "meme-slot--sky-c",
          sizeClass: "meme-text-md"
        }
      ],
      chars: [{ id: "a", w: 74, left: 50, top: 54 }]
    }
  ];
  
  export const MEME_BG_HISTORY_LIMIT = 5;
  
  export const MEME_BG_SCENES = [
    { id: "sky-ocean", className: "meme-bg-scene--sky-ocean" },
    { id: "sky-grass", className: "meme-bg-scene--sky-grass" },
    { id: "sky-clouds", className: "meme-bg-scene--sky-clouds" },
    { id: "sky-bright", className: "meme-bg-scene--sky-bright" },
    { id: "ocean-horizon", className: "meme-bg-scene--ocean-horizon" },
    { id: "fire-white", className: "meme-bg-scene--fire-white" },
    { id: "fire-sunset", className: "meme-bg-scene--fire-sunset" },
    { id: "fire-dark", className: "meme-bg-scene--fire-dark" }
  ];
  
  export const MEME_GRAD_PALETTES = [
    { id: "white-fog", colors: ["#ffffff", "#dcdce4"] },
    { id: "gray-mist", colors: ["#f2f2f6", "#b8b8c4"] },
    { id: "blue-deep", colors: ["#061840", "#2f7bff", "#8fd4ff"] },
    { id: "blue-cyan", colors: ["#003366", "#00ccff"] },
    { id: "pink-purple", colors: ["#ff9ad5", "#7b2fff"] },
    { id: "neon-duo", colors: ["#ff00cc", "#00ffd5"] },
    { id: "lime-violet", colors: ["#c6ff00", "#7b2fff"] },
    { id: "sunset-triple", colors: ["#fff700", "#ff7a00", "#cc1100"] },
    { id: "fire-glow", colors: ["#ff4500", "#8b0000", "#1a0500"] },
    { id: "mint-sky", colors: ["#b8fff0", "#5eb8ff"] },
    { id: "brown-vignette", colors: ["#c8beb0", "#5a4a3a", "#2a2218"] },
    { id: "fluoro-triple", colors: ["#ff00cc", "#00ccff", "#ccff00"] },
    { id: "yellow-lime", colors: ["#fff44d", "#7dff2a"] },
    { id: "purple-night", colors: ["#1a0033", "#6633ff", "#cc99ff"] },
    { id: "peach-cream", colors: ["#ffe8d6", "#ffcba4", "#e8a87c"] }
  ];
  
  export const MEME_GRAD_KINDS = [
    "linear-v",
    "linear-h",
    "linear-diag",
    "radial-center",
    "radial-corner",
    "stripe-diag",
    "stripe-v"
  ];
  
  export const MEME_CHAR_SCALE_MIN = 0.12;
  export const MEME_CHAR_SCALE_MAX = 6;
  export const MEME_CHAR_WHEEL_ZOOM_IN = 1.12;
  export const MEME_CHAR_WHEEL_ZOOM_OUT = 0.89;
  export const MEME_TEXT_SCALE_MIN = 0.2;
  export const MEME_TEXT_SCALE_MAX = 4;
  export const MEME_POOL_HISTORY_LIMIT = 5;
  
  export const MEME_CHAR_LAYOUTS = [
    {
      id: "solo",
      specs: function () {
        return [{ id: "main", w: 58, left: 50, top: 54 }];
      }
    },
    {
      id: "duo-solid",
      specs: function () {
        return [
          { id: "a", w: 40, left: 32, top: 56, flip: true },
          { id: "b", w: 40, left: 68, top: 54 }
        ];
      }
    },
    {
      id: "duo-ghost-solid",
      specs: function () {
        const ghostLeft = Math.random() < 0.5;
  
        if (ghostLeft) {
          return [
            {
              id: "ghost",
              w: 40,
              left: 32,
              top: 56,
              ghost: true,
              ghostLevel: "mid",
              flip: true
            },
            { id: "solid", w: 44, left: 68, top: 54 }
          ];
        }
  
        return [
          { id: "solid", w: 44, left: 32, top: 56, flip: true },
          {
            id: "ghost",
            w: 40,
            left: 68,
            top: 54,
            ghost: true,
            ghostLevel: "mid"
          }
        ];
      }
    },
    {
      id: "trio-ghost-graded",
      specs: function () {
        return [
          {
            id: "g-faint",
            w: 36,
            left: 22,
            top: 58,
            ghost: true,
            ghostLevel: "faint",
            flip: true
          },
          {
            id: "g-mid",
            w: 38,
            left: 78,
            top: 58,
            ghost: true,
            ghostLevel: "mid"
          },
          { id: "main", w: 44, left: 50, top: 52 }
        ];
      }
    }
  ];
  
  export const MEME_CHAR_LAYOUT_WEIGHTS = [
    { id: "solo", weight: 40 },
    { id: "duo-solid", weight: 10 },
    { id: "duo-ghost-solid", weight: 25 },
    { id: "trio-ghost-graded", weight: 25 }
  ];
  
  export const MEME_FX_MODES = [
    { id: "fire" },
    { id: "stars" },
    { id: "rainbow" },
    { id: "lightning" },
    { id: "rainbow-bars" }
  ];
  
  export const MEME_TEXT_COUNTS = [{ id: "one" }, { id: "two" }, { id: "three" }];
  
  export const MEME_TEXT_SIZE_BY_ROLE = {
    lead: ["meme-text-xl", "meme-text-xxl", "meme-text-lg"],
    main: ["meme-text-lg", "meme-text-xl", "meme-text-md"],
    sub: ["meme-text-sm", "meme-text-md", "meme-text-cap"]
  };
  
  export const MEME_FIXED_COPY = {
    one: {
      lines: [
        {
          id: "line1",
          label: "Line",
          role: "main",
          text: "In conclusion, fucking life",
          maxLen: 40
        }
      ]
    },
    two: {
      lines: [
        {
          id: "line1",
          label: "Line 1",
          role: "main",
          text: "Dreams do come true...",
          maxLen: 30
        },
        {
          id: "line2",
          label: "Line 2",
          role: "sub",
          text: "Just go back to sleep",
          maxLen: 28
        }
      ]
    },
    three: {
      lines: [
        {
          id: "line1",
          label: "Line 1",
          role: "lead",
          text: "What are my life goals?",
          maxLen: 28
        },
        {
          id: "line2",
          label: "Line 2",
          role: "main",
          text: "No thanks.",
          maxLen: 16
        },
        {
          id: "line3",
          label: "Line 3",
          role: "sub",
          text: "I'm just here for the drama",
          maxLen: 34
        }
      ]
    }
  };
  
  export const MEME_TEXT_DEFAULT_POSITIONS = {
    one: { line1: { left: 50, top: 50 } },
    two: { line1: { left: 50, top: 14 }, line2: { left: 50, top: 86 } },
    three: {
      line1: { left: 50, top: 12 },
      line2: { left: 50, top: 50 },
      line3: { left: 50, top: 88 }
    }
  };
  