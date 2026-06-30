"use client";

import { useEffect, useState } from "react";

const PREVIEW_STACK_OFFSET = 14;

function getWikiPreviewImagePath(index) {
  return "/wiki/show (" + index + ").png";
}

export default function WikiLinkPreviewLayer() {
  const [pinnedPreviews, setPinnedPreviews] = useState([]);

  useEffect(function () {
    const root = document.getElementById("wikiMainScroll");

    if (!root) {
      return undefined;
    }

    function handleClick(event) {
      const link = event.target.closest(
        ".wiki-inline-link[data-preview-index]"
      );

      if (!link || !root.contains(link)) {
        return;
      }

      event.preventDefault();

      const index = parseInt(link.dataset.previewIndex, 10);

      if (!Number.isFinite(index) || index < 1) {
        return;
      }

      setPinnedPreviews(function (previews) {
        return previews.concat({
          id: index + "-" + Date.now(),
          src: getWikiPreviewImagePath(index),
          stackIndex: previews.length
        });
      });
    }

    root.addEventListener("click", handleClick);

    return function () {
      root.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div
      className="wiki-link-preview-layer"
      aria-hidden={pinnedPreviews.length ? "false" : "true"}
    >
      <div className="wiki-link-preview-pins">
        {pinnedPreviews.map(function (preview) {
          return (
            <div
              key={preview.id}
              className="wiki-link-preview wiki-link-preview--pinned"
              style={{
                transform:
                  "translate(calc(-50% + " +
                  preview.stackIndex * PREVIEW_STACK_OFFSET +
                  "px), calc(-50% + " +
                  preview.stackIndex * PREVIEW_STACK_OFFSET +
                  "px))",
                zIndex: 100 + preview.stackIndex
              }}
            >
              <img src={preview.src} alt="" draggable={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
