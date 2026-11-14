import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx'

const SHORTCUTS = [
  { keys: 'Shift + N', action: 'Focus the "new task" input' },
  { keys: '/', action: 'Focus search' },
  { keys: 'Shift + D', action: 'Toggle dark mode' },
  { keys: '?', action: 'Show / hide this help' },
  { keys: 'Esc', action: 'Close help · clear search · leave input' },
  { keys: 'Enter', action: 'Add task (in form) · Save edit (in task)' },
  { keys: 'Double-click', action: 'Edit a task' },
]

export default function ShortcutsHelp({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5" />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>Work faster without touching the mouse.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y">
          {SHORTCUTS.map(({ keys, action }) => (
            <li
              key={keys}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <kbd className="bg-muted text-muted-foreground rounded-md border px-2 py-0.5 font-mono text-xs whitespace-nowrap shadow-xs">
                {keys}
              </kbd>
              <span className="text-right">{action}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
