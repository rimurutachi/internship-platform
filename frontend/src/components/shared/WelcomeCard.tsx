'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserContext } from '@/components/providers/UserProvider';
import { MapPin, Clock, CalendarDays, Wind, Droplets, Thermometer, Loader2 } from 'lucide-react';

/* ─────────────────────────────────────────────
   Weather icon SVGs (mapped to WMO codes)
   ───────────────────────────────────────────── */

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="12" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="3" strokeLinecap="round">
        <line x1="32" y1="6" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="58" />
        <line x1="6" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="58" y2="32" />
        <line x1="13.6" y1="13.6" x2="19.3" y2="19.3" />
        <line x1="44.7" y1="44.7" x2="50.4" y2="50.4" />
        <line x1="13.6" y1="50.4" x2="19.3" y2="44.7" />
        <line x1="44.7" y1="19.3" x2="50.4" y2="13.6" />
      </g>
    </svg>
  );
}

function CloudSunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="9" fill="#FBBF24" />
      <g stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round">
        <line x1="22" y1="5" x2="22" y2="10" />
        <line x1="5" y1="22" x2="10" y2="22" />
        <line x1="10" y1="10" x2="13.5" y2="13.5" />
        <line x1="34" y1="10" x2="30.5" y2="13.5" />
      </g>
      <path d="M20 38 C20 38 16 38 14 36 C10 33 10 27 16 25 C16 20 22 16 28 20 C32 16 40 16 42 22 C48 22 50 28 46 32 C48 36 44 38 42 38 Z" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
    </svg>
  );
}

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 42 C12 42 8 38 8 34 C8 30 12 26 16 26 C16 20 22 14 30 16 C34 10 44 10 48 18 C54 18 58 24 54 30 C58 36 52 42 48 42 Z" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
    </svg>
  );
}

function FogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
        <line x1="12" y1="24" x2="52" y2="24" />
        <line x1="16" y1="32" x2="48" y2="32" opacity="0.7" />
        <line x1="12" y1="40" x2="52" y2="40" />
        <line x1="20" y1="48" x2="44" y2="48" opacity="0.5" />
      </g>
    </svg>
  );
}

function RainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 34 C12 34 8 30 8 26 C8 22 12 18 16 18 C16 12 22 6 30 8 C34 2 44 2 48 10 C54 10 58 16 54 22 C58 28 52 34 48 34 Z" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
      <g stroke="#60A5FA" strokeWidth="2" strokeLinecap="round">
        <line x1="22" y1="40" x2="20" y2="48" />
        <line x1="32" y1="38" x2="30" y2="50" />
        <line x1="42" y1="40" x2="40" y2="48" />
      </g>
    </svg>
  );
}

function ThunderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 30 C12 30 8 26 8 22 C8 18 12 14 16 14 C16 8 22 2 30 4 C34 -2 44 -2 48 6 C54 6 58 12 54 18 C58 24 52 30 48 30 Z" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
      <polygon points="30,32 26,44 32,44 28,56 40,40 34,40 38,32" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" />
    </svg>
  );
}

function SnowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 34 C12 34 8 30 8 26 C8 22 12 18 16 18 C16 12 22 6 30 8 C34 2 44 2 48 10 C54 10 58 16 54 22 C58 28 52 34 48 34 Z" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
      <g fill="#60A5FA">
        <circle cx="22" cy="42" r="2.5" />
        <circle cx="32" cy="46" r="2.5" />
        <circle cx="42" cy="42" r="2.5" />
        <circle cx="27" cy="52" r="2" />
        <circle cx="37" cy="52" r="2" />
      </g>
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 10 C28 14 22 24 22 34 C22 48 34 56 46 54 C40 58 32 58 24 54 C12 48 8 34 14 22 C18 14 28 8 38 10Z" fill="#FBBF24" />
      <circle cx="36" cy="20" r="1.5" fill="#FDE68A" />
      <circle cx="30" cy="30" r="1" fill="#FDE68A" />
      <circle cx="40" cy="34" r="1.5" fill="#FDE68A" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   WMO Weather Code → label + icon mapping
   ───────────────────────────────────────────── */

interface WeatherInfo {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getWeatherInfo(code: number, isNight: boolean): WeatherInfo {
  if (code === 0) {
    return isNight
      ? { label: 'Clear Night', Icon: MoonIcon }
      : { label: 'Clear Sky', Icon: SunIcon };
  }
  if (code <= 3) return { label: 'Partly Cloudy', Icon: isNight ? CloudIcon : CloudSunIcon };
  if (code <= 48) return { label: 'Foggy', Icon: FogIcon };
  if (code <= 67) return { label: 'Rainy', Icon: RainIcon };
  if (code <= 77) return { label: 'Snowy', Icon: SnowIcon };
  if (code <= 82) return { label: 'Rain Showers', Icon: RainIcon };
  if (code <= 99) return { label: 'Thunderstorm', Icon: ThunderIcon };
  return { label: 'Cloudy', Icon: CloudIcon };
}

/* ─────────────────────────────────────────────
   Role badge config
   ───────────────────────────────────────────── */

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string; greeting: string }> = {
  student: {
    label: 'Student',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200/60 dark:border-green-700/40',
    greeting: 'Ready to make progress today?',
  },
  advisor: {
    label: 'Advisor',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/40',
    greeting: 'Your students are counting on you!',
  },
  supervisor: {
    label: 'Supervisor',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/40',
    greeting: 'Oversee your interns\u0027 growth today.',
  },
  admin: {
    label: 'Administrator',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-700/40',
    greeting: 'Platform overview at a glance.',
  },
};

/* ─────────────────────────────────────────────
   Weather data types
   ───────────────────────────────────────────── */

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  isDay: boolean;
}

interface LocationData {
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

/* ─────────────────────────────────────────────
   Time-of-day greeting helper
   ───────────────────────────────────────────── */

function getTimeGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ─────────────────────────────────────────────
   WelcomeCard Component
   ───────────────────────────────────────────── */

export function WelcomeCard() {
  const { user } = useUserContext();

  // Time state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Location state
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // ─── Live clock (updates every minute) ───
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // ─── Geolocation + reverse geocode ───
  const fetchLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      setLocationError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use Nominatim reverse geocoding (free, no API key needed)
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const address = geoData.address || {};
            const city = address.city || address.town || address.municipality || address.village || address.county || 'Unknown';
            const region = address.state || address.region || address.country || '';

            setLocation({ city, region, latitude, longitude });
          } else {
            setLocation({ city: 'Your Location', region: '', latitude, longitude });
          }
        } catch {
          setLocation({ city: 'Your Location', region: '', latitude, longitude });
        }
        setLocationLoading(false);
      },
      () => {
        // User denied or geolocation failed — use IP-based fallback
        fetchIPLocation();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // IP-based location fallback
  const fetchIPLocation = useCallback(async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        setLocation({
          city: data.city || 'Unknown',
          region: data.region || '',
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } else {
        setLocationError(true);
      }
    } catch {
      setLocationError(true);
    }
    setLocationLoading(false);
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // ─── Weather fetch ───
  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`
        );
        if (res.ok) {
          const data = await res.json();
          const current = data.current;
          setWeather({
            temperature: Math.round(current.temperature_2m),
            weatherCode: current.weather_code,
            windSpeed: Math.round(current.wind_speed_10m),
            humidity: current.relative_humidity_2m,
            isDay: current.is_day === 1,
          });
        }
      } catch {
        // Weather fetch failed silently
      }
      setWeatherLoading(false);
    };

    fetchWeather();
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 600_000);
    return () => clearInterval(interval);
  }, [location]);

  // ─── Derived values ───
  const role = user?.role || 'student';
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const firstName = user?.first_name || 'User';
  const greeting = getTimeGreeting(currentTime.getHours());

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [currentTime.toDateString()]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [currentTime.getMinutes()]);

  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode, !weather.isDay) : null;

  return (
    <div className="animate-in relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
      {/* ── Background gradient ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#16a34a] via-[#15803d] to-[#166534] dark:from-[#14532d] dark:via-[#166534] dark:to-[#15803d]" />

      {/* ── Decorative orbs ── */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 dark:bg-white/5 blur-2xl" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#f59e0b]/15 dark:bg-[#f59e0b]/10 blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-white/5 blur-xl" />

      {/* ── Content ── */}
      <div className="relative z-10 p-5 sm:p-6 lg:p-7">
        {/* Desktop: horizontal layout / Mobile: stacked layout */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8">

          {/* ─── Left: Greeting section ─── */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Greeting + Name */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {greeting}, {firstName}!
              </h1>
              <p className="text-sm text-white/70 mt-1">
                {roleConfig.greeting}
              </p>
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig.badgeClass}`}>
                {roleConfig.label}
              </span>
            </div>
          </div>

          {/* ─── Center: Date & Time ─── */}
          <div className="flex flex-row lg:flex-col items-start lg:items-center gap-3 lg:gap-1.5 shrink-0">
            <div className="flex items-center gap-2 text-white/90">
              <CalendarDays className="w-4 h-4 text-[#fbbf24]" />
              <span className="text-sm font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-[#fbbf24]" />
              <span className="text-lg sm:text-xl font-bold tabular-nums">{formattedTime}</span>
            </div>
          </div>

          {/* ─── Right: Weather + Location ─── */}
          <div className="flex flex-row lg:flex-col items-start lg:items-end gap-4 lg:gap-3 shrink-0">
            {/* Weather */}
            {weatherLoading && !weather ? (
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Loading weather...</span>
              </div>
            ) : weather && weatherInfo ? (
              <div className="flex items-center gap-3">
                {/* Weather icon */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 drop-shadow-lg animate-float">
                  <weatherInfo.Icon className="w-full h-full" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                      {weather.temperature}°
                    </span>
                    <span className="text-xs text-white/60 font-medium">C</span>
                  </div>
                  <p className="text-xs text-white/70 font-medium">{weatherInfo.label}</p>
                </div>
                {/* Extra weather stats (desktop only) */}
                <div className="hidden sm:flex flex-col gap-1 ml-2 pl-3 border-l border-white/20">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Wind className="w-3 h-3" />
                    <span className="text-xs">{weather.windSpeed} km/h</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Droplets className="w-3 h-3" />
                    <span className="text-xs">{weather.humidity}%</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Location */}
            {locationLoading ? (
              <div className="flex items-center gap-1.5 text-white/50">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Locating...</span>
              </div>
            ) : location && !locationError ? (
              <div className="flex items-center gap-1.5 text-white/80">
                <MapPin className="w-3.5 h-3.5 text-[#fbbf24] flex-shrink-0" />
                <span className="text-xs font-medium truncate max-w-[200px]">
                  {location.city}{location.region ? `, ${location.region}` : ''}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile weather extras (wind + humidity) */}
        {weather && (
          <div className="flex sm:hidden items-center gap-4 mt-3 pt-3 border-t border-white/15">
            <div className="flex items-center gap-1.5 text-white/60">
              <Wind className="w-3 h-3" />
              <span className="text-xs">Wind: {weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <Droplets className="w-3 h-3" />
              <span className="text-xs">Humidity: {weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <Thermometer className="w-3 h-3" />
              <span className="text-xs">Feels {weather.temperature}°C</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
