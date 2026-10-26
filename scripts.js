/* Shared, dependency-free interactions for the LittleSteps screens. */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const speak = (message, pitch = 1.2) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(message);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) => /en/i.test(voice.lang) && /zira|aria|jenny|samantha|female/i.test(voice.name))
      || voices.find((voice) => /^en/i.test(voice.lang));
    utterance.lang = preferredVoice?.lang || document.documentElement.lang || "en-US";
    utterance.voice = preferredVoice || null;
    utterance.rate = 0.82;
    utterance.pitch = pitch;
    utterance.volume = 1;
    const availableVoices = window.speechSynthesis.getVoices();
    utterance.voice = availableVoices.find((voice) => voice.lang.toLowerCase().startsWith("en")) || null;
    const startSpeaking = () => {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch {
        // Keep the visible prompt available if device speech output is unavailable.
      }
    };
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      window.setTimeout(startSpeaking, 80);
    } else {
      startSpeaking();
    }
    return utterance;
  };
  const BUDDY_STORAGE_KEY = "littlesteps.learningBuddy";
  const allowedBuddies = {
    Prince: "Shaq.png",
    Pip: "Pip.png",
    Leo: "Leo.png",
    Toby: "Toby.png"
  };
  const defaultBuddy = { name: "Prince", image: allowedBuddies.Prince };
  const readSavedBuddy = () => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(BUDDY_STORAGE_KEY) || "null");
      if (saved && allowedBuddies[saved.name] === saved.image) return saved;
    } catch {
      // Storage may be disabled in private or restricted browser contexts.
    }
    return null;
  };
  const applyBuddy = (buddy) => {
    $$('[data-learning-buddy-image]').forEach((image) => {
      image.src = buddy.image;
      image.alt = `${buddy.name}, your learning buddy`;
    });
    $$('[data-learning-buddy-name]').forEach((name) => {
      name.textContent = buddy.name;
    });
    $$('[data-learning-buddy-label]').forEach((label) => {
      label.textContent = label.dataset.buddyLabelTemplate?.replace("{buddy}", buddy.name) || buddy.name;
    });
    $$('[data-buddy-aria-template]').forEach((element) => {
      element.setAttribute("aria-label", element.dataset.buddyAriaTemplate.replace("{buddy}", buddy.name));
    });
  };
  const selectedBuddy = readSavedBuddy() || defaultBuddy;
  applyBuddy(selectedBuddy);

  const NUMBER_JOURNEY_COMPLETE_KEY = "littlesteps.numberJourneyComplete";
  const numberItemsCard = $(".number-items-card");
  if (numberItemsCard) {
    let numberJourneyComplete = false;
    try {
      numberJourneyComplete = window.localStorage.getItem(NUMBER_JOURNEY_COMPLETE_KEY) === "true";
    } catch {
      // The section remains locked if progress cannot be stored.
    }

    const numberItemsLink = $(".number-items-link", numberItemsCard);
    const numberItemsLinkIcon = $("#number-items-link-icon", numberItemsCard);
    const lockMessage = $("#number-items-lock-message", numberItemsCard);
    const statusText = $("#number-items-status-text", numberItemsCard);
    const statusIcon = $("#number-items-status-icon", numberItemsCard);
    numberItemsCard.classList.toggle("is-locked", !numberJourneyComplete);
    numberItemsCard.setAttribute("aria-disabled", String(!numberJourneyComplete));
    if (!numberJourneyComplete) {
      numberItemsCard.setAttribute("aria-describedby", "number-items-lock-message");
      lockMessage?.classList.remove("hidden");
      if (numberItemsLink) {
        numberItemsLink.dataset.destination = numberItemsLink.getAttribute("href") || "Page 3.html";
        numberItemsLink.removeAttribute("href");
        numberItemsLink.setAttribute("aria-disabled", "true");
        numberItemsLink.setAttribute("tabindex", "-1");
      }
      if (numberItemsLinkIcon) numberItemsLinkIcon.textContent = "lock";
      if (statusText) statusText.textContent = "Locked";
      if (statusIcon) statusIcon.textContent = "lock";
    }
  }

  // Ensure remote image failures remain understandable and never break layout.
  $$('img').forEach((image) => {
    if (!image.hasAttribute("alt")) {
      image.alt = image.dataset.alt || "Learning activity illustration";
    }
    image.addEventListener("error", () => {
      image.hidden = true;
      const parent = image.parentElement;
      if (parent) parent.classList.add("image-unavailable");
    }, { once: true });
  });

  // Replay the on-screen instruction using the device's speech engine.
  const voiceButtons = [
    ["#voice-prompt-btn", "Hi there! I'm {buddy}. Ready to learn and play?"],
    ["#voice-button", "Hi there! Are you ready to learn and play?"]
  ];
  voiceButtons.forEach(([selector, message]) => {
    const button = $(selector);
    button?.addEventListener("click", () => {
      const buddy = readSavedBuddy() || defaultBuddy;
      speak(message.replaceAll("{buddy}", buddy.name), 1.25);
    });
  });

  const classCards = $$('.class-card');
  classCards.forEach((card) => {
    if (card.getAttribute("aria-checked") === "true") card.classList.add("selected");
  });
  classCards.forEach((card) => card.addEventListener("click", () => {
    classCards.forEach((item) => {
      item.setAttribute("aria-checked", "false");
      item.classList.remove("selected");
      item.classList.remove("bg-secondary-fixed", "shadow-[0_4px_0_0_#f9bd22]");
      item.classList.add("bg-surface-container-lowest", "shadow-[0_4px_0_0_#dce2f3]");
      item.querySelector(".check-stamp")?.remove();
    });
    card.setAttribute("aria-checked", "true");
    card.classList.add("selected");
    card.classList.remove("bg-surface-container-lowest", "shadow-[0_4px_0_0_#dce2f3]");
    card.classList.add("bg-secondary-fixed", "shadow-[0_4px_0_0_#f9bd22]");
    const stamp = document.createElement("span");
    stamp.className = "check-stamp absolute -top-2 -right-1 w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_2px_0_0_#5a00c6] material-symbols-outlined text-[16px]";
    stamp.setAttribute("aria-hidden", "true");
    stamp.textContent = "check";
    card.append(stamp);
  }));

  const buddyButtons = $$('.buddy-btn');
  if (buddyButtons.length) {
    const restored = buddyButtons.find((button) => button.dataset.buddyName === selectedBuddy.name);
    if (restored) {
      buddyButtons.forEach((button) => {
        const selected = button === restored;
        button.setAttribute("aria-checked", String(selected));
        button.classList.toggle("selected", selected);
        button.classList.toggle("bg-surface-container-low", selected);
        button.classList.toggle("shadow-[0_4px_0_0_#7c3aed]", selected);
        button.classList.toggle("bg-surface-container-lowest", !selected);
        button.classList.toggle("shadow-[0_3px_0_0_#dce2f3]", !selected);
        button.querySelector(":scope > span")?.classList.toggle("text-primary", selected);
        button.querySelector(":scope > span")?.classList.toggle("font-bold", selected);
        button.querySelector(":scope > span")?.classList.toggle("text-on-surface-variant", !selected);
        button.querySelector(".buddy-check")?.remove();
      });
      const selectedAvatar = restored.querySelector(".w-16");
      if (selectedAvatar) {
        const check = document.createElement("span");
        check.className = "buddy-check absolute -bottom-0.5 right-1 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center material-symbols-outlined text-[14px]";
        check.setAttribute("aria-hidden", "true");
        check.textContent = "check";
        selectedAvatar.append(check);
      }
    }
  }
  buddyButtons.forEach((button) => {
    if (button.getAttribute("aria-checked") === "true") button.classList.add("selected");
  });
  buddyButtons.forEach((button) => button.addEventListener("click", () => {
    const buddy = { name: button.dataset.buddyName, image: button.dataset.buddyImage };
    if (allowedBuddies[buddy.name] !== buddy.image) return;
    try {
      window.localStorage.setItem(BUDDY_STORAGE_KEY, JSON.stringify(buddy));
    } catch {
      // The current page still reflects the selection when storage is unavailable.
    }
    applyBuddy(buddy);
    buddyButtons.forEach((item) => {
      item.setAttribute("aria-checked", "false");
      item.classList.remove("selected");
      item.classList.remove("bg-surface-container-low", "shadow-[0_4px_0_0_#7c3aed]");
      item.classList.add("bg-surface-container-lowest", "shadow-[0_3px_0_0_#dce2f3]");
      const label = item.querySelector(":scope > span");
      if (label) label.className = "font-label-md text-label-md text-on-surface-variant";
      item.querySelector(".buddy-check")?.remove();
    });
    button.setAttribute("aria-checked", "true");
    button.classList.add("selected");
    button.classList.remove("bg-surface-container-lowest", "shadow-[0_3px_0_0_#dce2f3]");
    button.classList.add("bg-surface-container-low", "shadow-[0_4px_0_0_#7c3aed]");
    const label = button.querySelector(":scope > span");
    if (label) label.className = "font-label-md text-label-md text-primary font-bold";
    const avatar = button.querySelector(".w-16");
    if (avatar && !avatar.querySelector(".buddy-check")) {
      const check = document.createElement("span");
      check.className = "buddy-check absolute -bottom-0.5 right-1 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center material-symbols-outlined text-[14px]";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "check";
      avatar.append(check);
    }
  }));

  const playButton = $("#play-button");
  playButton?.addEventListener("click", () => {
    const sparkle = document.createElement("span");
    const bounds = playButton.getBoundingClientRect();
    sparkle.className = "fixed z-50 pointer-events-none text-secondary-container material-symbols-outlined text-[36px] animate-bounce";
    sparkle.style.left = `${bounds.left + bounds.width / 2 - 18}px`;
    sparkle.style.top = `${bounds.top - 20}px`;
    sparkle.setAttribute("aria-hidden", "true");
    sparkle.textContent = "stars";
    document.body.append(sparkle);
    window.setTimeout(() => sparkle.remove(), 900);
  });

  const lessonVideo = $("#lessonVideo");
  const playPause = $("#playPauseBtn");
  const playPauseIcon = $("#playPauseIcon");
  const videoScrim = $("#videoScrim");
  const progressTrack = $("#progressTrack");
  const progressBar = $("#progressBar");
  const starScrubber = $("#starScrubber");
  const currentTimeLabel = $("#currentTime");
  const durationLabel = $("#durationTime");
  const videoStatus = $("#videoStatusText");
  const videoStatusDot = $("#videoStatusDot");
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };
  const updateVideoControls = () => {
    if (!lessonVideo) return;
    const hasDuration = Number.isFinite(lessonVideo.duration) && lessonVideo.duration > 0;
    const progress = hasDuration ? Math.min(100, (lessonVideo.currentTime / lessonVideo.duration) * 100) : 0;
    if (currentTimeLabel) currentTimeLabel.textContent = formatTime(lessonVideo.currentTime);
    if (durationLabel) durationLabel.textContent = hasDuration ? formatTime(lessonVideo.duration) : "0:00";
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (starScrubber) starScrubber.style.left = `${progress}%`;
    progressTrack?.setAttribute("aria-valuenow", String(Math.round(progress)));
    if (playPauseIcon) playPauseIcon.textContent = lessonVideo.paused || lessonVideo.ended ? "play_arrow" : "pause";
    playPause?.setAttribute("aria-label", lessonVideo.paused || lessonVideo.ended ? "Play lesson video" : "Pause lesson video");
    videoScrim?.classList.toggle("opacity-0", !lessonVideo.paused && !lessonVideo.ended);
    if (videoStatus && !lessonVideo.error) videoStatus.textContent = lessonVideo.paused ? "Ready to play" : "Playing";
    videoStatusDot?.classList.toggle("animate-ping", !lessonVideo.paused && !lessonVideo.ended);
  };
  const seekToPointer = (event) => {
    if (!lessonVideo || !progressTrack || !Number.isFinite(lessonVideo.duration)) return;
    const bounds = progressTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    lessonVideo.currentTime = ratio * lessonVideo.duration;
    updateVideoControls();
  };

  if (lessonVideo) {
    ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended", "seeking", "seeked"].forEach((eventName) => {
      lessonVideo.addEventListener(eventName, updateVideoControls);
    });
    lessonVideo.addEventListener("waiting", () => {
      if (videoStatus) videoStatus.textContent = "Loading video…";
    });
    lessonVideo.addEventListener("error", () => {
      if (videoStatus) videoStatus.textContent = "Video could not be played";
      if (videoStatusDot) videoStatusDot.classList.remove("animate-ping");
    });
    updateVideoControls();
  }

  playPause?.addEventListener("click", async () => {
    if (!lessonVideo) return;
    if (lessonVideo.paused || lessonVideo.ended) {
      if (lessonVideo.ended) lessonVideo.currentTime = 0;
      try {
        await lessonVideo.play();
      } catch {
        if (videoStatus) videoStatus.textContent = "Tap play to start the video";
      }
    } else {
      lessonVideo.pause();
    }
    updateVideoControls();
  });

  $("#replayBtn")?.addEventListener("click", () => {
    if (!lessonVideo) return;
    lessonVideo.currentTime = Math.max(0, lessonVideo.currentTime - 10);
    updateVideoControls();
  });

  let draggingProgress = false;
  progressTrack?.addEventListener("pointerdown", (event) => {
    draggingProgress = true;
    progressTrack.setPointerCapture?.(event.pointerId);
    seekToPointer(event);
  });
  progressTrack?.addEventListener("pointermove", (event) => {
    if (draggingProgress) seekToPointer(event);
  });
  progressTrack?.addEventListener("pointerup", () => {
    draggingProgress = false;
  });
  progressTrack?.addEventListener("pointercancel", () => {
    draggingProgress = false;
  });
  progressTrack?.addEventListener("click", (event) => {
    if (!draggingProgress) seekToPointer(event);
  });
  progressTrack?.addEventListener("keydown", (event) => {
    if (!lessonVideo || !Number.isFinite(lessonVideo.duration)) return;
    const jump = event.shiftKey ? 10 : 5;
    if (event.key === "ArrowRight") lessonVideo.currentTime = Math.min(lessonVideo.duration, lessonVideo.currentTime + jump);
    else if (event.key === "ArrowLeft") lessonVideo.currentTime = Math.max(0, lessonVideo.currentTime - jump);
    else if (event.key === "Home") lessonVideo.currentTime = 0;
    else if (event.key === "End") lessonVideo.currentTime = lessonVideo.duration;
    else return;
    event.preventDefault();
    updateVideoControls();
  });

  const muteToggle = $("#muteToggle");
  const muteIcon = $("#muteIcon");
  const speakerButton = $("#speakerBtn");
  const speakerIcon = $("#speakerIcon");
  const updateMuteControls = () => {
    const muted = Boolean(lessonVideo?.muted);
    if (muteIcon) muteIcon.textContent = muted ? "volume_off" : "volume_up";
    if (speakerIcon) speakerIcon.textContent = muted ? "volume_off" : "volume_up";
    muteToggle?.setAttribute("aria-label", muted ? "Unmute video" : "Mute video");
    speakerButton?.setAttribute("aria-label", muted ? "Unmute video" : "Mute video");
  };
  [muteToggle, speakerButton].forEach((button) => button?.addEventListener("click", () => {
    if (!lessonVideo) return;
    lessonVideo.muted = !lessonVideo.muted;
    updateMuteControls();
  }));
  lessonVideo?.addEventListener("volumechange", updateMuteControls);
  updateMuteControls();

  const quizQuestions = [
    { prompt: "Find the number 3.", answer: 3, choices: [1, 3, 5] },
    { prompt: "What number comes after 2?", answer: 3, choices: [1, 3, 4] },
    { prompt: "Draw the number 5.", answer: 5, mode: "draw" },
    { prompt: "Find the number 7.", answer: 7, choices: [6, 7, 8] },
    { prompt: "What number is between 4 and 6?", answer: 5, choices: [3, 5, 7] }
  ];
  const choiceCards = $$(".choice-card");
  const celebration = $("#celebration-pod");
  const celebrationMessage = $("#celebrationMessage");
  const quizProgress = $("#quizProgress");
  const quizProgressDots = $("#quizProgressDots");
  const questionPrompt = $("#questionPrompt");
  const answerInstruction = $("#answerInstruction");
  const floatingBuddyButton = $("#kofi-avatar-btn");
  const cardsContainer = $("#cards-container");
  const nextActivityButton = $("#nextActivityBtn");
  const drawAnswerPanel = $("#drawAnswerPanel");
  const numberCanvas = $("#numberCanvas");
  const drawFeedback = $("#drawFeedback");
  const checkDrawingButton = $("#checkDrawingBtn");
  const questionContent = [questionPrompt?.closest(".relative.bg-surface-container-low"), $("#answerInstruction")?.parentElement, cardsContainer, drawAnswerPanel].filter(Boolean);
  let questionIndex = 0;
  let answerLocked = false;
  let drawingStrokes = [];
  let activeStroke = null;
  let waitingForManualAdvance = false;
  celebration?.classList.add("hidden");
  nextActivityButton?.classList.add("hidden");

  const canvasContext = numberCanvas?.getContext("2d");
  const guidePath = [
    { x: 390, y: 55 },
    { x: 210, y: 55 },
    { x: 210, y: 145 },
    { x: 330, y: 145 }
  ];
  const guideSamples = [];
  const addLineSamples = (start, end, spacing = 10) => {
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const count = Math.max(1, Math.ceil(length / spacing));
    for (let i = 0; i <= count; i += 1) {
      const ratio = i / count;
      guideSamples.push({ x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio });
    }
  };
  for (let i = 0; i < guidePath.length - 1; i += 1) addLineSamples(guidePath[i], guidePath[i + 1]);
  const curveStart = guidePath[guidePath.length - 1];
  const curve = [{ x: 430, y: 145 }, { x: 425, y: 245 }, { x: 315, y: 255 }];
  let previousCurvePoint = curveStart;
  for (let i = 1; i <= 30; i += 1) {
    const t = i / 30;
    const inverse = 1 - t;
    const point = {
      x: inverse ** 3 * curveStart.x + 3 * inverse ** 2 * t * curve[0].x + 3 * inverse * t ** 2 * curve[1].x + t ** 3 * curve[2].x,
      y: inverse ** 3 * curveStart.y + 3 * inverse ** 2 * t * curve[0].y + 3 * inverse * t ** 2 * curve[1].y + t ** 3 * curve[2].y
    };
    guideSamples.push(point);
    previousCurvePoint = point;
  }
  addLineSamples(previousCurvePoint, { x: 215, y: 210 });

  const drawFiveGuide = () => {
    if (!canvasContext || !numberCanvas) return;
    canvasContext.clearRect(0, 0, numberCanvas.width, numberCanvas.height);
    canvasContext.fillStyle = "#ffffff";
    canvasContext.fillRect(0, 0, numberCanvas.width, numberCanvas.height);
    canvasContext.save();
    canvasContext.strokeStyle = "#d2bbff";
    canvasContext.lineWidth = 26;
    canvasContext.lineCap = "round";
    canvasContext.lineJoin = "round";
    canvasContext.setLineDash([3, 14]);
    canvasContext.beginPath();
    canvasContext.moveTo(guidePath[0].x, guidePath[0].y);
    canvasContext.lineTo(guidePath[1].x, guidePath[1].y);
    canvasContext.lineTo(guidePath[2].x, guidePath[2].y);
    canvasContext.lineTo(guidePath[3].x, guidePath[3].y);
    canvasContext.bezierCurveTo(curve[0].x, curve[0].y, curve[1].x, curve[1].y, curve[2].x, curve[2].y);
    canvasContext.lineTo(215, 210);
    canvasContext.stroke();
    canvasContext.restore();

    drawingStrokes.forEach((stroke) => {
      if (!stroke.length) return;
      canvasContext.beginPath();
      canvasContext.strokeStyle = "#630ed4";
      canvasContext.lineWidth = 20;
      canvasContext.lineCap = "round";
      canvasContext.lineJoin = "round";
      canvasContext.moveTo(stroke[0].x, stroke[0].y);
      stroke.slice(1).forEach((point) => canvasContext.lineTo(point.x, point.y));
      if (stroke.length === 1) canvasContext.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
      canvasContext.stroke();
    });
  };

  const checkDrawnFive = () => {
    const points = drawingStrokes.flat();
    const strokeLength = drawingStrokes.reduce((total, stroke) => {
      for (let i = 1; i < stroke.length; i += 1) total += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y);
      return total;
    }, 0);
    if (points.length < 8 || strokeLength < 100) return false;
    const nearbyCount = guideSamples.filter((sample) => points.some((point) => Math.hypot(point.x - sample.x, point.y - sample.y) < 52)).length;
    const coverage = nearbyCount / guideSamples.length;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    return coverage >= 0.48 && maxX - minX > 90 && maxY - minY > 100;
  };

  numberCanvas?.addEventListener("pointerdown", (event) => {
    if (answerLocked || questionIndex !== 2) return;
    event.preventDefault();
    numberCanvas.setPointerCapture(event.pointerId);
    const bounds = numberCanvas.getBoundingClientRect();
    activeStroke = [{ x: (event.clientX - bounds.left) * numberCanvas.width / bounds.width, y: (event.clientY - bounds.top) * numberCanvas.height / bounds.height }];
    drawingStrokes.push(activeStroke);
    drawFiveGuide();
  });
  numberCanvas?.addEventListener("pointermove", (event) => {
    if (!activeStroke) return;
    const bounds = numberCanvas.getBoundingClientRect();
    activeStroke.push({ x: (event.clientX - bounds.left) * numberCanvas.width / bounds.width, y: (event.clientY - bounds.top) * numberCanvas.height / bounds.height });
    drawFiveGuide();
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
    numberCanvas?.addEventListener(eventName, () => { activeStroke = null; });
  });
  checkDrawingButton?.addEventListener("click", () => {
    if (questionIndex !== 2 || answerLocked) return;
    if (checkDrawnFive()) {
      drawAnswerPanel?.classList.remove("draw-needs-practice");
      celebrateAnswer();
    } else {
      drawAnswerPanel?.classList.remove("draw-needs-practice");
      void drawAnswerPanel?.offsetWidth;
      drawAnswerPanel?.classList.add("draw-needs-practice");
      if (drawFeedback) drawFeedback.textContent = "Nice try! Your space will clear so you can try again.";
      speak("Nice try! Let's try drawing the number five again.", 1.1);
      window.setTimeout(() => {
        if (questionIndex !== 2 || answerLocked) return;
        drawingStrokes = [];
        activeStroke = null;
        drawAnswerPanel?.classList.remove("draw-needs-practice");
        drawFiveGuide();
        if (drawFeedback) drawFeedback.textContent = "Your turn! Draw a 5.";
      }, 800);
    }
  });

  const resetChoiceCards = () => {
    choiceCards.forEach((card) => {
      card.classList.remove("is-correct", "is-wrong", "animate-pulse");
      card.removeAttribute("aria-disabled");
      const status = $(".status-indicator", card);
      status?.classList.add("hidden");
      status?.classList.remove("flex", "animate-bounce");
      if (status) status.innerHTML = '<span class="material-symbols-outlined text-[18px]">star</span>';
    });
  };

  const renderQuestion = () => {
    const question = quizQuestions[questionIndex];
    if (!question) return;
    answerLocked = false;
    drawingStrokes = [];
    activeStroke = null;
    resetChoiceCards();
    if (questionPrompt) questionPrompt.textContent = `“${question.prompt}”`;
    const currentBuddy = readSavedBuddy() || defaultBuddy;
    floatingBuddyButton?.setAttribute("aria-label", `${currentBuddy.name} asks: ${question.prompt} Tap to hear`);
    if (answerInstruction) answerInstruction.textContent = question.mode === "draw" ? "Use your finger to draw in the space provided." : "Touch the number that matches!";
    cardsContainer?.classList.toggle("hidden", question.mode === "draw");
    drawAnswerPanel?.classList.toggle("hidden", question.mode !== "draw");
    if (question.mode === "draw") {
      if (drawFeedback) drawFeedback.textContent = "Your turn! Draw a 5.";
      window.requestAnimationFrame(drawFiveGuide);
    }
    if (quizProgress) quizProgress.textContent = `Question ${questionIndex + 1} of ${quizQuestions.length}`;
    if (quizProgressDots) {
      quizProgressDots.replaceChildren();
      quizQuestions.forEach((_, index) => {
        const dot = document.createElement("span");
        dot.className = `quiz-progress-dot${index < questionIndex ? " is-complete" : ""}${index === questionIndex ? " is-current" : ""}`;
        dot.setAttribute("aria-hidden", "true");
        quizProgressDots.append(dot);
      });
    }
    choiceCards.forEach((card, index) => {
      if (question.mode === "draw") return;
      const value = question.choices[index];
      card.dataset.number = String(value);
      card.setAttribute("aria-label", `Option ${value}`);
      const number = $(".font-display", card);
      if (number) number.textContent = String(value);
    });
  };

  floatingBuddyButton?.addEventListener("click", () => {
    const currentBuddy = readSavedBuddy() || defaultBuddy;
    const currentQuestion = quizQuestions[questionIndex];
    const soundBadge = $("#sound-badge", floatingBuddyButton);
    const soundIcon = $(".material-symbols-outlined", soundBadge);
    const utterance = speak(`${currentBuddy.name} asks: ${currentQuestion.prompt}`, 1.25);
    floatingBuddyButton.classList.add("is-speaking");
    if (soundIcon) soundIcon.textContent = "graphic_eq";
    const stopSpeaking = () => {
      floatingBuddyButton.classList.remove("is-speaking");
      if (soundIcon) soundIcon.textContent = "volume_up";
    };
    if (utterance) {
      utterance.addEventListener("end", stopSpeaking, { once: true });
      utterance.addEventListener("error", stopSpeaking, { once: true });
    }
    window.setTimeout(stopSpeaking, Math.max(2500, currentQuestion.prompt.length * 75));
  });

  const playApplause = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const context = new AudioContextClass();
      const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.12), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
      [0, 0.16, 0.32].forEach((delay, index) => {
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        source.buffer = buffer;
        filter.type = "bandpass";
        filter.frequency.value = 1200 + index * 250;
        gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + delay + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.12);
        source.connect(filter).connect(gain).connect(context.destination);
        source.start(context.currentTime + delay);
        source.stop(context.currentTime + delay + 0.13);
      });
      window.setTimeout(() => context.close(), 800);
    } catch {
      // Praise speech and visual celebration still work if audio is unavailable.
    }
  };

  const finishQuiz = () => {
    try {
      window.localStorage.setItem("littlesteps.numberJourneyComplete", "true");
    } catch {
      // Continue to the celebration even if progress storage is unavailable.
    }
    window.location.href = "Congratulations.html";
  };

  const advanceToNextQuestion = (buddy) => {
    celebration?.classList.add("hidden");
    celebration?.classList.remove("flex");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 0 : 240;
    const visibleQuestionContent = questionContent.filter((element) => !element.classList.contains("hidden") && element.getClientRects().length);
    visibleQuestionContent.forEach((element) => {
      element.getAnimations().forEach((animation) => animation.cancel());
      const outgoingAnimation = element.animate(
        [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(-2.5rem)" }],
        { duration, easing: "ease-in", fill: "forwards" }
      );
      outgoingAnimation.finished.then(() => outgoingAnimation.cancel()).catch(() => {});
    });
    window.setTimeout(() => {
      questionIndex += 1;
      renderQuestion();
      questionContent.filter((element) => !element.classList.contains("hidden") && element.getClientRects().length).forEach((element) => {
        element.getAnimations().forEach((animation) => animation.cancel());
        const incomingAnimation = element.animate(
          [{ opacity: 0, transform: "translateX(2.5rem)" }, { opacity: 1, transform: "translateX(0)" }],
          { duration: reduceMotion ? 0 : 300, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)", fill: "both" }
        );
        incomingAnimation.finished.then(() => incomingAnimation.cancel()).catch(() => {});
      });
      speak(`${buddy.name} asks: ${quizQuestions[questionIndex].prompt}`, 1.2);
    }, duration);
  };

  const celebrateAnswer = () => {
    answerLocked = true;
    const question = quizQuestions[questionIndex];
    const buddy = readSavedBuddy() || defaultBuddy;
    const praiseMessages = [
      `Brilliant! You found number ${question.answer}!`,
      `Fantastic thinking! Number ${question.answer} is right!`,
      question.mode === "draw" ? "Your number five looks wonderful! You are a brilliant artist!" : `Wonderful work! You found number ${question.answer}!`,
      `Amazing! You spotted number ${question.answer}!`,
      `You did it! Excellent number finding!`
    ];
    const praiseUtterance = speak(praiseMessages[questionIndex] || `Great work! You found number ${question.answer}!`, 1.35);
    playApplause();
    celebrationMessage.textContent = questionIndex === quizQuestions.length - 1
      ? "Amazing! You finished them all!"
      : question.mode === "draw" ? "Your number 5 looks wonderful!" : [
        "Brilliant! You got it!",
        "Fantastic thinking!",
        "Beautiful work!",
        "Amazing! You found it!",
        "Excellent job!"
      ][questionIndex];
    celebration?.classList.remove("hidden");
    celebration?.classList.add("flex");
    celebration?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const finishPraise = () => {
      if (questionIndex < quizQuestions.length - 1) advanceToNextQuestion(buddy);
      else finishQuiz();
    };
    if (praiseUtterance) {
      praiseUtterance.addEventListener("end", finishPraise, { once: true });
      praiseUtterance.addEventListener("error", finishPraise, { once: true });
    } else if (questionIndex < quizQuestions.length - 1) {
      // No speech engine is available; let the learner advance when ready.
      waitingForManualAdvance = true;
      if (answerInstruction) answerInstruction.textContent = "Tap Next Question when you are ready!";
      if (nextActivityButton) nextActivityButton.querySelector("span:first-child").textContent = "Next Question";
      nextActivityButton?.classList.remove("hidden");
    } else {
      finishQuiz();
    }
  };

  choiceCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (answerLocked) return;
      const question = quizQuestions[questionIndex];
      if (question.mode === "draw") return;
      const selectedAnswer = Number(card.dataset.number);
      if (selectedAnswer !== question.answer) {
        card.classList.remove("is-wrong");
        void card.offsetWidth;
        card.classList.add("is-wrong");
        window.setTimeout(() => card.classList.remove("is-wrong"), 550);
        speak("Good try! Have another look at the numbers.", 1.15);
        return;
      }

      card.classList.add("is-correct");
      card.setAttribute("aria-disabled", "true");
      const status = $(".status-indicator", card);
      status?.classList.remove("hidden");
      status?.classList.add("flex", "animate-bounce");
      celebrateAnswer();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });

  renderQuestion();

  nextActivityButton?.addEventListener("click", () => {
    if (waitingForManualAdvance) {
      waitingForManualAdvance = false;
      nextActivityButton.classList.add("hidden");
      advanceToNextQuestion(readSavedBuddy() || defaultBuddy);
    }
  });
  $("#nextPracticeBtn")?.addEventListener("click", (event) => {
    const link = event.currentTarget;
    link.classList.add("scale-95");
    window.setTimeout(() => link.classList.remove("scale-95"), 160);
  });
  $("#go-cta-btn")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.classList.add("scale-95");
    window.setTimeout(() => {
      button.classList.remove("scale-95");
      window.location.href = "Page2.html";
    }, 160);
  });
  $$('[onclick="history.back()"], [data-action="go-back"]').forEach((button) => {
    button.removeAttribute("onclick");
    button.addEventListener("click", () => {
      const currentPage = decodeURIComponent(window.location.pathname.split("/").pop() || "");
      const backDestinations = {
        "Page 3.html": "Page2.html",
        "Page 4.html": "Page 3.html"
      };
      window.location.href = backDestinations[currentPage] || "Page2.html";
    });
  });
  $("#nextPracticeBtn")?.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = "Page 4.html";
  });
});
