// Content Script - Injects toast notifications into all web pages

// Create toast container and styles
function initializeToastSystem() {
  // Only initialize once
  if (document.getElementById("adhkar-toast-container")) {
    return;
  }

  // Create container
  const container = document.createElement("div");
  container.id = "adhkar-toast-container";

  // Set container styles
  Object.assign(container.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: "2147483647",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "320px",
    pointerEvents: "none",
  });

  // Add styles for Ayah marks
  const style = document.createElement("style");
  style.textContent = `
    .ayah-mark {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
      width: 1.8em !important;
      height: 1.8em !important;
      vertical-align: middle !important;
      margin: 0 4px !important;
      direction: ltr !important;
    }
    .ayah-symbol {
      position: absolute !important;
      font-size: 1.8em !important;
      color: #2e7d32 !important;
      user-select: none !important;
    }
    .ayah-number {
      position: relative !important;
      font-size: 0.7em !important;
      font-weight: 700 !important;
      color: #333 !important;
      z-index: 1 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      margin-top: 1px !important;
    }
  `;
  container.appendChild(style);

  // Append to body, or wait for body to load
  if (document.body) {
    document.body.appendChild(container);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(container);
    });
  }
}

// Clear all existing toasts
function clearAllToasts() {
  const container = document.getElementById("adhkar-toast-container");
  if (container) {
    // Remove all toast elements
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
}

// Show dhikr toast notification
function showDhikrToast(dhikr, settings) {
  // Check if notification is stale (older than 30 seconds)
  const MAX_AGE_MS = 30000; // 30 seconds
  if (settings.timestamp) {
    const age = Date.now() - settings.timestamp;
    if (age > MAX_AGE_MS) {
      console.log(
        "[CONTENT] Rejecting stale notification (age: " +
          Math.round(age / 1000) +
          "s)"
      );
      return; // Don't show stale notifications
    }
  }

  const container = document.getElementById("adhkar-toast-container");
  if (!container) {
    console.error("[CONTENT] Container not found!");
    initializeToastSystem();
    // Retry after initialization
    setTimeout(() => showDhikrToast(dhikr, settings), 100);
    return;
  }

  // Determine emoji based on time
  const hour = new Date().getHours();
  let emoji = "🕌";
  if (hour >= 4 && hour < 12) {
    emoji = "🌅"; // Morning
  } else if (hour >= 18 || hour < 4) {
    emoji = "🌙"; // Night
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.className = "adhkar-toast";

  // Set styles directly via properties for better reliability
  Object.assign(toast.style, {
    position: "relative",
    background: "white",
    borderRadius: "8px",
    padding: "12px 14px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
    transform: "translateX(450px)",
    opacity: "0",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    borderLeft: "3px solid #2e7d32",
    maxWidth: "320px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Naskh Arabic", "Amiri", "Traditional Arabic", Arial, sans-serif',
    pointerEvents: "auto",
    minWidth: "280px",
    marginBottom: "10px",
  });

  // Header
  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  });

  // Left group: title + share button
  const leftGroup = document.createElement("div");
  Object.assign(leftGroup.style, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  });

  const title = document.createElement("div");
  Object.assign(title.style, {
    fontSize: "13px",
    fontWeight: "600",
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  });
  title.innerHTML = `<span style="font-size: 16px;">${emoji}</span><span>اذكر الله</span>`;

  // Share button
  const shareBtn = document.createElement("button");
  shareBtn.innerHTML = "🔗";
  Object.assign(shareBtn.style, {
    background: "none",
    border: "none",
    fontSize: "14px",
    color: "#999",
    cursor: "pointer",
    padding: "2px",
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "all 0.2s",
    marginLeft: "4px",
  });
  shareBtn.onmouseover = () => {
    shareBtn.style.background = "#f0f0f0";
    shareBtn.style.color = "#2e7d32";
  };
  shareBtn.onmouseout = () => {
    shareBtn.style.background = "none";
    shareBtn.style.color = "#999";
  };
  shareBtn.onclick = () => {
    chrome.runtime.sendMessage({ action: "openShareModal" });
  };

  leftGroup.appendChild(title);
  leftGroup.appendChild(shareBtn);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "✕";
  Object.assign(closeBtn.style, {
    background: "none",
    border: "none",
    fontSize: "16px",
    color: "#999",
    cursor: "pointer",
    padding: "2px",
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "all 0.2s",
  });
  closeBtn.onmouseover = () => {
    closeBtn.style.background = "#f0f0f0";
    closeBtn.style.color = "#333";
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.background = "none";
    closeBtn.style.color = "#999";
  };
  closeBtn.onclick = () => closeToast(toast);

  header.appendChild(leftGroup);
  header.appendChild(closeBtn);
  toast.appendChild(header);

  // Content
  const content = document.createElement("div");
  Object.assign(content.style, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });

  // Title (if exists)
  if (dhikr.title) {
    const titleText = document.createElement("div");
    titleText.textContent = dhikr.title;
    Object.assign(titleText.style, {
      fontSize: "11px",
      fontWeight: "600",
      color: "#666",
      direction: "rtl",
      textAlign: "right",
      marginBottom: "4px",
    });
    content.appendChild(titleText);
  }

  // Arabic text
  const arabicText = document.createElement("div");
  const rawArabic = dhikr.arabic;

  // Function to format Ayah marks
  const formatArabicText = (text) => {
    return text.replace(/۝([٠-٩0-9]+)/g, (match, p1) => {
      return `<span class="ayah-mark"><span class="ayah-symbol">۝</span><span class="ayah-number">${p1}</span></span>`;
    });
  };

  arabicText.innerHTML = formatArabicText(rawArabic);
  Object.assign(arabicText.style, {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2e7d32",
    direction: "rtl",
    textAlign: "right",
    lineHeight: "1.7",
    padding: "6px 0",
  });
  content.appendChild(arabicText);

  // Repetition (if exists)
  if (dhikr.repetition) {
    const repetitionText = document.createElement("div");
    repetitionText.textContent = `🔁 ${dhikr.repetition}`;
    Object.assign(repetitionText.style, {
      fontSize: "11px",
      fontWeight: "500",
      color: "#666",
      direction: "rtl",
      textAlign: "right",
    });
    content.appendChild(repetitionText);
  }

  // Why/Benefit (if exists)
  if (dhikr.why) {
    const whyText = document.createElement("div");
    whyText.textContent = dhikr.why;
    Object.assign(whyText.style, {
      fontSize: "10px",
      color: "#555",
      lineHeight: "1.5",
      paddingTop: "6px",
      borderTop: "1px solid #e0e0e0",
      direction: "rtl",
      textAlign: "right",
    });
    content.appendChild(whyText);
  }

  toast.appendChild(content);

  // Progress bar for auto-close countdown
  if (settings.autoClose) {
    const totalDelay = (settings.autoCloseDelay || 10) * 1000;

    // Progress bar container
    const progressContainer = document.createElement("div");
    Object.assign(progressContainer.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      right: "0",
      height: "3px",
      background: "rgba(0, 0, 0, 0.08)",
      borderRadius: "0 0 8px 8px",
      overflow: "hidden",
    });

    // Progress bar fill
    const progressBar = document.createElement("div");
    Object.assign(progressBar.style, {
      width: "100%",
      height: "100%",
      background: "linear-gradient(90deg, #2e7d32, #66bb6a)",
      borderRadius: "0 0 8px 8px",
      transition: "none",
      transformOrigin: "right",
    });

    progressContainer.appendChild(progressBar);
    toast.appendChild(progressContainer);

    // Timer state
    let remainingTime = totalDelay;
    let startTime = null;
    let timerId = null;
    let animFrameId = null;
    let isPaused = false;

    // Start the countdown
    function startCountdown() {
      isPaused = false;
      startTime = Date.now();

      // Animate the progress bar smoothly
      function updateProgress() {
        if (isPaused) return;
        const elapsed = Date.now() - startTime;
        const remaining = remainingTime - elapsed;
        const fraction = Math.max(0, remaining / totalDelay);
        progressBar.style.transform = `scaleX(${fraction})`;

        if (remaining > 0) {
          animFrameId = requestAnimationFrame(updateProgress);
        }
      }
      animFrameId = requestAnimationFrame(updateProgress);

      // Set timer to close
      timerId = setTimeout(() => {
        closeToast(toast);
      }, remainingTime);
    }

    // Pause the countdown
    function pauseCountdown() {
      isPaused = true;
      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, remainingTime - elapsed);

      // Cancel timer and animation
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }

    // Hover: pause countdown
    toast.addEventListener("mouseenter", () => {
      if (!isPaused && toast.dataset.closing !== "true") {
        pauseCountdown();
      }
    });

    // Mouse leave: resume countdown
    toast.addEventListener("mouseleave", () => {
      if (isPaused && toast.dataset.closing !== "true") {
        startCountdown();
      }
    });

    // Store cleanup reference
    toast._adhkarCleanup = () => {
      if (timerId) clearTimeout(timerId);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };

    // Start the initial countdown after animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.transform = "translateX(0)";
        toast.style.opacity = "1";

        // Start countdown after slide-in animation finishes
        setTimeout(() => {
          startCountdown();
        }, 400);
      });
    });
  } else {
    // No auto-close, just animate in
    container.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.transform = "translateX(0)";
        toast.style.opacity = "1";
      });
    });
    return;
  }

  container.appendChild(toast);
}

// Close toast with animation
function closeToast(toast) {
  // Prevent multiple closes
  if (toast.dataset.closing === "true") {
    return;
  }

  toast.dataset.closing = "true";

  // Clean up timers and animations
  if (toast._adhkarCleanup) {
    toast._adhkarCleanup();
  }

  toast.style.transform = "translateX(450px)";
  toast.style.opacity = "0";

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 400);
}

// Prevent multiple listeners
if (!window.adhkarListenerAdded) {
  window.adhkarListenerAdded = true;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showDhikr") {
      initializeToastSystem();
      showDhikrToast(request.dhikr, request.settings);
      sendResponse({ success: true });
    }

    return true;
  });

  // Add Page Visibility API listener to clear stale notifications
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      // Tab became visible - clear all existing notifications
      // This prevents stale notifications from showing when switching back to old tabs
      clearAllToasts();
    }
  });
} else {
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeToastSystem);
} else {
  initializeToastSystem();
}
