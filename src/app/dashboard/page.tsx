import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAllDocuments } from '@/lib/documents'
import { getAllTasks } from '@/lib/tasks'
import { getRecentEntries, getTodayDate } from '@/lib/journal'
import Link from 'next/link'
import { FileText, CheckSquare, BookOpen, Clock, TrendingUp, Sparkles, Zap } from 'lucide-react'

// New dashboard widgets
import MedicationTracker from '@/components/dashboard/MedicationTracker'
import SchoolDeadlines from '@/components/dashboard/SchoolDeadlines'
import WeatherWidget from '@/components/dashboard/WeatherWidget'
import QuickLinks from '@/components/dashboard/QuickLinks'
import FocusTimer from '@/components/dashboard/FocusTimer'
import ProjectCards from '@/components/dashboard/ProjectCards'
import HabitsTracker from '@/components/dashboard/HabitsTracker'

function getGreeting(): string {
  const hour = new Date().getUTCHours()
  const estHour = (hour - 5 + 24) % 24
  
  if (estHour >= 5 && estHour < 12) return 'Good morning'
  if (estHour >= 12 && estHour < 17) return 'Good afternoon'
  if (estHour >= 17 && estHour < 21) return 'Good evening'
  return 'Burning the midnight oil'
}

export default function DashboardPage() {
  const documents = getAllDocuments()
  const tasks = getAllTasks()
  const recentJournals = getRecentEntries(5)
  const today = getTodayDate()
  const greeting = getGreeting()

  const taskStats = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  const myTasks = tasks.filter(t => t.assignee === 'armaan' && t.status !== 'done')
  const totalActive = taskStats.todo + taskStats.inProgress
  const completionRate = tasks.length > 0 ? Math.round((taskStats.done / tasks.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative">
        <div className="absolute -inset-x-6 -inset-y-4 bg-gradient-to-r from-[#4169E1]/5 via-transparent to-[#228B22]/5 rounded-2xl -z-10" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#4169E1] mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {greeting}
            </p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Welcome back, Armaan
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">{totalActive} active</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#228B22]" />
              <span className="text-sm font-medium">{completionRate}% done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Priority Row: Medication + Weather */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MedicationTracker />
        <WeatherWidget />
      </div>

      {/* Main Grid: School + Focus + Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: School Deadlines */}
        <div className="lg:col-span-2">
          <SchoolDeadlines />
        </div>
        
        {/* Right column: Focus Timer + Habits */}
        <div className="space-y-4">
          <FocusTimer />
          <HabitsTracker />
        </div>
      </div>

      {/* Projects Row */}
      <ProjectCards />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-white/5 p-5 transition-all hover:border-purple-500/20">
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Documents</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <FileText className="h-4 w-4 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{documents.length}</div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#4169E1]/10 to-transparent border border-white/5 p-5 transition-all hover:border-[#4169E1]/20">
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Active Tasks</span>
              <div className="p-1.5 rounded-lg bg-[#4169E1]/10">
                <CheckSquare className="h-4 w-4 text-[#4169E1]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{taskStats.todo + taskStats.inProgress}</div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-white/5 p-5 transition-all hover:border-amber-500/20">
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Journal</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <BookOpen className="h-4 w-4 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{recentJournals.length}</div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#228B22]/10 to-transparent border border-white/5 p-5 transition-all hover:border-[#228B22]/20">
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Backlog</span>
              <div className="p-1.5 rounded-lg bg-[#228B22]/10">
                <Clock className="h-4 w-4 text-[#228B22]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{taskStats.backlog}</div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Tasks + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Tasks */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Your Tasks</CardTitle>
            <CardDescription>What needs your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active tasks. Nice work! 🎉</p>
            ) : (
              <div className="space-y-3">
                {myTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-500'
                      }`} />
                      <span className="text-sm">{task.title}</span>
                    </div>
                    <div className="flex gap-1">
                      {task.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {myTasks.length > 5 && (
                  <Link href="/dashboard/tasks" className="text-sm text-blue-500 hover:underline">
                    View all {myTasks.length} tasks →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <QuickLinks />
      </div>
    </div>
  )
}
