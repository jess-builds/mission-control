import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAllDocuments } from '@/lib/documents'
import { getAllTasks } from '@/lib/tasks'
import { getRecentEntries, getTodayDate } from '@/lib/journal'
import Link from 'next/link'
import { FileText, CheckSquare, BookOpen, Clock, Activity, TrendingUp } from 'lucide-react'
import ActivityTimeline from '@/components/dashboard/ActivityTimeline'

export default function DashboardPage() {
  const documents = getAllDocuments()
  const tasks = getAllTasks()
  const recentJournals = getRecentEntries(5)
  const today = getTodayDate()

  const taskStats = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  const myTasks = tasks.filter(t => t.assignee === 'armaan' && t.status !== 'done')
  const jessTasks = tasks.filter(t => t.assignee === 'jess' && t.status !== 'done')

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, Armaan</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening in your 2nd brain.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.todo + taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {taskStats.done} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Journal Entries
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentJournals.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Backlog
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.backlog}</div>
            <p className="text-xs text-muted-foreground mt-1">tasks waiting</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Your Tasks</CardTitle>
            <CardDescription>Tasks assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active tasks. Nice work!</p>
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

        {/* Jess's Tasks */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Jess&apos;s Tasks</CardTitle>
            <CardDescription>Tasks I&apos;m working on for you</CardDescription>
          </CardHeader>
          <CardContent>
            {jessTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active tasks for Jess.</p>
            ) : (
              <div className="space-y-3">
                {jessTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === 'in-progress' ? 'bg-emerald-500' : 'bg-slate-500'
                      }`} />
                      <span className="text-sm">{task.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Documents</CardTitle>
            <CardDescription>Latest updates to your knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No documents yet. Create your first one!</p>
            ) : (
              <div className="space-y-3">
                {documents.slice(0, 5).map(doc => (
                  <Link
                    key={doc.slug}
                    href={`/dashboard/documents/${doc.slug}`}
                    className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{doc.updatedAt}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Journal */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Journal</CardTitle>
            <CardDescription>Daily summaries and reflections</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJournals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No journal entries yet.</p>
            ) : (
              <div className="space-y-3">
                {recentJournals.map(entry => (
                  <Link
                    key={entry.date}
                    href={`/dashboard/journal/${entry.date}`}
                    className="block hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {entry.date === today ? 'Today' : entry.date}
                      </span>
                    </div>
                    {entry.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {entry.summary}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>What&apos;s been happening</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{taskStats.done}</p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{taskStats.inProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <FileText className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{documents.length}</p>
            <p className="text-xs text-muted-foreground">Documents</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <BookOpen className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{recentJournals.length}</p>
            <p className="text-xs text-muted-foreground">Journal Entries</p>
          </div>
        </div>
      </div>
    </div>
  )
}
