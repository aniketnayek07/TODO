import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Keyboard, Moon, Search, Sun } from 'lucide-react'
import TodoForm from './components/TodoForm.jsx'
import TodoItem from './components/TodoItem.jsx'
import Stats from './components/Stats.jsx'
import ShortcutsHelp from './components/ShortcutsHelp.jsx'
import Performance from './components/Performance.jsx'
import { Button } from './components/ui/button.jsx'
import { Input } from './components/ui/input.jsx'
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs.jsx'
import { TooltipProvider } from './components/ui/tooltip.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { cn } from '@/lib/utils'

const FILTERS = ['all', 'active', 'done']

function isOverdue(todo) {
  if (!todo.dueDate || todo.done) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(todo.dueDate + 'T00:00:00') < today
}

export default function App() {
  const [todos, setTodos] = useLocalStorage('todos', [])
  const [activity, setActivity] = useLocalStorage('activity', [])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [draggedId, setDraggedId] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [theme, setTheme] = useLocalStorage(
    'theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  const todoInputRef = useRef(null)
  const searchInputRef = useRef(null)

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const target = e.target
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if (e.key === 'Escape') {
        if (showHelp) setShowHelp(false)
        else if (typing) {
          if (target === searchInputRef.current) setQuery('')
          target.blur()
        }
        return
      }

      // Don't hijack keys while typing, or with Ctrl/Alt/Meta chords
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === '?') {
        e.preventDefault()
        setShowHelp((s) => !s)
      } else if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.shiftKey && e.key === 'N') {
        e.preventDefault()
        todoInputRef.current?.focus()
      } else if (e.shiftKey && e.key === 'D') {
        e.preventDefault()
        toggleTheme()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showHelp, setTheme])

  const addTodo = ({ text, dueDate, priority }) => {
    setTodos((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        dueDate: dueDate || null,
        priority,
        done: false,
        createdAt: Date.now(),
      },
      ...prev,
    ])
  }

  const toggleTodo = (id) => {
    const target = todos.find((t) => t.id === id)
    if (!target) return

    // Log completions for performance history (kept even if the task is later deleted)
    if (!target.done) {
      setActivity((prev) => [
        ...prev.filter((a) => a.todoId !== id),
        {
          todoId: id,
          completedAt: Date.now(),
          createdAt: target.createdAt,
          dueDate: target.dueDate,
          priority: target.priority,
        },
      ])
    } else {
      setActivity((prev) => prev.filter((a) => a.todoId !== id))
    }

    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const deleteTodo = (id) => setTodos((prev) => prev.filter((t) => t.id !== id))

  const editTodo = (id, text) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)))

  const clearCompleted = () => setTodos((prev) => prev.filter((t) => !t.done))

  // Subtask operations
  const addSubtask = (todoId, text) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, subtasks: [...(t.subtasks ?? []), { id: crypto.randomUUID(), text, done: false }] }
          : t,
      ),
    )

  const toggleSubtask = (todoId, subId) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? {
              ...t,
              subtasks: (t.subtasks ?? []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
            }
          : t,
      ),
    )

  const deleteSubtask = (todoId, subId) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subId) }
          : t,
      ),
    )

  // Drag and drop reordering (live reorder while dragging)
  const handleDragStart = (id, e) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnter = (targetId) => {
    if (!draggedId || draggedId === targetId) return
    setTodos((prev) => {
      const copy = [...prev]
      const from = copy.findIndex((t) => t.id === draggedId)
      const to = copy.findIndex((t) => t.id === targetId)
      if (from === -1 || to === -1) return prev
      const [moved] = copy.splice(from, 1)
      copy.splice(to, 0, moved)
      return copy
    })
  }

  const handleDragEnd = () => setDraggedId(null)

  const counts = useMemo(() => {
    const active = todos.filter((t) => !t.done).length
    return {
      total: todos.length,
      active,
      done: todos.length - active,
      overdue: todos.filter(isOverdue).length,
    }
  }, [todos])

  const visible = useMemo(() => {
    let list = todos
    if (filter === 'active') list = list.filter((t) => !t.done)
    else if (filter === 'done') list = list.filter((t) => t.done)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((t) => t.text.toLowerCase().includes(q))
    }
    return list
  }, [todos, filter, query])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">📝 My TODOs</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Everything you need to get done, in one place.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="icon"
                title="Your performance"
                aria-label="Your performance"
                onClick={() => setShowStats(true)}
              >
                <BarChart3 className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                title="Keyboard shortcuts (?)"
                aria-label="Keyboard shortcuts"
                onClick={() => setShowHelp(true)}
              >
                <Keyboard className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                title="Toggle dark mode (Shift+D)"
                aria-label="Toggle dark mode"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </div>
          </header>

          <Stats
            total={counts.total}
            done={counts.done}
            active={counts.active}
            overdue={counts.overdue}
          />

          <TodoForm onAdd={addTodo} inputRef={todoInputRef} />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                ref={searchInputRef}
                placeholder="Search tasks… (press /)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                aria-label="Search tasks"
              />
            </div>

            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                {FILTERS.map((f) => (
                  <TabsTrigger key={f} value={f} className="px-3">
                    {f[0].toUpperCase() + f.slice(1)}
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold',
                        filter === f ? 'bg-primary/15 text-primary' : 'bg-background/60',
                      )}
                    >
                      {f === 'all' ? counts.total : f === 'active' ? counts.active : counts.done}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {counts.done > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCompleted} className="text-muted-foreground">
                Clear completed ({counts.done})
              </Button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center">
              <span className="text-muted-foreground mb-2 text-3xl">🗒️</span>
              <p className="text-muted-foreground text-sm">
                {todos.length === 0
                  ? 'Nothing here yet — add your first task above!'
                  : 'No tasks match your filter or search.'}
              </p>
              {todos.length === 0 && (
                <p className="text-muted-foreground/70 mt-1 text-xs">
                  Tip: press <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">Shift</kbd> +{' '}
                  <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">N</kbd> to jump to the input
                </p>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                  onAddSubtask={addSubtask}
                  onToggleSubtask={toggleSubtask}
                  onDeleteSubtask={deleteSubtask}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedId === todo.id}
                />
              ))}
            </ul>
          )}

          <footer className="text-muted-foreground mt-10 text-center text-xs">
            Press <strong className="text-foreground">?</strong> for keyboard shortcuts · Tasks are saved in your
            browser
          </footer>
        </main>

        <ShortcutsHelp open={showHelp} onClose={() => setShowHelp(false)} />
        <Performance
          open={showStats}
          onClose={() => setShowStats(false)}
          todos={todos}
          activity={activity}
        />
      </div>
    </TooltipProvider>
  )
}
