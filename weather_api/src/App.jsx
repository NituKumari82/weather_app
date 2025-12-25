import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import WeatherBackground from "./components/WeatherBackground";
import Forecast from "./components/Forecast";
import {
  convertTemperature,
  formatTime,
  getHumidityValue,
  getVisibilityValue,
  getWindDirection,
} from "./components/Helper";
import {
  HumidityIcon,
  SunriseIcon,
  SunsetIcon,
  VisibilityIcon,
  WindIcon,
} from "./components/Icons";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "9cdc2a2a1b34c445e07c789418f6e41d";

const getWeatherIcon = (code) => {
  if ([0].includes(code)) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
};

const getWeatherLabel = (code) => {
  const labels = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm",
  };
  return labels[code] || "Changing weather";
};

const getLocalHistory = () => {
  try {
    return JSON.parse(localStorage.getItem("weather-history")) || [];
  } catch {
    return [];
  }
};

const saveLocalHistory = (place) => {
  const next = [place, ...getLocalHistory().filter((item) => item.label !== place.label)].slice(0, 5);
  localStorage.setItem("weather-history", JSON.stringify(next));
  return next;
};

const App = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [unit, setUnit] = useState("C");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState(getLocalHistory);

  const fetchSuggestions = useCallback(async (query) => {
    if (!API_KEY || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
      );
      const data = response.ok ? await response.json() : [];
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (!city.trim() || weather) {
      setSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(() => fetchSuggestions(city), 450);
    return () => clearTimeout(timer);
  }, [city, fetchSuggestions, weather]);

  const parseForecast = (data) => {
    const daily = data.daily?.time?.map((date, index) => ({
      date,
      max: data.daily.temperature_2m_max[index],
      min: data.daily.temperature_2m_min[index],
      weathercode: data.daily.weathercode[index],
      rain: data.daily.precipitation_probability_max?.[index] ?? 0,
    })) || [];

    const hourlyData = data.hourly?.time?.map((time, index) => ({
      time,
      date: time.split("T")[0],
      hour: new Date(time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      temp: data.hourly.temperature_2m[index],
      rain: data.hourly.precipitation_probability?.[index] ?? 0,
      weathercode: data.hourly.weathercode?.[index] ?? 0,
    })) || [];

    setForecast(daily);
    setHourly(hourlyData);
    setSelectedDate(daily[0]?.date || "");

    const riskyDays = daily.filter((day) => [95, 96, 99].includes(day.weathercode) || day.rain >= 70);
    setNotice(
      riskyDays.length
        ? `Weather alert: ${riskyDays.length} upcoming day(s) may have storms or heavy rain.`
        : ""
    );
  };

  const fetchForecast = async ({ lat, lon }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&hourly=temperature_2m,precipitation_probability,weathercode&timezone=auto`
    );
    if (!response.ok) throw new Error("Unable to load forecast data");
    parseForecast(await response.json());
  };

  const fetchWeatherByUrl = async (url, label = "") => {
    setIsLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("City not found. Please try another location.");

      const current = await response.json();
      setWeather(current);
      setCity(label || `${current.name}, ${current.sys?.country || ""}`.replace(/, $/, ""));
      setSuggestions([]);
      await fetchForecast(current.coord);

      const historyItem = {
        label: label || `${current.name}, ${current.sys?.country || ""}`.replace(/, $/, ""),
        lat: current.coord.lat,
        lon: current.coord.lon,
      };
      setHistory(saveLocalHistory(historyItem));
    } catch (err) {
      setWeather(null);
      setForecast([]);
      setHourly([]);
      setSelectedDate("");
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const searchByCity = (event) => {
    event.preventDefault();
    const query = city.trim();
    if (!query) {
      setError("Please enter a city name.");
      return;
    }

    fetchWeatherByUrl(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric`
    );
  };

  const searchByCoordinates = ({ lat, lon, label }) => {
    fetchWeatherByUrl(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      label
    );
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        searchByCoordinates({ lat: coords.latitude, lon: coords.longitude, label: "My location" });
      },
      () => {
        setIsLoading(false);
        setError("Location permission denied. Search by city instead.");
      }
    );
  };

  const condition = useMemo(() => {
    if (!weather) return null;
    const now = Date.now() / 1000;
    return {
      main: weather.weather?.[0]?.main,
      isDay: now > weather.sys.sunrise && now < weather.sys.sunset,
    };
  }, [weather]);

  const selectedDay = forecast.find((day) => day.date === selectedDate) || forecast[0];
  const selectedHourly = hourly.filter((item) => item.date === selectedDate).slice(0, 12);
  const chartData = selectedHourly.map((item) => ({
    time: item.hour,
    temp: convertTemperature(item.temp, unit),
    rain: item.rain,
  }));

  const resetSearch = () => {
    setWeather(null);
    setForecast([]);
    setHourly([]);
    setSelectedDate("");
    setCity("");
    setError("");
    setNotice("");
  };

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <WeatherBackground condition={condition} />

      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-white/70">Live forecast dashboard</p>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">WeatherSphere</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/75">
            Search any city, use your current location, switch units, inspect daily cards, and compare hourly temperature trends.
          </p>
        </header>

        <section className="rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <form onSubmit={searchByCity} className="relative grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Search city, country..."
                className="w-full rounded-2xl border border-white/20 bg-black/25 px-5 py-4 text-white outline-none transition placeholder:text-white/55 focus:border-white/60 focus:bg-black/35"
              />

              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[110%] z-20 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur">
                  {suggestions.map((place) => (
                    <button
                      key={`${place.name}-${place.lat}-${place.lon}`}
                      type="button"
                      onClick={() =>
                        searchByCoordinates({
                          lat: place.lat,
                          lon: place.lon,
                          label: `${place.name}${place.state ? `, ${place.state}` : ""}, ${place.country}`,
                        })
                      }
                      className="block w-full px-5 py-3 text-left text-sm transition hover:bg-white/10"
                    >
                      {place.name}{place.state ? `, ${place.state}` : ""}, {place.country}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl bg-white px-6 py-4 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Search"}
            </button>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={isLoading}
              className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-bold transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Use my location
            </button>
          </form>

          {history.length > 0 && !weather && (
            <div className="mt-4 flex flex-wrap gap-2">
              {history.map((item) => (
                <button
                  key={`${item.label}-${item.lat}`}
                  type="button"
                  onClick={() => searchByCoordinates(item)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {error && <p className="mt-4 rounded-2xl bg-red-500/20 p-4 text-sm text-red-100">{error}</p>}
          {notice && <p className="mt-4 rounded-2xl bg-amber-400/20 p-4 text-sm text-amber-50">{notice}</p>}
        </section>

        {weather && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/65">Current weather</p>
                  <h2 className="mt-1 text-3xl font-black">{weather.name}, {weather.sys.country}</h2>
                  <p className="mt-1 capitalize text-white/75">{weather.weather[0].description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUnit((value) => (value === "C" ? "F" : "C"))}
                  className="rounded-full border border-white/20 bg-white/15 px-4 py-2 font-bold transition hover:bg-white/25"
                >
                  °{unit}
                </button>
              </div>

              <div className="my-8 flex items-center justify-center gap-4">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                  alt={weather.weather[0].description}
                  className="h-32 w-32 drop-shadow-2xl"
                />
                <div>
                  <p className="text-7xl font-black tracking-tight">
                    {convertTemperature(weather.main.temp, unit)}°
                  </p>
                  <p className="text-white/70">
                    Feels like {convertTemperature(weather.main.feels_like, unit)}°{unit}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoCard icon={<HumidityIcon />} label="Humidity" value={`${weather.main.humidity}%`} helper={getHumidityValue(weather.main.humidity)} />
                <InfoCard icon={<WindIcon />} label="Wind" value={`${weather.wind.speed} m/s`} helper={getWindDirection(weather.wind.deg || 0)} />
                <InfoCard icon={<VisibilityIcon />} label="Visibility" value={getVisibilityValue(weather.visibility)} helper="Range" />
                <InfoCard icon={<SunriseIcon />} label="Sunrise" value={formatTime(weather.sys.sunrise, weather.timezone)} helper="Local" />
                <InfoCard icon={<SunsetIcon />} label="Sunset" value={formatTime(weather.sys.sunset, weather.timezone)} helper="Local" />
                <InfoCard icon={<span className="text-3xl">🌡️</span>} label="Pressure" value={`${weather.main.pressure} hPa`} helper="Sea level" />
              </div>

              <button
                type="button"
                onClick={resetSearch}
                className="mt-6 w-full rounded-2xl border border-white/20 bg-black/25 px-5 py-3 font-bold transition hover:bg-black/40"
              >
                New search
              </button>
            </section>

            <section className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/65">Selected day</p>
                  <h3 className="text-2xl font-black">
                    {selectedDay ? new Date(selectedDay.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "Forecast"}
                  </h3>
                  {selectedDay && <p className="text-white/70">{getWeatherIcon(selectedDay.weathercode)} {getWeatherLabel(selectedDay.weathercode)} · Rain chance {selectedDay.rain}%</p>}
                </div>
              </div>

              <div className="mt-6 h-72 rounded-3xl bg-black/20 p-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "16px", color: "white" }}
                        labelStyle={{ color: "white" }}
                      />
                      <Area type="monotone" dataKey="temp" name={`Temp °${unit}`} stroke="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.25)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-white/70">No hourly data available.</div>
                )}
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {selectedHourly.map((item) => (
                  <div key={item.time} className="min-w-24 rounded-2xl border border-white/10 bg-white/10 p-3 text-center">
                    <p className="text-sm font-semibold">{item.hour}</p>
                    <p className="my-1 text-2xl">{getWeatherIcon(item.weathercode)}</p>
                    <p className="text-sm">{convertTemperature(item.temp, unit)}°{unit}</p>
                    <p className="text-xs text-white/60">☔ {item.rain}%</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="lg:col-span-2">
              <Forecast
                days={forecast}
                selectedDate={selectedDate}
                unit={unit}
                onSelectDay={setSelectedDate}
                getWeatherIcon={getWeatherIcon}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

const InfoCard = ({ icon, label, value, helper }) => (
  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center transition hover:-translate-y-1 hover:bg-white/15">
    <div className="mb-2 flex justify-center">{icon}</div>
    <p className="text-sm text-white/65">{label}</p>
    <p className="text-lg font-black">{value}</p>
    <p className="text-xs text-white/55">{helper}</p>
  </div>
);

export default App;