"use client";

import { useEffect, useState } from "react";

const LOGO_COUNT = 8;
const LOGO_INTERVAL_MS = 2500;
export const LOGO_EXPORT_PX = 256;

export default function WikiLogoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(function () {
    const intervalId = window.setInterval(function () {
      setActiveIndex(function (index) {
        return (index + 1) % LOGO_COUNT;
      });
    }, LOGO_INTERVAL_MS);

    return function () {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="wiki-logo-carousel" aria-label="Cyclopedia logo">
      {Array.from({ length: LOGO_COUNT }, function (_, index) {
        return (
          <img
            key={index + 1}
            className={
              "wiki-logo-carousel-image" +
              (activeIndex === index ? " wiki-logo-carousel-image--active" : "")
            }
            src={"/logo/" + (index + 1) + ".png"}
            alt=""
            width={LOGO_EXPORT_PX}
            height={LOGO_EXPORT_PX}
            draggable={false}
          />
        );
      })}
    </div>
  );
}
