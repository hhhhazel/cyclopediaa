"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const REFERENCE_IMAGE = "/motion/6.png";
const GESTURE_LABEL = "Crying Face";
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";
const SAD_THRESHOLD = 0.2;
const PASS_FRAMES = 1;

export default function WikiGestureCaptcha() {
  const [open, setOpen] = useState(false);
  const [passed, setPassed] = useState(false);
  const [status, setStatus] = useState("idle");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const faceapiRef = useRef(null);
  const sadCountRef = useRef(0);

  const stopCamera = useCallback(function () {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function (track) {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    sadCountRef.current = 0;
  }, []);

  const close = useCallback(function () {
    stopCamera();
    setOpen(false);
    setStatus("idle");
  }, [stopCamera]);

  const openCaptcha = useCallback(function (event) {
    event.preventDefault();
    event.stopPropagation();
    setPassed(false);
    setOpen(true);
  }, []);

  useEffect(function () {
    if (!open || passed) {
      return undefined;
    }

    let cancelled = false;

    async function start() {
      setStatus("loading");

      try {
        const faceapi = await import("@vladmandic/face-api");
        faceapiRef.current = faceapi;

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);

        if (cancelled) {
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 480 },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach(function (track) {
            track.stop();
          });
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        if (cancelled) {
          return;
        }

        setStatus("active");

        function detect() {
          if (cancelled || !videoRef.current || !faceapiRef.current) {
            return;
          }

          const faceapiLib = faceapiRef.current;
          const options = new faceapiLib.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.4
          });

          faceapiLib
            .detectSingleFace(videoRef.current, options)
            .withFaceExpressions()
            .then(function (result) {
              if (cancelled) {
                return;
              }

              if (result) {
                console.log("sad:", result.expressions.sad.toFixed(3));
              }

              if (result && result.expressions.sad >= SAD_THRESHOLD) {
                sadCountRef.current += 1;

                if (sadCountRef.current >= PASS_FRAMES) {
                  setPassed(true);
                  setStatus("passed");
                  stopCamera();
                  return;
                }
              } else {
                sadCountRef.current = 0;
              }

              rafRef.current = requestAnimationFrame(detect);
            })
            .catch(function () {
              if (!cancelled) {
                rafRef.current = requestAnimationFrame(detect);
              }
            });
        }

        rafRef.current = requestAnimationFrame(detect);
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    start();

    return function () {
      cancelled = true;
      stopCamera();
    };
  }, [open, passed, stopCamera]);

  return (
    <>
      <figure
        className="wiki-thumb wiki-thumb-lab wiki-gesture-captcha-thumb site-ui-glow"
        onClick={openCaptcha}
        onKeyDown={function (event) {
          if (event.key === "Enter" || event.key === " ") {
            openCaptcha(event);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Open gesture captcha"
      >
        <div className="wiki-thumb-inner">
          <img src={REFERENCE_IMAGE} alt="Cyberclone Laboratory" draggable={false} />
          <figcaption className="wiki-thumb-caption">click To Play</figcaption>
        </div>
      </figure>

      {open ? (
        <div className="wiki-gesture-captcha-overlay" onClick={close}>
          <div
            className="wiki-gesture-captcha"
            onClick={function (event) {
              event.stopPropagation();
            }}
          >
            <header className="wiki-gesture-captcha-header">
              <div className="wiki-gesture-captcha-header-text">
                <span className="wiki-gesture-captcha-kicker">Make the Gesture</span>
                <strong className="wiki-gesture-captcha-title">{GESTURE_LABEL}</strong>
              </div>
              <img
                className="wiki-gesture-captcha-ref"
                src={REFERENCE_IMAGE}
                alt="Reference gesture"
                draggable={false}
              />
            </header>

            <div className="wiki-gesture-captcha-video-wrap">
              <video
                ref={videoRef}
                className="wiki-gesture-captcha-video"
                playsInline
                muted
                autoPlay
              />
              <div className="wiki-gesture-captcha-grid" aria-hidden="true" />
              {status === "loading" ? (
                <div className="wiki-gesture-captcha-status">Loading camera…</div>
              ) : null}
              {status === "error" ? (
                <div className="wiki-gesture-captcha-status">Camera access denied</div>
              ) : null}
              {passed ? (
                <div className="wiki-gesture-captcha-status wiki-gesture-captcha-status-pass">
                  Verified
                </div>
              ) : null}
            </div>

            <footer className="wiki-gesture-captcha-footer">
              <p>Copy the gesture pictured top right.</p>
              <p className="wiki-gesture-captcha-hint">Hint: Make the 😢 gesture to the webcam.</p>
              <p className="wiki-gesture-captcha-note">
                n.b. if unresponsive the AI model may be loading — allow camera access and try again.
              </p>
            </footer>

            <button
              type="button"
              className="wiki-gesture-captcha-close"
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
