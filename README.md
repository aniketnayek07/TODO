# TODO

A modern, feature-rich todo list web app built with **React + Vite**, **Tailwind CSS v4**, and **shadcn/ui**.

## ✨ Features

- **Tasks** — add, edit (double-click), complete, delete, drag-and-drop reorder
- **Priorities & due dates** — High/Med/Low badges, overdue highlighting
- **Subtasks** — expandable checklist under each task with progress counts (e.g. `1/2`)
- **Search & filters** — All / Active / Done tabs with live counts
- **Performance sheet** — completion rate, 7-day activity chart, streaks, on-time rate, priority breakdown
- **Dark mode** — persisted, respects system preference
- **Keyboard shortcuts**
  - `Shift + N` — new task
  - `/` — search
  - `Shift + D` — toggle dark mode
  - `?` — shortcuts help
  - `Esc` — close / clear / blur
- **Persistence** — everything saved in `localStorage`, including completion history

## 🛠 Tech stack

| Layer | Tech |
|-------|------|
| UI | React 18, shadcn/ui (Radix UI), lucide-react |
| Styling | Tailwind CSS v4 |
| Build | Vite 5 |
| State | React hooks + localStorage |

## 🚀 Getting started

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## 📁 Project structure

```
src/
├── App.jsx                  # state, filters, search, drag-and-drop, shortcuts
├── index.css                # Tailwind v4 + shadcn theme tokens
├── components/
│   ├── TodoForm.jsx         # add-task form (text, due date, priority)
│   ├── TodoItem.jsx         # task row + subtasks
│   ├── Stats.jsx            # compact stats card
│   ├── Performance.jsx      # performance dashboard (Sheet)
│   ├── ShortcutsHelp.jsx    # shortcuts dialog
│   └── ui/                  # shadcn primitives (button, input, sheet, …)
├── hooks/useLocalStorage.js
└── lib/utils.js             # cn() helper
```

## 📄 License

MIT
