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

  // Append to body, or wait for body to load
  if (document.body) {
    document.body.appendChild(container);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(container);
    });
  }
}

// Show dhikr toast notification
function showDhikrToast(dhikr, settings) {
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
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
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

  header.appendChild(title);
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
  arabicText.textContent = dhikr.arabic;
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
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";

      // Check visibility after animation
      // setTimeout(() => {
      //   const rect = toast.getBoundingClientRect();
      //   const computed = window.getComputedStyle(toast);
      // }, 100);
    });
  });

  // Auto close if enabled
  if (settings.autoClose) {
    const delay = (settings.autoCloseDelay || 10) * 1000;
    setTimeout(() => {
      closeToast(toast);
    }, delay);
  }
}

// Close toast with animation
function closeToast(toast) {
  // Prevent multiple closes
  if (toast.dataset.closing === "true") {
    return;
  }

  toast.dataset.closing = "true";
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
} else {
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeToastSystem);
} else {
  initializeToastSystem();
}
