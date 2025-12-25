import Thunderstorm from "../assets/images/Thunderstorm.gif";
import Rain from "../assets/images/Rain.gif";
import SnowDay from "../assets/images/Snow.gif";
import ClearDay from "../assets/images/ClearDay.gif";
import ClearNight from "../assets/images/ClearNight.gif";
import CloudsDay from "../assets/images/CloudsDay.gif";
import CloudsNight from "../assets/images/CloudsNight.gif";
import Haze from "../assets/images/Haze.gif";
import Video from "../assets/images/video1.mp4";

const backgroundMap = {
  Thunderstorm,
  Drizzle: Rain,
  Rain,
  Snow: SnowDay,
  Mist: Haze,
  Smoke: Haze,
  Haze,
  Dust: Haze,
  Fog: Haze,
  Sand: Haze,
  Ash: Haze,
  Squall: Rain,
  Tornado: Thunderstorm,
};

const WeatherBackground = ({ condition }) => {
  const getBackground = () => {
    if (!condition?.main) return Video;
    if (condition.main === "Clear") return condition.isDay ? ClearDay : ClearNight;
    if (condition.main === "Clouds") return condition.isDay ? CloudsDay : CloudsNight;
    return backgroundMap[condition.main] || Video;
  };

  const background = getBackground();
  const isVideo = background === Video;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {isVideo ? (
        <video autoPlay loop muted playsInline className="h-full w-full object-cover opacity-70">
          <source src={Video} type="video/mp4" />
        </video>
      ) : (
        <img src={background} alt="Weather background" className="h-full w-full object-cover opacity-70" />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/45 to-black/70" />
    </div>
  );
};

export default WeatherBackground;
