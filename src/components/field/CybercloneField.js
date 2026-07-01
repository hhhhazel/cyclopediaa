"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAssetByGifName } from "../../../lib/field/assets";
import { loadCybercloneFieldRecords } from "../../../lib/field/loadRecords";
import CybercloneItem from "./CybercloneItem";
import "./cyberclone-field.css";

function formatReleasedTime(value) {
  if (!value) return "unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function CybercloneField() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hovered, setHovered] = useState(null);

  useEffect(function () {
    let cancelled = false;

    loadCybercloneFieldRecords()
      .then(function (data) {
        if (!cancelled) {
          setRecords(data);
          setError("");
        }
      })
      .catch(function (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load cyberclone field.");
        }
      })
      .finally(function () {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return function () {
      cancelled = true;
    };
  }, []);

  function openMemeEditor(gifPath) {
    if (!gifPath) return;
    router.push("/meme?gif=" + encodeURIComponent(gifPath));
  }

  const hoveredAsset = hovered ? getAssetByGifName(hovered.gif_name) : null;

  return (
    <div className="cyberclone-field-page field-env-slate">
      <div className="cyberclone-field-content">
        {loading && (
          <p className="cyberclone-field-status" aria-live="polite">
            Loading field…
          </p>
        )}

        {!loading && error && (
          <p
            className="cyberclone-field-status cyberclone-field-status--error"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        {!loading && !error && records.length === 0 && (
          <p className="cyberclone-field-status" aria-live="polite">
            No cyberclones in the field yet.
          </p>
        )}

        <div className="cyberclone-info-panel">
          {hovered ? (
            <>
              <p>
                no.{String(hovered.clone_number || 0).padStart(3, "0")} · lv.
                {String(hovered.level || 0).padStart(2, "0")}
              </p>
              <p>{hovered.codename || "anonymous"}</p>
              <p>{formatReleasedTime(hovered.created_at)}</p>
            </>
          ) : (
            <>
              <p>cyberclone field</p>
              <p>hover a clone · double-click for meme</p>
            </>
          )}
        </div>

        <div className="cyberfling-scene" aria-label="Cyberclone field">
          {records.map(function (record) {
            return (
              <CybercloneItem
                key={record.id || record.clone_number + "-" + record.gif_name}
                record={record}
                onHover={setHovered}
                onOpenMeme={openMemeEditor}
              />
            );
          })}
        </div>
      </div>

      <div className="field-studio-bottom-row">
        <nav
          className="field-tool-dock field-tool-dock--text"
          aria-label="Field tools"
        >
          <button
            type="button"
            className="field-candy-btn field-candy-btn--meme"
            aria-label="Open meme template"
            title="Meme — Open the meme editor for the hovered field clone."
            disabled={!hoveredAsset}
            onClick={function () {
              if (hoveredAsset) {
                openMemeEditor(hoveredAsset.gif);
              }
            }}
          >
            <span className="field-candy-btn__media" aria-hidden="true">
              {hoveredAsset ? (
                <img src={hoveredAsset.still} alt="" width="40" height="40" draggable={false} />
              ) : null}
            </span>
            <span className="field-candy-btn__label">Meme</span>
          </button>

          <button
            type="button"
            className="field-candy-btn field-candy-btn--gallery"
            aria-label="Open Meme Commons"
            title="Gallery — Browse captured memes in Meme Commons."
            onClick={function () {
              router.push("/commons");
            }}
          >
            <span
              className="field-candy-btn__media field-candy-btn__media--gallery"
              aria-hidden="true"
            >
              ◫
            </span>
            <span className="field-candy-btn__label">Gallery</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
