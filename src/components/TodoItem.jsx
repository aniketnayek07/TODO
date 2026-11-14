import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  GripVertical,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { Badge } from './ui/badge.jsx'
import { Button } from './ui/button.jsx'
import { Checkbox } from './ui/checkbox.jsx'
import { Input } from './ui/input.jsx'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.jsx'
import { cn } from '@/lib/utils'

const PRIORITY_LABEL = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
}

function dueDateInfo(dueDate) {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diffDays = Math.round((due - today) / 86400000)
  let label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (diffDays === 0) label = 'Today'
  else if (diffDays === 1) label = 'Tomorrow'
  else if (diffDays === -1) label = 'Yesterday'
  return { label, overdue: diffDays < 0 }
}

export default function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const [expanded, setExpanded] = useState(false)
  const [subDraft, setSubDraft] = useState('')
  const inputRef = useRef(null)
  const liRef = useRef(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const save = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== todo.text) onEdit(todo.id, trimmed)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(todo.text)
    setEditing(false)
  }

  const subtasks = todo.subtasks ?? []
  const doneSubtasks = subtasks.filter((s) => s.done).length
  const info = dueDateInfo(todo.dueDate)
  const createdAt = new Date(todo.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  const submitSubtask = (e) => {
    e.preventDefault()
    const trimmed = subDraft.trim()
    if (!trimmed) return
    onAddSubtask(todo.id, trimmed)
    setSubDraft('')
  }

  return (
    <li
      ref={liRef}
      onDragEnter={() => onDragEnter(todo.id)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      className={cn(
        'bg-card group flex flex-col overflow-hidden rounded-xl border shadow-xs transition-opacity',
        todo.done && 'opacity-75',
        isDragging && 'opacity-40 ring-2 ring-primary/40',
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <GripVertical
          draggable={!editing}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', todo.id)
            if (liRef.current) e.dataTransfer.setDragImage(liRef.current, 24, 24)
            onDragStart(todo.id, e)
          }}
          className="text-muted-foreground/60 size-4 shrink-0 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        />

        <Checkbox
          checked={todo.done}
          onCheckedChange={() => onToggle(todo.id)}
          aria-label={`Mark "${todo.text}" as ${todo.done ? 'active' : 'done'}`}
        />

        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') cancel()
              }}
              className="h-8 text-sm"
              aria-label="Edit task text"
            />
          ) : (
            <button
              type="button"
              title="Double-click to edit"
              onDoubleClick={() => setEditing(true)}
              className={cn(
                'block w-full cursor-pointer text-left text-sm font-medium wrap-break-word',
                todo.done && 'text-muted-foreground line-through',
              )}
            >
              {todo.text}
            </button>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant={todo.priority}>{PRIORITY_LABEL[todo.priority] ?? todo.priority}</Badge>
            {info && (
              <Badge variant={info.overdue && !todo.done ? 'destructive' : 'outline'} className="gap-1">
                <CalendarDays />
                {info.label}
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className={cn(
                'text-muted-foreground h-5 gap-1 rounded-md border px-1.5 py-0 text-[11px] font-medium',
                subtasks.length > 0 && doneSubtasks === subtasks.length && 'text-emerald-600 dark:text-emerald-400',
              )}
              title="Show / hide subtasks"
            >
              {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              <ListChecks className="size-3" />
              {subtasks.length > 0 ? `${doneSubtasks}/${subtasks.length}` : 'Subtasks'}
            </Button>
            <span className="text-muted-foreground/70 text-[11px]">created {createdAt}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {!editing && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground size-8"
                  onClick={() => setEditing(true)}
                  aria-label="Edit task"
                >
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                onClick={() => onDelete(todo.id)}
                aria-label="Delete task"
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3 pt-2 pb-2.5 pl-10">
          {subtasks.length > 0 && (
            <ul className="mb-1.5 flex flex-col gap-0.5">
              {subtasks.map((sub) => (
                <li
                  key={sub.id}
                  className="group/sub hover:bg-muted/60 flex items-center gap-2 rounded-md px-1 py-0.5"
                >
                  <Checkbox
                    checked={sub.done}
                    onCheckedChange={() => onToggleSubtask(todo.id, sub.id)}
                    className="size-3.5"
                    aria-label={`Mark subtask "${sub.text}" as ${sub.done ? 'active' : 'done'}`}
                  />
                  <span
                    className={cn(
                      'flex-1 text-xs wrap-break-word',
                      sub.done && 'text-muted-foreground line-through',
                    )}
                  >
                    {sub.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteSubtask(todo.id, sub.id)}
                    className="text-muted-foreground/60 hover:text-destructive opacity-0 transition-opacity group-hover/sub:opacity-100 focus-visible:opacity-100"
                    aria-label={`Delete subtask "${sub.text}"`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {subtasks.length === 0 && (
            <p className="text-muted-foreground/70 mb-1 text-[11px]">
              Break this task into smaller steps:
            </p>
          )}

          <form onSubmit={submitSubtask} className="flex items-center gap-1.5">
            <Plus className="text-muted-foreground size-3.5 shrink-0" />
            <Input
              value={subDraft}
              onChange={(e) => setSubDraft(e.target.value)}
              placeholder="Add a subtask…"
              aria-label="Add a subtask"
              className="h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0 dark:bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur()
                  setSubDraft('')
                }
              }}
            />
          </form>
        </div>
      )}
    </li>
  )
}
