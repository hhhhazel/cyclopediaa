export const CYBERCLONE_ASSETS = [
    { gifName: "cyberclone-01.gif", gif: "/public/images/cyberclone-01.gif", still: "/public/images/1_0000.png" },
    { gifName: "cyberclone-02.gif", gif: "/public/images/cyberclone-02.gif", still: "/public/images/2_0000.png" },
    { gifName: "cyberclone-03.gif", gif: "/public/images/cyberclone-03.gif", still: "/public/images/3_0030.png" },
    { gifName: "cyberclone-04.gif", gif: "/public/images/cyberclone-04.gif", still: "/public/images/4_0010.png" },
    { gifName: "cyberclone-05.gif", gif: "/public/images/cyberclone-05.gif", still: "/public/images/5_0010.png" },
    { gifName: "cyberclone-06.gif", gif: "/public/images/cyberclone-06.gif", still: "/public/images/6_0050.png" },
    { gifName: "cyberclone-07.gif", gif: "/public/images/cyberclone-07.gif", still: "/public/images/7_0030.png" },
    { gifName: "cyberclone-08.gif", gif: "/public/images/cyberclone-08.gif", still: "/public/images/8_0020.png" },
  ];
  
  export function getAssetByGifName(gifName) {
    return CYBERCLONE_ASSETS.find(function (asset) {
      return asset.gifName === gifName;
    });
  }
  
  export function getLevelClass(level) {
    const safeLevel = Math.max(1, Math.min(5, Number(level) || 1));
    return "depth-level-" + safeLevel;
  }
  