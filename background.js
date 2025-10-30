// Background Service Worker for Islamic Adhkar Reminder
import { getRandomDhikr, getCurrentReminderType } from "./adhkar-data.js";

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

// Show dhikr notification - sends to all tabs
function showDhikrNotification(settings) {
  const dhikr = getRandomDhikr();
  const reminderType = getCurrentReminderType();

  // Send to all tabs
  chrome.tabs.query({}, (tabs) => {
    let successCount = 0;
    let errorCount = 0;

    tabs.forEach((tab) => {
      // Skip chrome:// and other special pages
      if (
        tab.url &&
        (tab.url.startsWith("chrome://") ||
          tab.url.startsWith("chrome-extension://") ||
          tab.url.startsWith("edge://") ||
          tab.url.startsWith("about:"))
      ) {
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "showDhikr",
          dhikr: dhikr,
          settings: settings,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            errorCount++;
            console.log(
              `[ERROR] Failed to send to tab ${tab.id}:`,
              chrome.runtime.lastError.message
            );
          }
          // else {
          //   successCount++;
          //   console.log(`[SUCCESS] Sent to tab ${tab.id} (${tab.title})`);
          // }
        }
      );
    });

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
  if (request.action === "testNotification") {
    chrome.storage.sync.get(["autoClose", "autoCloseDelay"], (settings) => {
      showDhikrNotification(settings);
      sendResponse({ success: true });
    });
    return true; // Required for async sendResponse
  }
});
