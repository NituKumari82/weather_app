export const getWindDirection = (degrees = 0) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return directions[index];
};

export const getHumidityValue = (humidity = 0) => {
  if (humidity < 30) return "Low";
  if (humidity < 60) return "Moderate";
  return "High";
};

export const getVisibilityValue = (visibility = 0) => {
  const km = visibility / 1000;
  return `${km.toFixed(1)} km`;
};

export const convertTemperature = (temp = 0, unit = "C") => {
  const value = unit === "F" ? (temp * 9) / 5 + 32 : temp;
  return Math.round(value);
};

export const formatTime = (timestamp, timezoneOffset = 0) => {
  if (!timestamp) return "--:--";
  const localTime = new Date((timestamp + timezoneOffset) * 1000);
  return localTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
};