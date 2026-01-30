import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAllTasks } from '@/lib/tasks'
import Link from 'next/link'
import { CheckSquare, TrendingUp, Sparkles, Zap } from 'lucide-react'

// Dashboard widgets
import MedicationTracker from '@/components/dashboard/MedicationTracker'
import SchoolDeadlines from '@/components/dashboard/SchoolDeadlines'
import QuickLinks from '@/components/dashboard/QuickLinks'
import ProjectCards from '@/components/dashboard/ProjectCards'
import ActivityTimeline from '@/components/dashboard/ActivityTimeline'

function getGreeting(): string {
  const hour = new Date().getUTCHours()
  const estHour = (hour - 5 + 24) % 24
  
  if (estHour >= 5 && estHour < 12) return 'Good morning'
  if (estHour >= 12 && estHour < 17) return 'Good afternoon'
  if (estHour >= 17 && estHour < 21) return 'Good evening'
  return 'Burning the midnight oil'
}

export default function DashboardPage() {
  const tasks = getAllTasks()
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
    <div className="flex gap-6 h-full">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6 min-w-0">
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

        {/* Medication Tracker - Full Width Priority */}
        <MedicationTracker />

        {/* Main Grid: School Deadlines + Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SchoolDeadlines />
          <ProjectCards />
        </div>

        {/* Bottom Row: Tasks + Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Your Tasks */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-[#4169E1]" />
                Your Tasks
              </CardTitle>
              <CardDescription>What needs your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {myTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active tasks. Nice work! 🎉</p>
              ) : (
                <div className="space-y-3">
                  {myTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-500'
                        }`} />
                        <div>
                          <span className="text-sm text-white">{task.title}</span>
                          {task.dueDate && (
                            <p className="text-xs text-white/40">
                              Due: {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
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
                    <Link href="/dashboard/tasks" className="text-sm text-[#4169E1] hover:underline block mt-2">
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

      {/* Right Sidebar - Activity Timeline */}
      <div className="hidden xl:block w-72 shrink-0">
        <div className="sticky top-6">
          <ActivityTimeline />
        </div>
      </div>
    </div>
  )
}
