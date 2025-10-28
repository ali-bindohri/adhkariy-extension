// Popup Logic for Islamic Adhkar Reminder
import { getCurrentReminderType } from "./adhkar-data.js";

// DOM Elements
const enableToggle = document.getElementById("enableToggle");
const morningToggle = document.getElementById("morningToggle");
const nightToggle = document.getElementById("nightToggle");
const generalToggle = document.getElementById("generalToggle");
const autoCloseToggle = document.getElementById("autoCloseToggle");
const autoCloseDelay = document.getElementById("autoCloseDelay");
const pauseToggle = document.getElementById("pauseToggle");
const testNotificationBtn = document.getElementById("testNotification");
const themeToggle = document.getElementById("themeToggle");
const settingsPanel = document.getElementById("settings");
const statusMessage = document.getElementById("statusMessage");
const intervalRadios = document.querySelectorAll('input[name="interval"]');
const autoCloseSettings = document.getElementById("autoCloseSettings");
const customIntervalInput = document.getElementById("customInterval");
const setCustomIntervalBtn = document.getElementById("setCustomInterval");

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupEventListeners();
  initializeTheme();
});

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(
    {
      enabled: false,
      interval: 10,
      morningEnabled: true,
      nightEnabled: true,
      generalEnabled: true,
      autoClose: true,
      autoCloseDelay: 10,
      isPaused: false,
      darkMode: false,
    },
    (settings) => {
      // Set toggle states
      enableToggle.checked = settings.enabled;
      morningToggle.checked = settings.morningEnabled;
      nightToggle.checked = settings.nightEnabled;
      generalToggle.checked = settings.generalEnabled;
      autoCloseToggle.checked = settings.autoClose;
      autoCloseDelay.value = settings.autoCloseDelay;
      pauseToggle.checked = settings.isPaused;

      // Set interval radio or custom input
      let isPresetSelected = false;
      intervalRadios.forEach((radio) => {
        if (parseInt(radio.value) === settings.interval) {
          radio.checked = true;
          isPresetSelected = true;
        }
      });

      // If not a preset, show it in custom input
      if (!isPresetSelected) {
        customIntervalInput.value = settings.interval;
      }

      // Show/hide settings panel
      settingsPanel.style.display = settings.enabled ? "block" : "none";

      // Show/hide auto-close settings
      autoCloseSettings.style.display = settings.autoClose ? "block" : "none";

      // Apply theme
      if (settings.darkMode) {
        document.body.classList.add("dark-mode");
        themeToggle.querySelector(".theme-icon").textContent = "☀️";
      }
    }
  );
}

// Setup event listeners
function setupEventListeners() {
  // Enable/Disable toggle
  enableToggle.addEventListener("change", (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ enabled }, () => {
      settingsPanel.style.display = enabled ? "block" : "none";
      showStatus(enabled ? "✅ Reminders enabled" : "⏸️ Reminders disabled");
    });
  });

  // Reminder type toggles
  morningToggle.addEventListener("change", (e) => {
    chrome.storage.sync.set({ morningEnabled: e.target.checked }, () => {
      showStatus("Settings saved");
    });
  });

  nightToggle.addEventListener("change", (e) => {
    chrome.storage.sync.set({ nightEnabled: e.target.checked }, () => {
      showStatus("Settings saved");
    });
  });

  generalToggle.addEventListener("change", (e) => {
    chrome.storage.sync.set({ generalEnabled: e.target.checked }, () => {
      showStatus("Settings saved");
    });
  });

  // Interval selection (presets)
  intervalRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const interval = parseInt(e.target.value);
      chrome.storage.sync.set({ interval }, () => {
        showStatus(`⏰ Interval set to ${interval} minutes`);
        customIntervalInput.value = ""; // Clear custom input
      });
    });
  });

  // Custom interval input
  setCustomIntervalBtn.addEventListener("click", () => {
    const customInterval = parseInt(customIntervalInput.value);

    // Validation
    if (!customInterval || customInterval < 1 || customInterval > 1440) {
      showStatus("❌ Please enter 1-1440 minutes");
      return;
    }

    // Uncheck all radio buttons
    intervalRadios.forEach((radio) => {
      radio.checked = false;
    });

    // Save custom interval
    chrome.storage.sync.set({ interval: customInterval }, () => {
      showStatus(`⏰ Custom interval set to ${customInterval} minutes`);
    });
  });

  // Allow Enter key to set custom interval
  customIntervalInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      setCustomIntervalBtn.click();
    }
  });

  // Auto-close toggle
  autoCloseToggle.addEventListener("change", (e) => {
    const autoClose = e.target.checked;
    chrome.storage.sync.set({ autoClose }, () => {
      autoCloseSettings.style.display = autoClose ? "block" : "none";
      showStatus("Settings saved");
    });
  });

  // Auto-close delay
  autoCloseDelay.addEventListener("change", (e) => {
    const delay = parseInt(e.target.value);
    chrome.storage.sync.set({ autoCloseDelay: delay }, () => {
      showStatus("Settings saved");
    });
  });

  // Pause toggle
  pauseToggle.addEventListener("change", (e) => {
    const isPaused = e.target.checked;
    chrome.storage.sync.set({ isPaused }, () => {
      showStatus(isPaused ? "⏸️ Reminders paused" : "▶️ Reminders resumed");
    });
  });

  // Test notification button
  testNotificationBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "testNotification" }, (response) => {
      if (response && response.success) {
        showStatus("🔔 Test notification sent!");
      }
    });
  });

  // Theme toggle
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    chrome.storage.sync.set({ darkMode: isDark });
    themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
  });
}

// Initialize theme based on system preference or saved setting
function initializeTheme() {
  chrome.storage.sync.get(["darkMode"], (settings) => {
    if (settings.darkMode === undefined) {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        document.body.classList.add("dark-mode");
        themeToggle.querySelector(".theme-icon").textContent = "☀️";
        chrome.storage.sync.set({ darkMode: true });
      }
    }
  });
}

// Show status message
function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.style.display = "block";

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.style.display = "none";
  }, 3000);
}

// Display current reminder type info
function displayCurrentReminderInfo() {
  const reminderType = getCurrentReminderType();
  let message = "";

  switch (reminderType) {
    case "morning":
      message = "🌅 Currently: Morning Adhkar (5:00 AM - 9:00 AM)";
      break;
    case "night":
      message = "🌙 Currently: Night Adhkar (5:00 PM - 10:00 PM)";
      break;
    case "general":
      message = "🕌 Currently: General Adhkar";
      break;
  }
}

// Initialize
displayCurrentReminderInfo();
