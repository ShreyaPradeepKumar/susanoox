# Task Tracker

A simple task list built with React, JavaScript and Tailwind CSS. Add a task,
tick it off, delete it, and filter by status.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

`npm install` only needs running once. To stop the dev server, press
`Ctrl + C` in the terminal running it.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run demo` | Print a run-through of the five task functions |
| `npm run build` | Create a production copy in `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Check the code for problems |

## How it fits together

`App.jsx` owns all the data in four pieces of React state — the task list, the
text in the input, the selected filter, and the error message. The five
components in `components/` only display that data and report clicks back up
to `App`. Data flows one way: downward through props, upward through callbacks.

The task logic lives in `src/tasks.js` as plain JavaScript functions, kept
separate from React so they can be tested and reused on their own:

| Function | Purpose |
| --- | --- |
| `addTask(tasks, title)` | Adds a task, trimming the title. Rejects empty or whitespace-only titles |
| `deleteTask(tasks, id)` | Removes the task with the matching id |
| `toggleTask(tasks, id)` | Flips one task between pending and completed |
| `filterTasks(tasks, status)` | Returns tasks matching `'all'`, `'pending'` or `'completed'` |
| `getCounts(tasks)` | Returns `{ total, pending, completed }` |

Every function takes the task list and returns a **new** list rather than
editing the original. React relies on this: it re-renders when it receives a
new array, and ignores the change if it gets the same one back.

## Trying the functions on their own

`demo.js` imports the five functions and runs them against sample data, printing
the result of each one. It covers adding, rejecting a blank title, toggling both
ways, showing that two tasks with identical titles stay independent, deleting,
filtering, and counting.

```bash
npm run demo
```

It is kept out of `src/` and nothing imports it, so it never runs in the browser
and never affects the app.

## Project structure

```
task-tracker/
├── index.html          page shell, contains an empty <div id="root">
├── vite.config.js      registers the react and tailwind plugins
├── demo.js             run-through of the five functions (npm run demo)
└── src/
    ├── main.jsx        entry point, renders <App />
    ├── index.css       one line: @import "tailwindcss";
    ├── tasks.js        the five task functions
    ├── App.jsx         the useState hooks and event handlers
    └── components/
        ├── TaskInput.jsx       input, Add button, error message
        ├── FilterButtons.jsx   All / Pending / Completed
        ├── TaskList.jsx        renders the list, or an empty message
        ├── TaskItem.jsx        one row: checkbox, title, Delete
        └── TaskSummary.jsx     the three counts
```

## Known limitation

Tasks are held in React state, which lives only in memory, so refreshing the
page clears the list. Saving to the browser is a later step.