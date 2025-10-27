// Content Script - Injects toast notifications into all web pages
console.log("[CONTENT] Adhkar content script loaded");

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
    gap: "12px",
    maxWidth: "400px",
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

  console.log("[CONTENT] Toast container initialized");
}

// Show dhikr toast notification
function showDhikrToast(dhikr, settings) {
  console.log("[CONTENT] Showing dhikr toast:", dhikr);

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
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    transform: "translateX(450px)",
    opacity: "0",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    borderLeft: "4px solid #2e7d32",
    maxWidth: "400px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    pointerEvents: "auto",
    minWidth: "320px",
    marginBottom: "12px",
  });

  // Header
  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  });

  const title = document.createElement("div");
  Object.assign(title.style, {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  });
  title.innerHTML = `<span style="font-size: 20px;">${emoji}</span><span>اذكر الله - Remember Allah</span>`;

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "✕";
  Object.assign(closeBtn.style, {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#999",
    cursor: "pointer",
    padding: "4px",
    width: "28px",
    height: "28px",
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
    gap: "12px",
  });

  // Arabic text
  const arabicText = document.createElement("div");
  arabicText.textContent = dhikr.arabic;
  Object.assign(arabicText.style, {
    fontSize: "22px",
    fontWeight: "700",
    color: "#2e7d32",
    direction: "rtl",
    textAlign: "right",
    lineHeight: "1.8",
    padding: "8px 0",
  });
  content.appendChild(arabicText);

  // Transliteration
  const transliterationText = document.createElement("div");
  transliterationText.textContent = dhikr.transliteration;
  Object.assign(transliterationText.style, {
    fontSize: "14px",
    fontStyle: "italic",
    color: "#666",
    lineHeight: "1.6",
  });
  content.appendChild(transliterationText);

  // Translation
  const translationText = document.createElement("div");
  translationText.textContent = dhikr.translation;
  Object.assign(translationText.style, {
    fontSize: "14px",
    color: "#333",
    lineHeight: "1.6",
    paddingTop: "8px",
    borderTop: "1px solid #e0e0e0",
  });
  content.appendChild(translationText);

  toast.appendChild(content);
  container.appendChild(toast);

  console.log("[CONTENT] Toast added to container");
  console.log("[CONTENT] Container in DOM:", document.body.contains(container));
  console.log("[CONTENT] Toast in container:", container.contains(toast));
  console.log(
    "[CONTENT] Toast computed style:",
    window.getComputedStyle(toast).transform
  );

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      console.log("[CONTENT] Animating toast in...");
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";

      // Check visibility after animation
      setTimeout(() => {
        const rect = toast.getBoundingClientRect();
        const computed = window.getComputedStyle(toast);
        console.log("[CONTENT] 🔍 VISIBILITY CHECK:");
        console.log(
          "  - Position:",
          rect.top,
          rect.left,
          rect.right,
          rect.bottom
        );
        console.log("  - Size:", rect.width, "x", rect.height);
        console.log("  - Opacity:", computed.opacity);
        console.log("  - Display:", computed.display);
        console.log("  - Visibility:", computed.visibility);
        console.log("  - Z-index:", computed.zIndex);
        console.log("  - Transform:", computed.transform);
        console.log(
          "  - Is visible on screen:",
          rect.top >= 0 && rect.left >= 0 && rect.top < window.innerHeight
        );
      }, 100);

      console.log(
        "[CONTENT] Animation applied. Transform:",
        toast.style.transform,
        "Opacity:",
        toast.style.opacity
      );
    });
  });

  // Auto close if enabled
  if (settings.autoClose) {
    const delay = (settings.autoCloseDelay || 10) * 1000;
    console.log(`[CONTENT] Auto-closing in ${delay}ms`);
    setTimeout(() => {
      closeToast(toast);
    }, delay);
  }

  console.log("[CONTENT] Toast displayed successfully");
}

// Close toast with animation
function closeToast(toast) {
  // Prevent multiple closes
  if (toast.dataset.closing === "true") {
    console.log("[CONTENT] Toast already closing, skipping...");
    return;
  }

  console.log("[CONTENT] Closing toast");
  console.trace("[CONTENT] Close called from:"); // Show where close was called from

  toast.dataset.closing = "true";
  toast.style.transform = "translateX(450px)";
  toast.style.opacity = "0";

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
      console.log("[CONTENT] Toast removed from DOM");
    }
  }, 400);
}

// Prevent multiple listeners
if (!window.adhkarListenerAdded) {
  window.adhkarListenerAdded = true;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[CONTENT] 📨 Message received:", request);
    console.log(
      "[CONTENT] 📨 Listener count check:",
      window.adhkarListenerAdded
    );

    if (request.action === "showDhikr") {
      console.log("[CONTENT] 🎯 Processing showDhikr action...");
      initializeToastSystem();
      showDhikrToast(request.dhikr, request.settings);
      sendResponse({ success: true });
    }

    return true;
  });

  console.log("[CONTENT] ✅ Message listener registered (once only)");
} else {
  console.log("[CONTENT] ⚠️ Message listener already exists, skipping...");
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeToastSystem);
} else {
  initializeToastSystem();
}

console.log("[CONTENT] Content script ready");
