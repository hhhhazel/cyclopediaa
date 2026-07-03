"use client";

import { useEffect, useState } from "react";
import { loadGalleryLikes, saveGalleryLikes } from "../../../lib/gallery/likes";
import { loadMemeCommonsCaptures } from "../../../lib/meme-commons/loadCaptures";
import "../../components/field/cyberclone-field.css";
import "../../app/gallery/meme-commons.css";

function GalleryLikeButton({ liked, onToggle }) {
  return (
    <button
      type="button"
      className="meme-commons-item-like"
      aria-label={liked ? "Unlike" : "Like"}
      aria-pressed={liked}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 5.02 7.11 10.23 10 12.5 2.89-2.27 10-7.48 10-12.5C22 5.42 19.58 3 16.5 3z"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function CommonsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [likedIds, setLikedIds] = useState(function () {
    return new Set();
  });

  useEffect(function () {
    setLikedIds(loadGalleryLikes());
  }, []);

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

  function toggleLike(recordId, event) {
    event.preventDefault();
    event.stopPropagation();

    setLikedIds(function (current) {
      const next = new Set(current);

      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }

      saveGalleryLikes(next);
      return next;
    });
  }

  return (
    <main
      className="cyberclone-field-page field-env-slate meme-commons-page"
      aria-label="Meme Commons"
    >
      {loading && <p className="meme-commons-status">Loading…</p>}

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
            const liked = likedIds.has(record.id);

            return (
              <article key={record.id} className="meme-commons-item">
                <button
                  type="button"
                  className="meme-commons-item-open"
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
                </button>

                <div className="meme-commons-item-footer">
                  {record.display_caption ? (
                    <p className="meme-commons-item-caption">
                      {record.display_caption}
                    </p>
                  ) : (
                    <span className="meme-commons-item-caption-spacer" />
                  )}

                  <GalleryLikeButton
                    liked={liked}
                    onToggle={function (event) {
                      toggleLike(record.id, event);
                    }}
                  />
                </div>
              </article>
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
