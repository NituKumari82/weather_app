import windIcon from "../assets/images/Wind.png";
import humidityIcon from "../assets/images/humidity.png";
import visibilityIcon from "../assets/images/visibility.png";
import sunriseIcon from "../assets/images/Sunrise.png";
import sunsetIcon from "../assets/images/Sunset.png";

const Icon = ({ src, alt, className = "" }) => (
  <img src={src} alt={alt} className={`h-8 w-8 object-contain ${className}`} />
);

export const WindIcon = () => <Icon src={windIcon} alt="Wind" className="animate-float" />;
export const HumidityIcon = () => <Icon src={humidityIcon} alt="Humidity" className="animate-pulse-soft" />;
export const VisibilityIcon = () => <Icon src={visibilityIcon} alt="Visibility" className="animate-pulse-soft" />;
export const SunriseIcon = () => <Icon src={sunriseIcon} alt="Sunrise" className="animate-float" />;
export const SunsetIcon = () => <Icon src={sunsetIcon} alt="Sunset" className="animate-float" />;
