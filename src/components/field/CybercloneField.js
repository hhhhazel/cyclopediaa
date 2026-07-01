"use client";

import { useEffect, useState } from "react";
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

  return (
    <div className="cyberclone-field-page field-env-slate">
      <div className="cyberclone-field-content">
      {loading && (
        <p className="cyberclone-field-status" aria-live="polite">
          Loading field…
        </p>
      )}

      {!loading && error && (
        <p className="cyberclone-field-status cyberclone-field-status--error" aria-live="polite">
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
            <p>hover a clone</p>
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
            />
          );
        })}
      </div>
      </div>
    </div>
  );
}
