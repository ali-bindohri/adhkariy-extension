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
const blockWebsiteInput = document.getElementById("blockWebsiteInput");
const addBlockedSiteBtn = document.getElementById("addBlockedSite");
const blockedSitesList = document.getElementById("blockedSitesList");

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupEventListeners();
  initializeTheme();
  loadBlockedSites();
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
      blockedSites: [],
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
// Request host permissions for in-page notifications
async function requestHostPermissions() {
  try {
    const granted = await chrome.permissions.request({
      origins: ["<all_urls>"],
    });
    return granted;
  } catch (error) {
    console.error("Permission request failed:", error);
    return false;
  }
}

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

function setupEventListeners() {
  // Enable/Disable toggle
  enableToggle.addEventListener("change", async (e) => {
    const enabled = e.target.checked;

    if (enabled) {
      // Check if we already have permissions
      const hasPermission = await hasHostPermissions();

      if (!hasPermission) {
        // Request permission for in-page notifications
        showStatus("🔓 طلب إذن لعرض الإشعارات...");
        const granted = await requestHostPermissions();

        if (!granted) {
          showStatus("⚠️ تم الرفض - سيتم استخدام إشعارات Chrome فقط");
          // Still enable, but without in-page notifications
        } else {
          showStatus("✅ تم منح الإذن - تذكيرات مفعلة");
        }
      }
    }

    chrome.storage.sync.set({ enabled }, () => {
      settingsPanel.style.display = enabled ? "block" : "none";
      if (!enabled) {
        showStatus("⏸️ تذكيرات معطلة");
      }
    });
  });

  // Reminder type toggles
  morningToggle.addEventListener("change", (e) => {
    chrome.storage.sync.set({ morningEnabled: e.target.checked }, () => {
      showStatus("تم حفظ الإعدادات");
    });
  });

  nightToggle.addEventListener("change", (e) => {
    chrome.storage.sync.set({ nightEnabled: e.target.checked }, () => {
      showStatus("تم حفظ الإعدادات");
    });
  });

  generalToggle.addEventListener("change", (e) => {
    chrome.storage.sync.set({ generalEnabled: e.target.checked }, () => {
      showStatus("تم حفظ الإعدادات");
    });
  });

  // Interval selection (presets)
  intervalRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const interval = parseInt(e.target.value);
      chrome.storage.sync.set({ interval }, () => {
        showStatus(`⏰ تم تعيين الفترة إلى ${interval} دقائق`);
        customIntervalInput.value = ""; // Clear custom input
      });
    });
  });

  // Custom interval input
  setCustomIntervalBtn.addEventListener("click", () => {
    const customInterval = parseInt(customIntervalInput.value);

    // Validation
    if (!customInterval || customInterval < 1 || customInterval > 1440) {
      showStatus("❌ يرجى إدخال 1-1440 دقائق");
      return;
    }

    // Uncheck all radio buttons
    intervalRadios.forEach((radio) => {
      radio.checked = false;
    });

    // Save custom interval
    chrome.storage.sync.set({ interval: customInterval }, () => {
      showStatus(`⏰ تم تعيين الفترة المخصصة إلى ${customInterval} دقائق`);
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
      showStatus("تم حفظ الإعدادات");
    });
  });

  // Auto-close delay
  autoCloseDelay.addEventListener("change", (e) => {
    const delay = parseInt(e.target.value);
    chrome.storage.sync.set({ autoCloseDelay: delay }, () => {
      showStatus("تم حفظ الإعدادات");
    });
  });

  // Pause toggle
  pauseToggle.addEventListener("change", (e) => {
    const isPaused = e.target.checked;
    chrome.storage.sync.set({ isPaused }, () => {
      showStatus(isPaused ? "⏸️ تذكيرات معطلة" : "▶️ تذكيرات مفعلة");
    });
  });

  // Test notification button
  testNotificationBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "testNotification" }, (response) => {
      if (response && response.success) {
        showStatus("🔔 تم إرسال الإشعار");
      }
    });
  });

  // Theme toggle
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    chrome.storage.sync.set({ darkMode: isDark });
    themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
  });

  // Blocked sites - Add button
  addBlockedSiteBtn.addEventListener("click", () => {
    addBlockedSite();
  });

  // Blocked sites - Enter key
  blockWebsiteInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addBlockedSite();
    }
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

// Load and display blocked sites
function loadBlockedSites() {
  chrome.storage.sync.get(["blockedSites"], (data) => {
    const blockedSites = data.blockedSites || [];
    displayBlockedSites(blockedSites);
  });
}

// Display blocked sites list
function displayBlockedSites(sites) {
  blockedSitesList.innerHTML = "";

  if (sites.length === 0) {
    blockedSitesList.innerHTML =
      '<p style="font-size: 12px; color: #999; text-align: center; padding: 10px;">لا توجد مواقع محظورة</p>';
    return;
  }

  sites.forEach((site, index) => {
    const siteItem = document.createElement("div");
    siteItem.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f5f5f5; border-radius: 4px; margin-bottom: 6px;";

    const siteText = document.createElement("span");
    siteText.textContent = site;
    siteText.style.cssText =
      "font-size: 12px; color: #333; direction: ltr; text-align: left; flex: 1;";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.style.cssText =
      "background: #dc3545; color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;";
    removeBtn.onclick = () => removeBlockedSite(site);

    siteItem.appendChild(siteText);
    siteItem.appendChild(removeBtn);
    blockedSitesList.appendChild(siteItem);
  });
}

// Add a blocked site
function addBlockedSite() {
  const sitePattern = blockWebsiteInput.value.trim().toLowerCase();

  if (!sitePattern) {
    showStatus("⚠️ أدخل رابط الموقع");
    return;
  }

  // Clean up the input
  let cleanPattern = sitePattern
    .replace(/^https?:\/\//, "") // Remove protocol
    .replace(/^www\./, "") // Remove www.
    .replace(/\/.*$/, ""); // Remove path

  chrome.storage.sync.get(["blockedSites"], (data) => {
    const blockedSites = data.blockedSites || [];

    if (blockedSites.includes(cleanPattern)) {
      showStatus("⚠️ الموقع محظور بالفعل");
      return;
    }

    blockedSites.push(cleanPattern);
    chrome.storage.sync.set({ blockedSites }, () => {
      showStatus("✅ تم حظر الموقع");
      blockWebsiteInput.value = "";
      displayBlockedSites(blockedSites);
    });
  });
}

// Remove a blocked site
function removeBlockedSite(site) {
  chrome.storage.sync.get(["blockedSites"], (data) => {
    const blockedSites = data.blockedSites || [];
    const index = blockedSites.indexOf(site);

    if (index > -1) {
      blockedSites.splice(index, 1);
      chrome.storage.sync.set({ blockedSites }, () => {
        showStatus("✅ تم إلغاء الحظر");
        displayBlockedSites(blockedSites);
      });
    }
  });
}

// Initialize
displayCurrentReminderInfo();
