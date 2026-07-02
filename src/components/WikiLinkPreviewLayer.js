"use client";

import { useEffect, useState } from "react";

const PREVIEW_STACK_OFFSET = 14;
const PREVIEW_LINK_SELECTOR =
  ".wiki-inline-link[data-preview-index], .wiki-inline-link[data-preview]";

function getWikiPreviewImagePath(index) {
  return "/images/wiki/show (" + index + ").png";
}

function getPreviewSrcFromLink(link) {
  if (!link) {
    return "";
  }

  const index = parseInt(link.dataset.previewIndex, 10);

  if (Number.isFinite(index) && index >= 1) {
    return getWikiPreviewImagePath(index);
  }

  return link.dataset.preview || "";
}

function getCenterTransform(stackIndex) {
  const offset = stackIndex * PREVIEW_STACK_OFFSET;

  return (
    "translate(calc(-50% + " + offset + "px), calc(-50% + " + offset + "px))"
  );
}

export default function WikiLinkPreviewLayer() {
  const [hoverPreview, setHoverPreview] = useState({ visible: false, src: "" });
  const [pinnedPreviews, setPinnedPreviews] = useState([]);

  useEffect(function () {
    const root = document.getElementById("wikiMainScroll");

    if (!root) {
      return undefined;
    }

    function showHover(link) {
      const src = getPreviewSrcFromLink(link);

      if (!src) {
        return;
      }

      setHoverPreview({ visible: true, src: src });
    }

    function hideHover() {
      setHoverPreview({ visible: false, src: "" });
    }

    function pinPreview(link) {
      const src = getPreviewSrcFromLink(link);

      if (!src) {
        return;
      }

      setPinnedPreviews(function (previews) {
        return previews.concat({
          id: src + "-" + Date.now(),
          src: src,
          stackIndex: previews.length,
        });
      });
      hideHover();
    }

    const links = root.querySelectorAll(PREVIEW_LINK_SELECTOR);

    const bindings = [];

    links.forEach(function (link) {
      function handleMouseEnter() {
        showHover(link);
      }

      function handleMouseLeave() {
        hideHover();
      }

      function handleFocus() {
        showHover(link);
      }

      function handleBlur() {
        hideHover();
      }

      function handleClick(event) {
        event.preventDefault();
        pinPreview(link);
      }

      link.addEventListener("mouseenter", handleMouseEnter);
      link.addEventListener("mouseleave", handleMouseLeave);
      link.addEventListener("focus", handleFocus);
      link.addEventListener("blur", handleBlur);
      link.addEventListener("click", handleClick);

      bindings.push({
        link: link,
        handleMouseEnter: handleMouseEnter,
        handleMouseLeave: handleMouseLeave,
        handleFocus: handleFocus,
        handleBlur: handleBlur,
        handleClick: handleClick,
      });
    });

    return function () {
      bindings.forEach(function (binding) {
        binding.link.removeEventListener("mouseenter", binding.handleMouseEnter);
        binding.link.removeEventListener("mouseleave", binding.handleMouseLeave);
        binding.link.removeEventListener("focus", binding.handleFocus);
        binding.link.removeEventListener("blur", binding.handleBlur);
        binding.link.removeEventListener("click", binding.handleClick);
      });
    };
  }, []);

  const hoverStackIndex = pinnedPreviews.length;
  const layerVisible = hoverPreview.visible || pinnedPreviews.length > 0;

  return (
    <div
      className="wiki-link-preview-layer"
      aria-hidden={layerVisible ? "false" : "true"}
    >
      <div
        className={
          "wiki-link-preview wiki-link-preview--hover" +
          (hoverPreview.visible ? "" : " hidden")
        }
        style={{
          transform: getCenterTransform(hoverStackIndex),
          zIndex: 200,
        }}
      >
        {hoverPreview.visible ? (
          <img src={hoverPreview.src} alt="" draggable={false} />
        ) : null}
      </div>

      <div className="wiki-link-preview-pins">
        {pinnedPreviews.map(function (preview) {
          return (
            <div
              key={preview.id}
              className="wiki-link-preview wiki-link-preview--pinned"
              style={{
                transform: getCenterTransform(preview.stackIndex),
                zIndex: 100 + preview.stackIndex,
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
