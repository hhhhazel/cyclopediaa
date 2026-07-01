/* WordArt style names — visual CSS lives in Next global */

export const CLONE_WORDART_STYLES = [
    "wordart-make",
    "wordart-free",
    "wordart-rainbow",
    "wordart-classy",
    "wordart-win95",
    "wordart-outline-black",
    "wordart-outline-blue",
    "wordart-outline-purple",
    "wordart-deep-gray",
    "wordart-deep-orange",
    "wordart-deep-cyan",
    "wordart-oblique-up",
    "wordart-oblique-perspective",
    "wordart-jazz",
    "wordart-logos",
    "wordart-arch-up",
    "wordart-arch-rainbow",
    "wordart-wave",
    "wordart-flag",
    "wordart-taper-left",
    "wordart-marble",
    "wordart-neon-pink",
    "wordart-underline-slab",
  ];
  
  export const WORDART_CURVED_STYLES = {
    "wordart-arch-up": 7,
    "wordart-arch-rainbow": 9,
  };
  
  export const WORDART_WAVE_STYLES = {
    "wordart-wave": 1,
    "wordart-flag": 1.45,
  };
  
  export const WORDART_STYLE_BASE_TRANSFORM = {
    "wordart-oblique-up": "skewX(-18deg) rotate(-6deg)",
    "wordart-oblique-perspective": "perspective(120px) rotateY(-28deg) skewX(-8deg)",
    "wordart-jazz": "skewX(-12deg) rotate(-4deg)",
    "wordart-logos": "skewX(-16deg)",
    "wordart-taper-left": "perspective(160px) rotateY(24deg)",
  };
  
  export const MEME_WORDART_POOL = CLONE_WORDART_STYLES.filter(function (name) {
    return (
      name !== "wordart-outline-black" &&
      name !== "wordart-outline-blue" &&
      name !== "wordart-outline-purple"
    );
  });
  
  export const MEME_WORDART_ITEMS = MEME_WORDART_POOL.map(function (name) {
    return { id: name };
  });
  