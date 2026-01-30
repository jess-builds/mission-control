'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer } from 'lucide-react'

interface WeatherData {
  temp: number
  condition: string
  wind: number
  humidity: number
  feelsLike: number
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeather()
  }, [])

  const fetchWeather = async () => {
    try {
      // Using wttr.in for simple weather
      const res = await fetch('https://wttr.in/Brampton,ON?format=j1')
      if (res.ok) {
        const data = await res.json()
        const current = data.current_condition[0]
        setWeather({
          temp: parseInt(current.temp_C),
          condition: current.weatherDesc[0].value,
          wind: parseInt(current.windspeedKmph),
          humidity: parseInt(current.humidity),
          feelsLike: parseInt(current.FeelsLikeC)
        })
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase()
    if (lower.includes('snow')) return CloudSnow
    if (lower.includes('rain') || lower.includes('drizzle')) return CloudRain
    if (lower.includes('cloud') || lower.includes('overcast')) return Cloud
    return Sun
  }

  if (loading) {
    return (
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
        <div className="animate-pulse h-24 bg-white/5 rounded-lg" />
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
        <p className="text-white/40 text-sm">Weather unavailable</p>
      </div>
    )
  }

  const WeatherIcon = getWeatherIcon(weather.condition)

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
      {/* Background gradient based on temp */}
      <div className={`
        absolute inset-0 opacity-10
        ${weather.temp < 0 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
          weather.temp < 15 ? 'bg-gradient-to-br from-cyan-500 to-teal-500' :
          weather.temp < 25 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
          'bg-gradient-to-br from-orange-500 to-red-500'}
      `} />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 mb-1">Brampton, ON</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{weather.temp}°</span>
              <span className="text-white/40">C</span>
            </div>
            <p className="text-sm text-white/60 mt-1">{weather.condition}</p>
          </div>
          
          <div className={`
            p-4 rounded-2xl
            ${weather.temp < 0 ? 'bg-blue-500/20 text-blue-400' :
              weather.temp < 15 ? 'bg-cyan-500/20 text-cyan-400' :
              'bg-yellow-500/20 text-yellow-400'}
          `}>
            <WeatherIcon className="h-10 w-10" />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Thermometer className="h-3.5 w-3.5" />
            Feels {weather.feelsLike}°
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Wind className="h-3.5 w-3.5" />
            {weather.wind} km/h
          </div>
        </div>
      </div>
    </div>
  )
}
