"use client";

import { useState } from "react";
import { getAssetByGifName, getLevelClass } from "../../../lib/field/assets";

function playGif(img) {
  if (!img) return;
  const gifSrc = img.dataset.gif;
  if (gifSrc) {
    img.src = gifSrc + "?t=" + Date.now();
  }
}

function pauseGif(img) {
  if (!img) return;
  const stillSrc = img.dataset.still;
  if (stillSrc) {
    img.src = stillSrc;
  }
}

export default function CybercloneItem({ record, onHover, onOpenMeme }) {
  const asset = getAssetByGifName(record.gif_name);

  if (!asset) {
    return null;
  }

  const [imgEl, setImgEl] = useState(null);

  return (
    <div
      className={"cyberfling-item saved-cyberclone-item " + getLevelClass(record.level)}
      style={{
        left: record.x + "%",
        top: record.y + "%",
        zIndex: Math.round(Number(record.y) * 10),
      }}
      data-id={record.id || ""}
      data-clone-number={String(record.clone_number || "")}
      data-level={String(record.level || "")}
      data-source={record.source || "visitor"}
      data-codename={record.codename || "anonymous"}
      onMouseEnter={function () {
        playGif(imgEl);
        onHover?.(record);
      }}
      onMouseLeave={function () {
        pauseGif(imgEl);
        onHover?.(null);
      }}
      onDoubleClick={function (event) {
        event.preventDefault();
        onOpenMeme?.(asset.gif);
      }}
    >
      <img
        ref={setImgEl}
        className="cyberfling-gif"
        src={asset.still}
        data-still={asset.still}
        data-gif={asset.gif}
        alt={"Cyberclone Level " + record.level}
        draggable={false}
      />
    </div>
  );
}
