"use client";

import { useEffect, useRef, useState } from "react";
import { getAssetByGifName, getLevelClass } from "../../../lib/field/assets";
import { bindFieldItemDrag } from "../../../lib/field/bindItemDrag";

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

  const itemRef = useRef(null);
  const didDragRef = useRef(false);
  const [imgEl, setImgEl] = useState(null);
  const [position, setPosition] = useState({
    x: Number(record.x) || 50,
    y: Number(record.y) || 50,
  });

  useEffect(
    function () {
      setPosition({
        x: Number(record.x) || 50,
        y: Number(record.y) || 50,
      });
    },
    [record.id, record.x, record.y]
  );

  useEffect(
    function () {
      const item = itemRef.current;

      if (!item) {
        return undefined;
      }

      return bindFieldItemDrag(item, {
        onDragStart: function () {
          didDragRef.current = false;
        },
        onDragMove: function () {
          didDragRef.current = true;
        },
        onPositionChange: function (xPercent, yPercent) {
          setPosition({
            x: Math.round(xPercent * 100) / 100,
            y: Math.round(yPercent * 100) / 100,
          });
          item.style.left = "";
          item.style.top = "";
        },
      });
    },
    [record.id]
  );

  return (
    <div
      ref={itemRef}
      className={"cyberfling-item saved-cyberclone-item " + getLevelClass(record.level)}
      style={{
        left: position.x + "%",
        top: position.y + "%",
        zIndex: Math.round(Number(position.y) * 10),
      }}
      data-id={record.id || ""}
      data-clone-number={String(record.clone_number || "")}
      data-level={String(record.level || "")}
      data-source={record.source || "visitor"}
      data-codename={record.codename || "anonymous"}
      data-created-at={record.created_at || ""}
      onMouseEnter={function () {
        playGif(imgEl);
        onHover?.(record);
      }}
      onMouseLeave={function () {
        pauseGif(imgEl);
        onHover?.(null);
      }}
      onDoubleClick={function (event) {
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }

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
