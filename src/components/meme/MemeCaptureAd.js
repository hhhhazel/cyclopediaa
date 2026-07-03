"use client";

import { useEffect, useState } from "react";
import { getVisitorCodename } from "../../../lib/meme/codename.js";
import { saveMemeCommonsCapture } from "../../../lib/meme/uploadCapture.js";
import "../cyberclone-test.css";

export default function MemeCaptureAd({
  blob,
  caption,
  source = "meme",
  onClose,
  onUploadSuccess,
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(
    function () {
      if (!blob) {
        setPreviewUrl("");
        return;
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      return function () {
        URL.revokeObjectURL(url);
      };
    },
    [blob]
  );

  async function handleUpload() {
    if (!blob || uploading) return;

    setUploading(true);

    try {
      await saveMemeCommonsCapture(
        blob,
        source,
        caption || "",
        getVisitorCodename()
      );
      onUploadSuccess?.();
    } catch (error) {
      console.error("Meme Commons upload failed:", error);
      window.alert(
        "Could not upload this capture. Check Supabase Storage settings and try again."
      );
    } finally {
      setUploading(false);
    }
  }

  if (!blob) return null;

  return (
    <div
      className="meme-capture-ad-overlay"
      aria-hidden="false"
      onClick={function (event) {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="meme-capture-ad-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memeCaptureAdHeadline"
      >
        <span className="cyberclone-ad-badge">AD</span>
        <span className="cyberclone-ad-choices" aria-hidden="true" />
        <button
          type="button"
          className="cyberclone-ad-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <p className="cyberclone-ad-label">Advertisement</p>
        <h3 id="memeCaptureAdHeadline" className="cyberclone-ad-headline">
          Upload to Meme Commons
        </h3>
        <p className="cyberclone-ad-subtext">
          This frame is frozen in time. Share it in the public gallery.
        </p>
        <div
          className="meme-capture-ad-preview"
          aria-hidden={previewUrl ? "false" : "true"}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Captured frame preview" />
          ) : null}
        </div>
        <div className="meme-capture-ad-actions">
          <button
            type="button"
            className="cyberclone-ad-answer-button meme-capture-ad-upload"
            disabled={uploading}
            onClick={handleUpload}
          >
            {uploading ? "Uploading…" : "Upload to Meme Commons"}
          </button>
          <button
            type="button"
            className="cyberclone-ad-answer-button meme-capture-ad-skip"
            disabled={uploading}
            onClick={onClose}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
