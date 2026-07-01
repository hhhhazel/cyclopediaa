"use client";

import { useEffect, useState } from "react";
import { loadMemeCommonsCaptures } from "../../../lib/meme-commons/loadCaptures";
import "../../components/field/cyberclone-field.css";
import "../../app/gallery/meme-commons.css";

export default function CommonsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(function () {
    let cancelled = false;

    loadMemeCommonsCaptures()
      .then(function (data) {
        if (!cancelled) {
          setRecords(data);
          setError("");
        }
      })
      .catch(function (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load Meme Commons.");
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

  useEffect(function () {
    if (!preview) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setPreview(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return function () {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [preview]);

  return (
    <main
      className="cyberclone-field-page field-env-slate meme-commons-page"
      aria-label="Meme Commons"
    >
      {loading && (
        <p className="meme-commons-status">Loading…</p>
      )}

      {!loading && error && (
        <p className="meme-commons-status meme-commons-status--error">{error}</p>
      )}

      {!loading && !error && records.length === 0 && (
        <p className="meme-commons-empty">
          No captures yet. Make a meme and tap the camera.
        </p>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="meme-commons-grid" aria-live="polite">
          {records.map(function (record) {
            return (
              <button
                key={record.id}
                type="button"
                className="meme-commons-item"
                onClick={function () {
                  setPreview(record);
                }}
              >
                <div className="meme-commons-item-media">
                  <img
                    src={record.image_url}
                    alt={record.caption || "Meme capture"}
                    loading="lazy"
                    draggable={false}
                  />
                </div>

                {record.display_caption ? (
                  <p className="meme-commons-item-caption">
                    {record.display_caption}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {preview && (
        <div
          className="meme-commons-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Meme preview"
          onClick={function () {
            setPreview(null);
          }}
        >
          <button
            type="button"
            className="meme-commons-preview-close"
            aria-label="Close"
            onClick={function (event) {
              event.stopPropagation();
              setPreview(null);
            }}
          >
            ×
          </button>

          <div
            className="meme-commons-preview-content"
            onClick={function (event) {
              event.stopPropagation();
            }}
          >
            <img
              src={preview.image_url}
              alt={
                preview.display_caption ||
                preview.caption ||
                "Meme capture preview"
              }
              draggable={false}
            />

            {preview.display_caption ? (
              <p className="meme-commons-preview-caption">
                {preview.display_caption}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
