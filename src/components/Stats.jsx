import { Card, CardContent } from './ui/card.jsx'
import { Progress } from './ui/progress.jsx'
import { cn } from '@/lib/utils'

export default function Stats({ total, done, active, overdue }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const items = [
    { label: 'Total', value: total },
    { label: 'Active', value: active },
    { label: 'Done', value: done },
    { label: 'Overdue', value: overdue, danger: overdue > 0 },
  ]

  return (
    <Card className="mb-6 gap-0 py-4">
      <CardContent className="px-5">
        <div className="grid grid-cols-4 gap-2 text-center max-sm:grid-cols-2 max-sm:gap-4">
          {items.map(({ label, value, danger }) => (
            <div key={label}>
              <div className={cn('text-2xl font-bold tabular-nums', danger && 'text-destructive')}>
                {value}
              </div>
              <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {label}
              </div>
            </div>
          ))}
        </div>
        <Progress value={pct} className="mt-4 h-2" />
        <p className="text-muted-foreground mt-2 text-center text-xs">{pct}% complete</p>
      </CardContent>
    </Card>
  )
}
