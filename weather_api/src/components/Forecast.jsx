import { convertTemperature } from "./Helper";

const Forecast = ({ days = [], selectedDate, unit, onSelectDay, getWeatherIcon }) => {
  if (!days.length) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">7-Day Forecast</h3>
        <span className="text-xs text-white/70">Tap a day to inspect</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const isSelected = selectedDate === day.date;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDay(day.date)}
              className={`rounded-2xl border p-4 text-center transition hover:-translate-y-1 hover:bg-white/20 ${
                isSelected ? "border-white bg-white/25 shadow-lg" : "border-white/15 bg-white/10"
              }`}
            >
              <p className="text-sm font-semibold text-white">
                {new Date(day.date).toLocaleDateString("en-GB", { weekday: "short" })}
              </p>
              <p className="my-2 text-3xl">{getWeatherIcon(day.weathercode)}</p>
              <p className="text-sm font-medium text-white">
                {convertTemperature(day.max, unit)}° / {convertTemperature(day.min, unit)}°{unit}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Forecast;