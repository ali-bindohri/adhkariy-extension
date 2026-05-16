// Background Service Worker for Islamic Adhkar Reminder
import { getRandomDhikr, getCurrentReminderType } from "./adhkar-data.js";
import { morningAdhkar } from "./morning-adhkar.js";
import { eveningAdhkar } from "./evening-adhkar.js";

const ALARM_NAME = "adhkarReminder";

// TESTING MODE: Set to true for faster intervals (FOR DEVELOPMENT ONLY)
const TEST_MODE = false; // ❌ DISABLED - Using REAL time intervals now
const TEST_SPEED_MULTIPLIER = 6; // Makes intervals 6x faster: 1min→10sec, 5min→50sec, 10min→100sec
let testIntervalId = null;

// Initialize extension when installed
chrome.runtime.onInstalled.addListener((details) => {
  // Set default settings
  chrome.storage.sync.get(
    {
      enabled: true, // ✅ AUTO-ENABLED FOR TESTING
      interval: 10, // minutes (default: 10 minutes)
      morningEnabled: true,
      nightEnabled: true,
      generalEnabled: true,
      autoClose: true,
      autoCloseDelay: 10, // seconds
      isPaused: false,
      blockedSites: [], // Array of blocked website patterns
    },
    (settings) => {
      chrome.storage.sync.set(settings, () => {
        // Start the timer immediately if enabled
        if (settings.enabled && !settings.isPaused) {
          setupAlarm(settings.interval);
        }
      });
    }
  );
});

// Listen for changes in storage to update alarms
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    if (changes.enabled || changes.interval || changes.isPaused) {
      // Log what specifically changed
      // if (changes.interval) {
      //   console.log(
      //     `[STORAGE] Interval changed: ${changes.interval.oldValue} → ${changes.interval.newValue} minutes`
      //   );
      // }
      // if (changes.enabled) {
      //   console.log(
      //     `[STORAGE] Enabled changed: ${changes.enabled.oldValue} → ${changes.enabled.newValue}`
      //   );
      // }
      // if (changes.isPaused) {
      //   console.log(
      //     `[STORAGE] Paused changed: ${changes.isPaused.oldValue} → ${changes.isPaused.newValue}`
      //   );
      // }

      chrome.storage.sync.get(
        ["enabled", "interval", "isPaused"],
        (settings) => {
          if (settings.enabled && !settings.isPaused) {
            setupAlarm(settings.interval);
          } else {
            // Clear test interval
            if (testIntervalId) {
              clearInterval(testIntervalId);
              testIntervalId = null;
            }
            // Clear alarm
            chrome.alarms.clear(ALARM_NAME);
          }
        }
      );
    }
  }
});

// Setup alarm with specified interval
function setupAlarm(intervalMinutes) {
  // Clear any existing test interval
  if (testIntervalId) {
    clearInterval(testIntervalId);
    testIntervalId = null;
  }

  if (TEST_MODE) {
    // Use setInterval for testing - respects user's interval choice but faster
    // Divide by TEST_SPEED_MULTIPLIER to make intervals faster for testing
    const testSeconds = (intervalMinutes * 60) / TEST_SPEED_MULTIPLIER;

    testIntervalId = setInterval(() => {
      chrome.storage.sync.get(
        [
          "enabled",
          "morningEnabled",
          "nightEnabled",
          "generalEnabled",
          "isPaused",
          "autoClose",
          "autoCloseDelay",
        ],
        (settings) => {
          if (!settings.enabled || settings.isPaused) {
            return;
          }

          const reminderType = getCurrentReminderType();

          // Check if the current reminder type is enabled
          if (
            (reminderType === "morning" && !settings.morningEnabled) ||
            (reminderType === "night" && !settings.nightEnabled) ||
            (reminderType === "general" && !settings.generalEnabled)
          ) {
            return;
          }

          showDhikrNotification(settings);
        }
      );
    }, testSeconds * 1000); // Use actual interval in milliseconds
  } else {
    // Production mode: Use Chrome alarms

    chrome.alarms.clear(ALARM_NAME, () => {
      chrome.alarms.create(
        ALARM_NAME,
        {
          delayInMinutes: intervalMinutes,
          periodInMinutes: intervalMinutes,
        },
        () => {
          // Verify alarm was created
          // chrome.alarms.get(ALARM_NAME, (alarm) => {
          //   if (alarm) {
          //     const nextTime = new Date(alarm.scheduledTime);
          //     const minutesUntil = Math.round(
          //       (alarm.scheduledTime - Date.now()) / 60000
          //     );
          //     console.log(`[SUCCESS] ✅ Alarm created successfully!`);
          //     console.log(`[INFO] ⏰ Interval: ${intervalMinutes} minute(s)`);
          //     console.log(
          //       `[INFO] 📅 Next notification at: ${nextTime.toLocaleTimeString()}`
          //     );
          //     console.log(
          //       `[INFO] ⏱️  That's in ${minutesUntil} minute(s) from now`
          //     );
          //     console.log(
          //       `[INFO] 🔄 Will repeat every ${intervalMinutes} minute(s)`
          //     );
          //   } else {
          //     console.error("[ERROR] ❌ Failed to create alarm!");
          //   }
          // });
        }
      );
    });
  }
}

// Handle alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    chrome.storage.sync.get(
      [
        "enabled",
        "morningEnabled",
        "nightEnabled",
        "generalEnabled",
        "isPaused",
        "autoClose",
        "autoCloseDelay",
      ],
      (settings) => {
        if (!settings.enabled || settings.isPaused) {
          return;
        }

        const reminderType = getCurrentReminderType();

        // Check if the current reminder type is enabled
        if (
          (reminderType === "morning" && !settings.morningEnabled) ||
          (reminderType === "night" && !settings.nightEnabled) ||
          (reminderType === "general" && !settings.generalEnabled)
        ) {
          return;
        }

        showDhikrNotification(settings);
      }
    );
  }
});

// Check if we have host permissions
async function hasHostPermissions() {
  try {
    const result = await chrome.permissions.contains({
      origins: ["<all_urls>"],
    });
    return result;
  } catch (error) {
    return false;
  }
}

// Inject content script and send notification
async function injectAndShowNotification(tabId, dhikr, settings) {
  // Check if we have permission first
  const hasPermission = await hasHostPermissions();
  if (!hasPermission) {
    return; // Skip if no permission granted
  }

  try {
    // Try to inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content-script.js"],
    });

    // Wait a bit for the script to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Send message
    chrome.tabs.sendMessage(tabId, {
      action: "showDhikr",
      dhikr: dhikr,
      settings: settings,
    });
  } catch (error) {
    // Silently ignore injection errors (already injected or restricted page)
  }
}

// Check if URL is blocked
function isUrlBlocked(url, blockedSites) {
  if (!blockedSites || blockedSites.length === 0) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "").toLowerCase();

    return blockedSites.some((blockedSite) => {
      const blocked = blockedSite.toLowerCase();
      return hostname === blocked || hostname.endsWith("." + blocked);
    });
  } catch (error) {
    return false;
  }
}

// Show dhikr notification - sends to active tab only
function showDhikrNotification(settings) {
  const dhikr = getRandomDhikr();
  const reminderType = getCurrentReminderType();
  const timestamp = Date.now(); // Add timestamp for stale detection

  // Get blocked sites from storage
  chrome.storage.sync.get(["blockedSites"], (data) => {
    const blockedSites = data.blockedSites || [];

    // Send to active tab only (in current window)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        return; // No active tab found
      }

      const tab = tabs[0]; // Get the active tab

      // Skip chrome:// and other special pages
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:") ||
        tab.url.startsWith("view-source:")
      ) {
        return;
      }

      // Check if URL is blocked
      if (isUrlBlocked(tab.url, blockedSites)) {
        return;
      }

      // Inject script and show notification with timestamp
      injectAndShowNotification(tab.id, dhikr, { ...settings, timestamp });

      // Also show Chrome notification as fallback
      const emoji =
        reminderType === "morning"
          ? "🌅"
          : reminderType === "night"
          ? "🌙"
          : "🕌";
      const message = `${dhikr.arabic}\n\n${dhikr.repetition}\n\n${dhikr.why}`;

      chrome.notifications.create(
        {
          type: "basic",
          title: `${emoji} اذكر الله - Remember Allah`,
          message: message,
          priority: 2,
          requireInteraction: !settings.autoClose,
          silent: false,
        },
        (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error(
              "[ERROR] Fallback notification failed:",
              chrome.runtime.lastError
            );
            return;
          }

          if (settings.autoClose) {
            setTimeout(() => {
              chrome.notifications.clear(notificationId);
            }, settings.autoCloseDelay * 1000);
          }
        }
      );

      // setTimeout(() => {
      //   console.log(
      //     `[STATS] Sent successfully to ${successCount} tabs, ${errorCount} errors`
      //   );
      // }, 1000);
    });
  });
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});

// Handle notification button clicks (close button)
chrome.notifications.onButtonClicked.addListener(
  (notificationId, buttonIndex) => {
    chrome.notifications.clear(notificationId);
  }
);

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(
    ["enabled", "interval", "isPaused", "autoClose", "autoCloseDelay"],
    (settings) => {
      if (settings.enabled && !settings.isPaused) {
        setupAlarm(settings.interval);

        // Show immediate test notification on startup (for testing)
        // DISABLED: Let the alarm run naturally
        // if (TEST_MODE) {
        //   console.log("[STARTUP] Showing immediate test notification");
        //   setTimeout(() => {
        //     showDhikrNotification(settings);
        //   }, 2000); // Wait 2 seconds for content scripts to load
        // }
      }
      //  else {
      //   console.log("[STARTUP] Extension is disabled or paused");
      // }
    }
  );
});

// Also check and start alarm when service worker wakes up
chrome.storage.sync.get(
  ["enabled", "interval", "isPaused", "autoClose", "autoCloseDelay"],
  (settings) => {
    if (settings.enabled && !settings.isPaused) {
      setupAlarm(settings.interval);

      // Show immediate test notification (for testing)
      // DISABLED: Let the alarm run naturally
      // if (TEST_MODE) {
      //   console.log("[INIT] Showing immediate test notification");
      //   setTimeout(() => {
      //     showDhikrNotification(settings);
      //   }, 2000); // Wait 2 seconds for content scripts to load
      // }
    }
  }
);

// Handle messages from popup (like test notification)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {


  if (request.action === "openAdhkarModal") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      const tab = tabs[0];
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:") ||
        tab.url.startsWith("view-source:")
      ) {
        return;
      }
      injectAdhkarModal(tab.id);
    });
    sendResponse({ success: true });
  }

  if (request.action === "openShareModal") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      const tab = tabs[0];
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:") ||
        tab.url.startsWith("view-source:")
      ) {
        return;
      }
      injectShareModal(tab.id);
    });
    sendResponse({ success: true });
  }
});

// Inject the adhkar modal into the active tab
async function injectAdhkarModal(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: buildAdhkarModal,
      args: [morningAdhkar, eveningAdhkar],
    });
  } catch (error) {
    // Silently ignore injection errors
  }
}

// Inject the share modal into the active tab
async function injectShareModal(tabId) {
  const CWS_URL = "https://chromewebstore.google.com/detail/fkheemadahbhajnkjpdebiclhlomobba?utm_source=item-share-cb";
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: buildShareModal,
      args: [CWS_URL],
    });
  } catch (error) {
    // Silently ignore injection errors
  }
}

// This function runs inside the page context
function buildShareModal(cwsUrl) {
  // Remove existing modal if present
  const existing = document.getElementById("adhkar-share-overlay");
  if (existing) {
    existing.remove();
  }

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "adhkar-share-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    direction: rtl;
  `;

  // Container
  const container = document.createElement("div");
  container.style.cssText = `
    background: #1e293b;
    border-radius: 16px;
    width: 90%;
    max-width: 480px;
    padding: 24px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    animation: shareFadeIn 0.3s ease-out;
  `;

  // Animation style
  const animStyle = document.createElement("style");
  animStyle.textContent = `
    @keyframes shareFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  overlay.appendChild(animStyle);

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  `;

  const title = document.createElement("h2");
  title.textContent = "🔗 مشاركة الإضافة";
  title.style.cssText = "color: #fff; margin: 0; font-size: 18px; font-weight: 600;";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `
    background: rgba(255,255,255,0.1);
    border: none;
    color: #94a3b8;
    font-size: 18px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
    font-family: inherit;
  `;
  closeBtn.onmouseenter = () => {
    closeBtn.style.color = "#fff";
    closeBtn.style.background = "rgba(255,255,255,0.2)";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.color = "#94a3b8";
    closeBtn.style.background = "rgba(255,255,255,0.1)";
  };
  closeBtn.onclick = () => overlay.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  container.appendChild(header);

  // Social buttons row
  const socialRow = document.createElement("div");
  socialRow.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  `;

  const svgIcons = {
    facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    reddit: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`,
    x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`
  };

  const platforms = [
    { name: "linkedin", color: "#0A66C2", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cwsUrl)}` },
    { name: "facebook", color: "#1877F2", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cwsUrl)}` },
    { name: "reddit", color: "#FF4500", url: `https://www.reddit.com/submit?url=${encodeURIComponent(cwsUrl)}&title=Adhkariy%20Extension` },
    { name: "x", color: "#000000", url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(cwsUrl)}&text=${encodeURIComponent("Check out Adhkariy - Islamic Adhkar Reminder Extension!")}` },
    { name: "whatsapp", color: "#25D366", url: `https://wa.me/?text=${encodeURIComponent("Check out Adhkariy Extension: " + cwsUrl)}` },
  ];

  platforms.forEach((platform) => {
    const btn = document.createElement("button");
    btn.innerHTML = svgIcons[platform.name];
    btn.title = platform.name;
    btn.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 12px;
      border: none;
      background: ${platform.color};
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    btn.onmouseenter = () => {
      btn.style.transform = "translateY(-3px) scale(1.1)";
      btn.style.boxShadow = `0 6px 20px ${platform.color}66`;
    };
    btn.onmouseleave = () => {
      btn.style.transform = "translateY(0) scale(1)";
      btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    };
    btn.onclick = () => {
      window.open(platform.url, "_blank", "noopener,noreferrer");
    };
    socialRow.appendChild(btn);
  });

  container.appendChild(socialRow);

  // URL copy section
  const urlSection = document.createElement("div");
  urlSection.style.cssText = `
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(255,255,255,0.1);
  `;

  const urlText = document.createElement("input");
  urlText.type = "text";
  urlText.value = cwsUrl;
  urlText.readOnly = true;
  urlText.style.cssText = `
    flex: 1;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 13px;
    font-family: inherit;
    direction: ltr;
    text-align: left;
    outline: none;
  `;

  const copyBtn = document.createElement("button");
  copyBtn.innerHTML = `<span style="font-size: 14px;">📋</span> نسخ`;
  copyBtn.style.cssText = `
    background: rgba(46, 125, 50, 0.2);
    color: #4ade80;
    border: 1px solid rgba(46, 125, 50, 0.3);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 4px;
  `;
  copyBtn.onmouseenter = () => {
    copyBtn.style.background = "rgba(46, 125, 50, 0.3)";
  };
  copyBtn.onmouseleave = () => {
    copyBtn.style.background = "rgba(46, 125, 50, 0.2)";
  };
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(cwsUrl).then(() => {
      copyBtn.innerHTML = `<span style="font-size: 14px;">✅</span> تم`;
      copyBtn.style.background = "rgba(46, 125, 50, 0.4)";
      setTimeout(() => {
        copyBtn.innerHTML = `<span style="font-size: 14px;">📋</span> نسخ`;
        copyBtn.style.background = "rgba(46, 125, 50, 0.2)";
      }, 2000);
    });
  };

  urlSection.appendChild(urlText);
  urlSection.appendChild(copyBtn);
  container.appendChild(urlSection);

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };

  // Close on Esc
  const escHandler = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);

  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

// This function runs inside the page context
function buildAdhkarModal(morningData, eveningData) {
  // Remove existing modal if present
  const existing = document.getElementById("adhkar-modal-overlay");
  if (existing) {
    existing.remove();
  }

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "adhkar-modal-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Naskh Arabic", "Traditional Arabic", "Scheherazade New", serif;
    direction: rtl;
  `;

  // Container
  const container = document.createElement("div");
  container.style.cssText = `
    background: #ffffff;
    border-radius: 16px;
    width: 90%;
    max-width: 640px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 16px 20px;
    background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  `;

  const title = document.createElement("h2");
  title.textContent = "📖 الأذكار";
  title.style.cssText = "color: #fff; margin: 0; font-size: 18px; font-weight: 600;";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `
    background: rgba(255,255,255,0.2);
    border: none;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
    font-family: inherit;
  `;
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "rgba(255,255,255,0.35)";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "rgba(255,255,255,0.2)";
  };
  closeBtn.onclick = () => overlay.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Tabs
  const tabsContainer = document.createElement("div");
  tabsContainer.style.cssText = `
    display: flex;
    padding: 0 20px;
    gap: 8px;
    border-bottom: 1px solid #e0e0e0;
    background: #f5f5f5;
    flex-shrink: 0;
  `;

  let activeTab = "morning";

  const morningTab = document.createElement("button");
  morningTab.textContent = "🌅 أذكار الصباح";
  const eveningTab = document.createElement("button");
  eveningTab.textContent = "🌙 أذكار المساء";

  const tabStyle = (active) => `
    padding: 10px 16px;
    background: ${active ? "#2e7d32" : "transparent"};
    color: ${active ? "#fff" : "#666"};
    border: none;
    border-bottom: 2px solid ${active ? "#2e7d32" : "transparent"};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    flex: 1;
    text-align: center;
    border-radius: 8px 8px 0 0;
    margin-top: 6px;
  `;

  morningTab.style.cssText = tabStyle(true);
  eveningTab.style.cssText = tabStyle(false);

  tabsContainer.appendChild(morningTab);
  tabsContainer.appendChild(eveningTab);

  // Content area
  const content = document.createElement("div");
  content.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #fafafa;
  `;

  // Scrollbar styling
  const scrollStyle = document.createElement("style");
  scrollStyle.textContent = `
    #adhkar-modal-overlay ::-webkit-scrollbar { width: 6px; }
    #adhkar-modal-overlay ::-webkit-scrollbar-track { background: transparent; }
    #adhkar-modal-overlay ::-webkit-scrollbar-thumb { background: #2e7d32; border-radius: 3px; }
    
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
  overlay.appendChild(scrollStyle);

  function renderList(data) {
    content.innerHTML = "";
    data.forEach((item) => {
      const card = document.createElement("div");
      card.style.cssText = `
        background: #fff;
        border-radius: 12px;
        padding: 14px 16px;
        border: 1px solid #e0e0e0;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      `;
      card.onmouseenter = () => {
        card.style.borderColor = "#2e7d32";
        card.style.boxShadow = "0 2px 8px rgba(46,125,50,0.15)";
      };
      card.onmouseleave = () => {
        card.style.borderColor = "#e0e0e0";
        card.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
      };

      // Card header: title + badges
      const cardHeader = document.createElement("div");
      cardHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        gap: 8px;
      `;

      const cardTitle = document.createElement("h3");
      cardTitle.textContent = item.title;
      cardTitle.style.cssText = `
        color: #1b5e20;
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        flex: 1;
      `;

      const badgeRow = document.createElement("div");
      badgeRow.style.cssText = "display: flex; align-items: center; gap: 6px; flex-shrink: 0;";

      const repBadge = document.createElement("span");
      repBadge.textContent = item.repetition && item.repetition.trim() ? item.repetition : " ";
      repBadge.style.cssText = `
        background: #e8f5e9;
        color: #2e7d32;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        border: 1px solid #c8e6c9;
      `;

      badgeRow.appendChild(repBadge);

      if (item.why && item.why.trim()) {
        const infoWrapper = document.createElement("span");
        infoWrapper.style.cssText = "display:inline-block; position:relative; cursor:help;";

        const infoBtn = document.createElement("span");
        infoBtn.textContent = "ℹ️";
        infoBtn.style.cssText = "font-size: 15px; user-select: none;";
        infoWrapper.appendChild(infoBtn);

        infoWrapper.onmouseenter = () => {
          const rect = infoWrapper.getBoundingClientRect();
          showTooltip(item.why, rect);
        };
        infoWrapper.onmouseleave = () => {
          hideTooltip();
        };

        badgeRow.appendChild(infoWrapper);
      }

      cardHeader.appendChild(cardTitle);
      cardHeader.appendChild(badgeRow);

      // Arabic text
      const arabicText = document.createElement("p");
      const rawArabic = item.arabic;

      // Function to format Ayah marks
      const formatArabicText = (text) => {
        return text.replace(/۝([٠-٩0-9]+)/g, (match, p1) => {
          return `<span class="ayah-mark"><span class="ayah-symbol">۝</span><span class="ayah-number">${p1}</span></span>`;
        });
      };

      arabicText.innerHTML = formatArabicText(rawArabic);
      arabicText.style.cssText = `
        color: #333;
        font-size: 17px;
        line-height: 2;
        text-align: center;
        margin: 0;
        font-family: "Noto Naskh Arabic", "Traditional Arabic", "Scheherazade New", "Amiri", serif;
        word-wrap: break-word;
      `;

      card.appendChild(cardHeader);
      card.appendChild(arabicText);
      content.appendChild(card);
    });
  }

  morningTab.onclick = () => {
    if (activeTab === "morning") return;
    activeTab = "morning";
    morningTab.style.cssText = tabStyle(true);
    eveningTab.style.cssText = tabStyle(false);
    renderList(morningData);
  };

  eveningTab.onclick = () => {
    if (activeTab === "evening") return;
    activeTab = "evening";
    morningTab.style.cssText = tabStyle(false);
    eveningTab.style.cssText = tabStyle(true);
    renderList(eveningData);
  };

  renderList(morningData);

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };

  // Close on Esc
  const escHandler = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);

  container.appendChild(header);
  container.appendChild(tabsContainer);
  container.appendChild(content);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Create tooltip container with highest z-index after overlay is in DOM
  const tooltipContainer = document.createElement("div");
  tooltipContainer.id = "adhkar-tooltip-container";
  tooltipContainer.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 0; height: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;
  document.body.appendChild(tooltipContainer);

  // Track active tooltip
  let activeTooltip = null;

  function showTooltip(text, targetRect) {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
    const tooltip = document.createElement("div");
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: fixed;
      background: #1b5e20;
      color: #fff;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      white-space: normal;
      width: 240px;
      line-height: 1.6;
      text-align: right;
      font-weight: 400;
      box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
      transition: opacity 0.2s;
      font-family: inherit;
    `;
    tooltipContainer.appendChild(tooltip);

    // Position above the target
    const tooltipRect = tooltip.getBoundingClientRect();
    let top = targetRect.top - tooltipRect.height - 10;
    let left = targetRect.left + targetRect.width/2 - tooltipRect.width/2;

    // If too close to top edge, show below instead
    if (top < 10) {
      top = targetRect.bottom + 10;
    }

    // Keep within viewport horizontally
    const viewportWidth = window.innerWidth;
    if (left < 10) left = 10;
    if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    tooltip.style.top = top + "px";
    tooltip.style.left = left + "px";
    tooltip.style.opacity = "1";
    activeTooltip = tooltip;
  }

  function hideTooltip() {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  // Cleanup tooltip when modal closes
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      hideTooltip();
      const tc = document.getElementById("adhkar-tooltip-container");
      if (tc) tc.remove();
    }
  });

  const originalEscHandler = (e) => {
    if (e.key === "Escape") {
      hideTooltip();
      const tc = document.getElementById("adhkar-tooltip-container");
      if (tc) tc.remove();
    }
  };

  // Close button cleanup
  closeBtn.addEventListener("click", () => {
    hideTooltip();
    const tc = document.getElementById("adhkar-tooltip-container");
    if (tc) tc.remove();
  });
}
