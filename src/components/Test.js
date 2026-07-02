"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./cyberclone-test.css";

const QUESTIONS = [
  "Do you use memes to express your emotions?",
  "Have you ever repeated a phrase because it became popular online?",
  "Have you ever copied a pose, face, filter, or gesture from the internet?",
  "Have you ever joined a trend even when you did not fully understand it?",
  "Do memes affect the way you see yourself or other people?",
];

const AD_STEPS = [
  { phase: "intro", layout: "layout-intro", labelText: "Advertisement", closePos: "top" },
  { phase: "question", layout: "layout-1", questionIndex: 0, labelText: "Advertisement", closePos: "top" },
  { phase: "question", layout: "layout-2", questionIndex: 1, labelText: "Sponsored", labelAlign: "left", closePos: "top" },
  { phase: "question", layout: "layout-3", questionIndex: 2, labelText: "Ad", labelAlign: "right", closePos: "bottom" },
  { phase: "question", layout: "layout-4", questionIndex: 3, labelText: "ADVERTISEMENT", labelAlign: "right", closePos: "top" },
  { phase: "question", layout: "layout-5", questionIndex: 4, labelText: "advertisement", labelAlign: "minimal", closePos: "bottom" },
  { phase: "result", layout: "layout-result", labelText: "Advertisement", closePos: "top" },
  { phase: "book", layout: "layout-book", labelText: "", closePos: "top", closeStyle: "pink" },
];

const INITIAL_AD_STEP = 1;

const DEFAULT_CLONE_IMAGES = [
  { gif: "/public/images/cyberclone-01.gif", still: "/images/1_0000.png" },
  { gif: "/public/images/cyberclone-02.gif", still: "/images/2_0000.png" },
  { gif: "/public/images/cyberclone-03.gif", still: "/public/images/3_0030.png" },
  { gif: "/public/images/cyberclone-04.gif", still: "/public/images/4_0010.png" },
  { gif: "/public/images/cyberclone-05.gif", still: "/public/images/5_0010.png" },
];

function normalizeCloneImages(list) {
  return (list || DEFAULT_CLONE_IMAGES).map(function (item) {
    if (typeof item === "string") {
      return { gif: item, still: item };
    }

    return {
      gif: item.gif,
      still: item.still || item.gif,
    };
  });
}

function sanitizeCodename(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);

  return cleaned || "anonymous";
}

function pickRandomAsset(assets) {
  return assets[Math.floor(Math.random() * assets.length)];
}

function scoreFromAnswers(answers) {
  return answers.reduce(function (total, answer) {
    return total + (answer === true ? 1 : 0);
  }, 0);
}

function buildResultPayload(state) {
  return {
    codename: state.codename,
    answers: state.answers,
    level: state.level,
    asset: state.asset,
    cloneNumber: state.cloneNumber,
    image: state.asset ? state.asset.gif : "",
  };
}

export default function CybercloneTest({
  cloneImages = DEFAULT_CLONE_IMAGES,
  adGif = "/public/images/ad.gif",
  bookPreviewGif = "/public/images/book-preview.gif",
  initialCloneNumber = 1,
  onComplete,
  onReleaseIntoField,
  onViewBooklet,
}) {
  const assets = normalizeCloneImages(cloneImages);
  const nextCloneNumberRef = useRef(initialCloneNumber);
  const codenameRef = useRef("anonymous");

  const [adStep, setAdStep] = useState(INITIAL_AD_STEP);
  const [adMaxReached, setAdMaxReached] = useState(INITIAL_AD_STEP);
  const [answers, setAnswers] = useState([null, null, null, null, null]);
  const [codenameInput, setCodenameInput] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [level, setLevel] = useState(0);
  const [asset, setAsset] = useState(null);
  const [cloneNumber, setCloneNumber] = useState(initialCloneNumber);
  const [exiting, setExiting] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [closeHint, setCloseHint] = useState("");
  const [contentPop, setContentPop] = useState(false);
  const [answering, setAnswering] = useState(false);

  const transitionTimerRef = useRef(null);
  const closeHintTimerRef = useRef(null);

  const step = AD_STEPS[adStep];

  const clearTimers = useCallback(function () {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (closeHintTimerRef.current) {
      window.clearTimeout(closeHintTimerRef.current);
      closeHintTimerRef.current = null;
    }
  }, []);

  useEffect(function () {
    return clearTimers;
  }, [clearTimers]);

  const triggerContentPop = useCallback(function () {
    setContentPop(false);
    requestAnimationFrame(function () {
      setContentPop(true);
    });
  }, []);

  const showCloseHint = useCallback(function (message) {
    setCloseHint(message);

    if (closeHintTimerRef.current) {
      window.clearTimeout(closeHintTimerRef.current);
    }

    closeHintTimerRef.current = window.setTimeout(function () {
      setCloseHint("");
      closeHintTimerRef.current = null;
    }, 1800);
  }, []);

  const prepareResult = useCallback(function (nextAnswers) {
    const nextLevel = scoreFromAnswers(nextAnswers);
    const nextAsset = nextLevel > 0 ? pickRandomAsset(assets) : null;
    const nextNumber = nextCloneNumberRef.current;

    setLevel(nextLevel);
    setAsset(nextAsset);
    setCloneNumber(nextNumber);

    const payload = buildResultPayload({
      codename: codenameRef.current,
      answers: nextAnswers,
      level: nextLevel,
      asset: nextAsset,
      cloneNumber: nextNumber,
    });

    onComplete?.(payload);
    return payload;
  }, [assets, onComplete]);

  const goToStep = useCallback(function (stepIndex, answersForResult) {
    setAdStep(stepIndex);
    setAnswering(false);
    triggerContentPop();

    if (stepIndex === 6 && answersForResult) {
      prepareResult(answersForResult);
    }
  }, [prepareResult, triggerContentPop]);

  const transitionToStep = useCallback(function (stepIndex, options) {
    setExiting(true);

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(function () {
      setExiting(false);
      goToStep(stepIndex, options && options.answers);
      transitionTimerRef.current = null;
    }, 200);
  }, [goToStep]);

  function resetTest() {
    clearTimers();
    setAdStep(INITIAL_AD_STEP);
    setAdMaxReached(INITIAL_AD_STEP);
    setAnswers([null, null, null, null, null]);
    setCodenameInput("");
    codenameRef.current = "anonymous";
    setCurrentQuestion(0);
    setLevel(0);
    setAsset(null);
    setCloneNumber(nextCloneNumberRef.current);
    setExiting(false);
    setShaking(false);
    setCloseHint("");
    setAnswering(false);
    triggerContentPop();
  }

  function startTest() {
    codenameRef.current = sanitizeCodename(codenameInput);
    setCurrentQuestion(0);
    setAnswers([null, null, null, null, null]);
    setAdMaxReached(1);
    transitionToStep(1);
  }

  function answerQuestion(isYes) {
    if (answering || step.phase !== "question") {
      return;
    }

    setAnswering(true);

    const questionIndex = step.questionIndex;
    const nextAnswers = answers.slice();
    nextAnswers[questionIndex] = isYes;

    if (questionIndex !== currentQuestion) {
      setAnswering(false);
      return;
    }

    setAnswers(nextAnswers);

    const nextQuestion = currentQuestion + 1;
    setCurrentQuestion(nextQuestion);

    if (nextQuestion >= QUESTIONS.length) {
      setAdMaxReached(function (prev) {
        return Math.max(prev, 6);
      });

      transitionToStep(6, { answers: nextAnswers });
      return;
    }

    const nextStep = questionIndex + 2;

    setAdMaxReached(function (prev) {
      return Math.max(prev, nextStep);
    });

    transitionToStep(nextStep);
  }

  function navigateAd(direction) {
    const delta = direction === "prev" ? -1 : 1;
    const nextStep = adStep + delta;

    if (nextStep < INITIAL_AD_STEP || nextStep > adMaxReached) {
      return;
    }

    transitionToStep(nextStep);
  }

  function getResultPayload() {
    return buildResultPayload({
      codename: codenameRef.current,
      answers,
      level,
      asset,
      cloneNumber,
    });
  }

  function openBooklet() {
    if (level <= 0) {
      return;
    }

    setAdMaxReached(function (prev) {
      return Math.max(prev, 7);
    });

    onViewBooklet?.(getResultPayload());
    transitionToStep(7);
  }

  function handleRelease() {
    onReleaseIntoField?.(getResultPayload());
  }

  function handleCloseClick() {
    if (step.phase === "book") {
      navigateAd("prev");
      return;
    }

    setShaking(false);
    requestAnimationFrame(function () {
      setShaking(true);
    });

    let message = "Continue to proceed.";

    if (step.phase === "intro") {
      message = "Start the test to continue.";
    } else if (step.phase === "question") {
      message = "Answer the question to continue.";
    } else if (step.phase === "result") {
      message = "Choose an action below to continue.";
    }

    showCloseHint(message);
  }

  const overlayClass = [
    "cyberclone-ad-overlay",
    step.labelAlign ? "cyberclone-ad-overlay--label-" + step.labelAlign : "",
  ]
    .filter(Boolean)
    .join(" ");

  const popupClass = [
    "cyberclone-ad-popup",
    "cyberclone-ad-popup--" + step.layout,
    step.closePos === "bottom" ? "cyberclone-ad-popup--close-bottom" : "",
    step.phase === "result" || step.phase === "book"
      ? "cyberclone-ad-popup--no-choices"
      : "",
    step.closeStyle === "pink" ? "cyberclone-ad-popup--close-pink" : "",
    exiting ? "cyberclone-ad-popup--exit" : "",
    shaking ? "cyberclone-ad-popup--shake" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const showVisual =
    step.phase === "question" &&
    (step.layout === "layout-1" || step.layout === "layout-3");

  const visualTag =
    step.layout === "layout-1" ? "SAVE 50%" : "SPONSORED";

  const visualCaption =
    step.layout === "layout-1"
      ? "Sponsored meme exposure check — answer yes or no to continue."
      : "Meme replication may exceed the space of the screen.";

  const resultGreeting =
    level > 0
      ? "Hello, Cyberclone No." + cloneNumber
      : "You Are Not A Cyberclone.";

  const resultLevelText =
    level > 0 ? "You Are A Level " + level + " Cyberclone." : "";

  const resultFootnote =
    level > 0
      ? "Your test result becomes the cover of your clone booklet."
      : "Enter the field to browse other specimens, or retake the test.";

  const releaseLabel = level > 0 ? "Release Into Field" : "Enter Field";

  return (
    <div className="cyberclone-test-panel cyberclone-test-panel--ad-active min-h-[520px]">
      <div className={overlayClass} aria-hidden="false">
        {step.labelText ? (
          <p className="cyberclone-ad-label">{step.labelText}</p>
        ) : (
          <p className="cyberclone-ad-label hidden">{step.labelText}</p>
        )}

        <div
          className={popupClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cybercloneAdHeadline"
        >
          <span className="cyberclone-ad-badge">AD</span>
          <span className="cyberclone-ad-choices" aria-hidden="true" />

          <button
            type="button"
            className="cyberclone-ad-close"
            aria-label="Close advertisement"
            onClick={handleCloseClick}
          >
            ×
          </button>

          <nav className="cyberclone-ad-nav" aria-label="Advertisement navigation">
            <button
              type="button"
              className="cyberclone-ad-nav-btn"
              aria-label="Previous advertisement"
              disabled={adStep <= INITIAL_AD_STEP}
              onClick={function () {
                navigateAd("prev");
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="cyberclone-ad-nav-btn"
              aria-label="Next advertisement"
              disabled={adStep >= adMaxReached}
              onClick={function () {
                navigateAd("next");
              }}
            >
              ›
            </button>
          </nav>

          <div className="cyberclone-ad-main">
            {(step.phase === "intro" || step.phase === "question") && (
              <div className="cyberclone-ad-standard-layout">
                <div
                  className={
                    "cyberclone-ad-content" +
                    (contentPop ? " cyberclone-ad-text-pop" : "")
                  }
                >
                  {step.phase === "intro" ? (
                    <>
                      <p className="cyberclone-ad-meta">Cyberclone Diagnostic</p>
                      <p id="cybercloneAdHeadline" className="cyberclone-ad-headline">
                        Are You A Cyberclone?
                      </p>
                      <p className="cyberclone-ad-subtext">
                        This test measures your level of meme exposure through five
                        simple yes or no questions. Each yes produces one level of
                        cybercloning.
                      </p>
                    </>
                  ) : (
                    <>
                      <p id="cybercloneAdHeadline" className="cyberclone-ad-headline">
                        {QUESTIONS[step.questionIndex]}
                      </p>
                      <p className="cyberclone-ad-subtext">
                        Answer yes or no to continue this sponsored meme exposure
                        check.
                      </p>
                    </>
                  )}
                </div>

                <div
                  className={
                    "cyberclone-ad-visual" + (showVisual ? "" : " hidden")
                  }
                  aria-hidden={showVisual ? "false" : "true"}
                >
                  {showVisual && (
                    <>
                      <img
                        className="cyberclone-ad-visual-image"
                        src={adGif}
                        alt="Advertisement"
                        draggable={false}
                      />
                      <span className="cyberclone-ad-visual-tag">{visualTag}</span>
                      <p className="cyberclone-ad-visual-caption">{visualCaption}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {step.phase === "result" && (
              <div
                className={
                  "cyberclone-ad-result-layout" +
                  (contentPop ? " cyberclone-ad-text-pop" : "")
                }
                aria-hidden="false"
              >
                <div className="cyberclone-ad-result-booklet">
                  <div className="cyberclone-ad-result-hero">
                    <div
                      className={
                        level > 0 && asset
                          ? "cyberclone-result-specimen level-" + level
                          : "cyberclone-result-specimen hidden"
                      }
                    >
                      {level > 0 && asset && (
                        <img
                          src={asset.gif}
                          alt="Cyberclone Specimen"
                          draggable={false}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="cyberclone-ad-result-side">
                  <p className="cyberclone-ad-result-greeting">{resultGreeting}</p>
                  {level > 0 && (
                    <p className="cyberclone-ad-result-level">{resultLevelText}</p>
                  )}
                  <p className="cyberclone-ad-result-footnote">{resultFootnote}</p>

                  <div className="cyberclone-ad-actions cyberclone-ad-actions--result">
                    <button
                      type="button"
                      className={
                        "cyberclone-ad-answer-button" +
                        (level <= 0 ? " hidden" : "")
                      }
                      disabled={level <= 0}
                      onClick={openBooklet}
                    >
                      View Your Clone Booklet
                    </button>
                    <button
                      type="button"
                      className="cyberclone-ad-answer-button"
                      onClick={handleRelease}
                    >
                      {releaseLabel}
                    </button>
                    <button
                      type="button"
                      className="cyberclone-ad-answer-button"
                      onClick={resetTest}
                    >
                      Retake Test
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step.phase === "book" && (
              <div
                className={
                  "cyberclone-ad-book-layout" +
                  (contentPop ? " cyberclone-ad-text-pop" : "")
                }
                aria-hidden="false"
              >
                <img
                  className="cyberclone-ad-book-preview"
                  src={bookPreviewGif}
                  alt="Clone booklet preview"
                  draggable={false}
                />
              </div>
            )}
          </div>

          <div
            className={
              "cyberclone-ad-intro-extra" +
              (step.phase === "intro" ? "" : " hidden")
            }
          >
            <label className="cyberclone-ad-codename-label" htmlFor="cybercloneCodenameInput">
              Enter your codename
            </label>
            <input
              id="cybercloneCodenameInput"
              className="cyberclone-ad-codename-input"
              type="text"
              maxLength={24}
              placeholder="anonymous"
              autoComplete="off"
              value={codenameInput}
              onChange={function (event) {
                setCodenameInput(event.target.value);
              }}
            />
          </div>

          <button type="button" className="cyberclone-ad-arrow" tabIndex={-1} aria-hidden="true">
            <span aria-hidden="true">→</span>
          </button>

          <div
            className={
              "cyberclone-ad-actions" + (step.phase === "intro" ? "" : " hidden")
            }
          >
            <button
              type="button"
              className="cyberclone-ad-answer-button"
              onClick={startTest}
            >
              Start Test
            </button>
          </div>

          <div
            className={
              "cyberclone-ad-actions" + (step.phase === "question" ? "" : " hidden")
            }
          >
            <button
              type="button"
              className="cyberclone-ad-answer-button"
              onClick={function () {
                answerQuestion(true);
              }}
            >
              Yes
            </button>
            <button
              type="button"
              className="cyberclone-ad-answer-button"
              onClick={function () {
                answerQuestion(false);
              }}
            >
              No
            </button>
          </div>

          {closeHint ? (
            <p className="cyberclone-ad-close-hint" aria-live="polite">
              {closeHint}
            </p>
          ) : (
            <p className="cyberclone-ad-close-hint hidden" aria-live="polite" />
          )}
        </div>
      </div>
    </div>
  );
}
