import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.jsx'

const PRIORITIES = ['low', 'medium', 'high']

export default function TodoForm({ onAdd, inputRef }) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')

  const submit = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd({ text: trimmed, dueDate, priority })
    setText('')
    setDueDate('')
    setPriority('medium')
  }

  return (
    <form onSubmit={submit} className="mb-6 flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="What needs to be done?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="New task"
          className="h-10"
        />
        <Button type="submit" disabled={!text.trim()} className="h-10 px-5">
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="due-date" className="text-muted-foreground text-xs">
            Due
          </Label>
          <Input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
            className="h-8 w-auto px-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="priority" className="text-muted-foreground text-xs">
            Priority
          </Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id="priority" size="sm" className="w-28 text-xs" aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {p[0].toUpperCase() + p.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </form>
  )
}
