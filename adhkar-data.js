// Islamic Adhkar Data
// Organized by time of day: Morning, Night, and General
import { eveningAdhkar } from "./evening-adhkar.js";
import { morningAdhkar } from "./morning-adhkar.js";
import { generalAdhkar } from "./general-adhkar.js";

export const ADHKAR_DATA = {
  morning: [...morningAdhkar],
  night: [...eveningAdhkar],
  general: [...generalAdhkar],
};

// Helper function to get random dhikr based on current time
export function getRandomDhikr() {
  const now = new Date();
  const hours = now.getHours();

  let adhkarArray;

  // Morning: 5:00 AM to 9:00 AM
  if (hours >= 5 && hours < 9) {
    adhkarArray = ADHKAR_DATA.morning;
  }
  // Night: 04:00 PM (16:00) to 07:00 PM (17:00)
  else if (hours >= 16 && hours < 19) {
    adhkarArray = ADHKAR_DATA.night;
  }
  // General: All other times
  else {
    adhkarArray = ADHKAR_DATA.general;
  }

  const randomIndex = Math.floor(Math.random() * adhkarArray.length);
  return adhkarArray[randomIndex];
}

// Get the current reminder type
export function getCurrentReminderType() {
  const hours = new Date().getHours();

  if (hours >= 5 && hours < 9) {
    return "morning";
  } else if (hours >= 16 && hours < 19) {
    return "night";
  } else {
    return "general";
  }
}
