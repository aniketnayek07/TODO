import { useMemo } from 'react'
import { BarChart3, CalendarCheck, Flame, Target, Timer } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet.jsx'
import { Badge } from './ui/badge.jsx'
import { Progress } from './ui/progress.jsx'
import { cn } from '@/lib/utils'

const PRIORITY_LABEL = { high: 'High', medium: 'Med', low: 'Low' }

const startOfDay = (value) => {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

const dayNumber = (value) => Math.floor(startOfDay(value).getTime() / 86400000)

function formatDuration(ms) {
  if (ms < 3600000) return `${Math.max(1, Math.round(ms / 60000))}m`
  if (ms < 48 * 3600000) return `${(ms / 3600000).toFixed(1)}h`
  return `${(ms / 86400000).toFixed(1)}d`
}

function computeStats(todos, activity) {
  // Merge logged completions with currently-done tasks (legacy data has no log entry)
  const seen = new Set()
  const entries = []
  for (const a of activity) {
    if (!seen.has(a.todoId)) {
      entries.push(a)
      seen.add(a.todoId)
    }
  }
  for (const t of todos) {
    if (t.done && !seen.has(t.id)) {
      entries.push({
        todoId: t.id,
        completedAt: t.completedAt ?? t.createdAt,
        createdAt: t.createdAt,
        dueDate: t.dueDate,
        priority: t.priority,
      })
    }
  }

  const total = todos.length
  const done = todos.filter((t) => t.done).length
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100)

  // Last 7 days (oldest → today)
  const today = startOfDay(new Date())
  const week = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    const count = entries.filter((e) => e.completedAt >= day.getTime() && e.completedAt < next.getTime()).length
    week.push({
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      dateLabel: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count,
      isToday: i === 0,
    })
  }
  const weekTotal = week.reduce((sum, d) => sum + d.count, 0)

  // Streaks — consecutive days with at least one completion
  const daySet = new Set(entries.map((e) => dayNumber(e.completedAt)))
  const sortedDays = [...daySet].sort((a, b) => a - b)
  const todayNum = dayNumber(new Date())

  let streak = 0
  let cursor = daySet.has(todayNum) ? todayNum : todayNum - 1
  while (daySet.has(cursor)) {
    streak++
    cursor--
  }

  let bestStreak = 0
  let run = 0
  let prevDay = null
  for (const day of sortedDays) {
    run = prevDay !== null && day === prevDay + 1 ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
    prevDay = day
  }

  // On-time completions (only tasks that had a due date)
  const withDue = entries.filter((e) => e.dueDate)
  const onTime = withDue.filter(
    (e) => e.completedAt <= new Date(e.dueDate + 'T23:59:59').getTime(),
  )
  const onTimePct = withDue.length === 0 ? null : Math.round((onTime.length / withDue.length) * 100)

  // Average time from creation to completion
  const timed = entries.filter((e) => e.createdAt && e.completedAt >= e.createdAt)
  const avgMs = timed.length === 0 ? null : timed.reduce((sum, e) => sum + (e.completedAt - e.createdAt), 0) / timed.length

  // Completions by priority
  const byPriority = { high: 0, medium: 0, low: 0 }
  for (const e of entries) {
    if (byPriority[e.priority] !== undefined) byPriority[e.priority]++
  }

  return {
    total,
    done,
    completionRate,
    week,
    weekTotal,
    maxWeek: Math.max(1, ...week.map((d) => d.count)),
    streak,
    bestStreak,
    onTimePct,
    avgMs,
    byPriority,
    completedTotal: entries.length,
  }
}

export default function Performance({ open, onClose, todos, activity }) {
  const s = useMemo(() => computeStats(todos, activity), [todos, activity])

  const cards = [
    {
      label: 'Completion rate',
      value: `${s.completionRate}%`,
      icon: Target,
      hint: `${s.done} of ${s.total} tasks done`,
    },
    {
      label: 'Last 7 days',
      value: s.weekTotal,
      icon: CalendarCheck,
      hint: 'tasks completed',
    },
    {
      label: 'Current streak',
      value: s.streak,
      icon: Flame,
      hint: s.streak === 1 ? 'day in a row' : 'days in a row',
    },
    {
      label: 'On-time rate',
      value: s.onTimePct === null ? '—' : `${s.onTimePct}%`,
      icon: Timer,
      hint: s.onTimePct === null ? 'no due dates yet' : 'completed before due date',
    },
  ]

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Your performance
          </SheetTitle>
          <SheetDescription>How you've been getting things done.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {cards.map(({ label, value, icon: Icon, hint }) => (
              <div key={label} className="bg-muted/40 rounded-lg border p-3">
                <Icon className="text-muted-foreground mb-2 size-4" />
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                <div className="text-[11px] font-medium tracking-wide uppercase">{label}</div>
                <div className="text-muted-foreground text-[11px]">{hint}</div>
              </div>
            ))}
          </div>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Last 7 days</h3>
            {s.completedTotal === 0 ? (
              <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
                No completions yet — finish a task to start tracking your progress.
              </p>
            ) : (
              <div className="flex items-end gap-1.5">
                {s.week.map((day) => (
                  <div key={day.dateLabel} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="flex h-24 w-full items-end justify-center"
                      title={`${day.count} completed on ${day.dateLabel}`}
                    >
                      <div
                        className={cn(
                          'w-full max-w-9 rounded-t-sm transition-all',
                          day.count === 0 ? 'bg-muted' : day.isToday ? 'bg-primary' : 'bg-primary/45',
                        )}
                        style={{
                          height:
                            day.count === 0 ? '4px' : `${Math.max(8, (day.count / s.maxWeek) * 100)}%`,
                        }}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-[10px]',
                        day.isToday ? 'text-foreground font-semibold' : 'text-muted-foreground',
                      )}
                    >
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Completed by priority</h3>
            <div className="flex flex-col gap-2">
              {['high', 'medium', 'low'].map((p) => {
                const count = s.byPriority[p] ?? 0
                return (
                  <div key={p} className="flex items-center gap-2">
                    <Badge variant={p} className="w-14 justify-center">
                      {PRIORITY_LABEL[p]}
                    </Badge>
                    <Progress
                      value={s.completedTotal ? (count / s.completedTotal) * 100 : 0}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-muted-foreground w-5 text-right text-xs tabular-nums">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <p className="text-muted-foreground border-t pt-3 text-xs">
            {s.avgMs !== null && (
              <>
                Average time to complete:{' '}
                <strong className="text-foreground">{formatDuration(s.avgMs)}</strong> ·{' '}
              </>
            )}
            Best streak: <strong className="text-foreground">{s.bestStreak}</strong>{' '}
            {s.bestStreak === 1 ? 'day' : 'days'} · Total completed:{' '}
            <strong className="text-foreground">{s.completedTotal}</strong>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
