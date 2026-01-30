'use client'

import { useState } from 'react'
import { Check, Pill, Dumbbell, BookOpen, Code, Flame } from 'lucide-react'

interface Habit {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  streak: number
  completedToday: boolean
}

const DEFAULT_HABITS: Habit[] = [
  { id: 'meds', name: 'Medication', icon: Pill, color: 'text-emerald-500 bg-emerald-500/20', streak: 0, completedToday: false },
  { id: 'exercise', name: 'Exercise', icon: Dumbbell, color: 'text-orange-500 bg-orange-500/20', streak: 0, completedToday: false },
  { id: 'journal', name: 'Journal', icon: BookOpen, color: 'text-blue-500 bg-blue-500/20', streak: 0, completedToday: false },
  { id: 'code', name: 'Build', icon: Code, color: 'text-purple-500 bg-purple-500/20', streak: 0, completedToday: false },
]

export default function HabitsTracker() {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS)

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        return {
          ...habit,
          completedToday: !habit.completedToday,
          streak: !habit.completedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1)
        }
      }
      return habit
    }))
  }

  const completedCount = habits.filter(h => h.completedToday).length

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Daily Habits
        </h3>
        <span className="text-xs text-white/40">
          {completedCount}/{habits.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#4169E1] to-[#228B22] transition-all duration-300"
          style={{ width: `${(completedCount / habits.length) * 100}%` }}
        />
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-4 gap-2">
        {habits.map(habit => (
          <button
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-xl transition-all
              ${habit.completedToday 
                ? 'bg-[#228B22]/20 border border-[#228B22]/30' 
                : 'bg-white/5 border border-transparent hover:border-white/10'}
            `}
          >
            <div className={`
              p-2 rounded-lg transition-all
              ${habit.completedToday 
                ? 'bg-[#228B22]/20 text-[#228B22]' 
                : habit.color}
            `}>
              {habit.completedToday 
                ? <Check className="h-4 w-4" />
                : <habit.icon className="h-4 w-4" />
              }
            </div>
            <span className="text-xs text-white/60">{habit.name}</span>
            {habit.streak > 0 && (
              <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                <Flame className="h-2.5 w-2.5" />
                {habit.streak}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
