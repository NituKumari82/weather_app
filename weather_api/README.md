# WeatherSphere

Interactive React + Vite weather dashboard that is ready to deploy as a static site on Render.

## Features

- Search weather by city with live suggestions.
- Use browser geolocation for current-location weather.
- Toggle Celsius and Fahrenheit.
- Interactive 7-day forecast cards.
- Hourly temperature chart and rain probability.
- Recent search chips saved in local storage.
- Dynamic animated weather backgrounds.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Add your OpenWeather API key in `.env`:

```bash
VITE_OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

## Production build

```bash
npm run build
npm run preview
```

## Deploy on Render

Use these settings for a Render Static Site:

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variable: `VITE_OPENWEATHER_API_KEY`
