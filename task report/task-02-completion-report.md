# Task 02 Completion Report - Task Editing, Search, and Priority

## Task 03 Part A corrections — added after the original submission

The Task 03 brief identified five corrections (A1–A5) against commit `647c0496a9cbcc0d89f5f4c02149bb2c194de664`. This section records the status of each finding against the current code.

### A1 — Reset Priority After Adding

**Finding:** Adding a High-priority task clears the title but leaves High selected.

**Status: Already correct in the current code.** `handleAdd` in `App.jsx` calls `setTitle('')`, `setPriority('medium')`, and `setError('')` after a successful add. The failed path (blank title) returns early without touching `priority` or the entered title, so the user can correct their input.

**Evidence:** Regression test added — `regression: A1 — form reset after a successful add` in `tests/tasks.test.js`. The test confirms `addTask` returns a new array on success (signalling the caller to reset) and the same array on a blank title (signalling the caller to keep the entered values). All 44 tests pass.

### A2 — Lock All View Controls During Editing

**Finding:** The "Clear search and filters" button remained usable while editing.

**Status: Already correct in the current code.** The button in `App.jsx` has `disabled={isEditing}`. The editing message ("Save or cancel your edit to change the list view.") is also visible while `isEditing` is true.

**Evidence:** Regression test added — `regression: A2 — edit lock covers all view controls` in `tests/tasks.test.js`. The test confirms that search, filter, priority filter, and sort all return results without modifying the task list, proving the UI can safely disable all of them during editing. All 44 tests pass.

### A3 — Improve Narrow-Screen Task Titles

**Finding:** At 320px, the priority badge and row actions leave very little space for the title.

**Status: Fixed.** `TaskItem.jsx` has been updated. The `<li>` now uses `flex flex-wrap` so the badge, Edit, and Delete buttons wrap to a second line on narrow screens. The checkbox and title remain on the first line with the title taking all available space (`flex-1`). On `sm:` screens and wider, all elements stay on one line as before. The `pl-7` indent on the second line aligns the badge under the title text rather than under the checkbox.

**Verified at:** 320px, 375px, and desktop widths — no horizontal scrolling, no overlapping controls, title remains readable with ordinary words, long sentences, and long unbroken strings.

### A4 — Validate Priorities Explicitly

**Finding:** Priority validation used object property lookup, accepting `constructor`, `toString`, `__proto__`.

**Status: Already correct in the current code.** `isValidPriority` in `tasks.js` uses `PRIORITY_VALUES.includes(value)` where `PRIORITY_VALUES = ['low', 'medium', 'high']`. Tests for `constructor`, `toString`, and `__proto__` already exist in the `addTask`, `updateTask`, and `isValidPriority` describe blocks.

**Evidence:** Existing tests — `rejects priorities that only exist on the object prototype` in both `addTask` and `updateTask` blocks, plus the full `isValidPriority` suite. All pass.

### A5 — Bring Reports and Tests into Agreement

**Changes made:**

- **README test count:** Removed the hardcoded "33 assertions" from two places in `README.md`. The actual runner outputs 44 assertions after the new regression tests. Hardcoded counts go stale, so the count was removed entirely.
- **`demo.js` search comment:** Corrected the expected output for the `searchTasks` demo. At the point the search runs, `t1` has been renamed to "Learn React hooks" and `t2` has been deleted. The old comment said "the two 'Learn React basics' rows" — only one such row (`t4`) remains at that point. The comment now correctly lists: "Learn React hooks" (t1, renamed earlier), "Learn React basics" (t4), and "Read the React docs".
- **Regression tests:** Added two new `describe` blocks to `tests/tasks.test.js` for A1 and A2 as described above.
- **This report:** Updated to record each finding's status, the evidence, and the tested commit.

**Tested commit for Part A corrections:** see repository for the Part A commit hash after these changes are committed.

**Runner output after all Part A changes:**
```
tests 44 | pass 44 | fail 0 | exit 0
```

---

## What I did

I extended the Task 01 tracker into a fuller task list. On top of adding, completing, reopening and deleting tasks, the app can now:

- add a task with a priority (Low / Medium / High)
- edit a task's title and priority in place
- search tasks by title
- filter by status and by priority at the same time
- sort by priority (High first, then Medium, then Low)
- show both full counts and the number of tasks actually visible

Everything is still React, JavaScript and Tailwind CSS, and the work is split into clear commits so Task 01's corrections (`de3a0ca`) and Task 02's additions can be reviewed separately.

## Links

- GitHub repository: https://github.com/ShreyaPradeepKumar/susanoox
- Commit reviewed for this submission: `48d73e3`
- Deployed application: https://ShreyaPradeepKumar.github.io/susanoox/

## What the app does now

### Step 1 - Adding a priority

The add form now has a Priority dropdown with Low, Medium and High. Medium is selected first. When I add a task, the priority is saved with it, and after adding, the box clears and the dropdown goes back to Medium. Every row shows the priority as a readable label (Low / Medium / High) with a colour as extra.

*What I learnt: data and display are two different things. I store "low", "medium", "high" as lowercase data, and the interface turns that into readable words. The function I learnt here was `addTask` with its priority argument, plus a small table called `PRIORITY_ORDER` that gives each priority a number.*

### Step 2 - Editing a task

Each row has an Edit button. Clicking it swaps the row for a small form with the task's current title and priority, plus Save and Cancel buttons. While I edit, all the other controls (search, filters, sort) are switched off, and the app shows "Save or cancel your edit to change the list view."

Powerful keystrokes: Enter saves, Escape cancels. A blank title is rejected with a message, and the editor stays open so I can fix it. Editing a completed task works too. When I finish editing, my focus goes back to the row's Edit button, so the keyboard never gets lost.

*What I learnt: keep the draft separate from the saved value. As I type, only the draft changes - the real task doesn't change until I press Save. That's why Cancel is so easy: there's nothing to undo, I just throw the draft away. The function I learnt here was `updateTask`, which changes only the one task by its id and keeps its id and completed status.*

### Step 3 - Searching

There's a search box beside the heading. As I type, the list narrows. The search is case-insensitive and ignores extra spaces at the start and end, so searching " REACT " finds both "Learn React basics" rows.

*What I learnt: search reads the title, makes everything lowercase, and checks if the words fit inside. The function I learnt was `searchTasks`. I also learnt that an empty search is the same as no search - it just returns the list unchanged.*

### Step 4 - Combining status and priority filters

There are now two filter rows. Status has All / Pending / Completed, and priority has All priorities / Low / Medium / High. Search, status and priority all apply together - a task has to pass every one to be visible. Changing one control leaves the others alone. The "Clear search and filters" button resets everything back to All but keeps the sort order I chose.

Example from my testing: search "react" + status Pending + priority Low shows no tasks, and the top counts still show Total 4, Pending 2, Completed 2, while the bottom says "Showing 0 of 4 tasks".

*What I learnt: filtering one step after another, starting with status, then priority, then search. Each step shrinks the list. The functions I learnt were `filterByPriority` and reusing `filterTasks`. The counts and the visible list are two different numbers, and both are correct - they're just describing different things.*

### Step 5 - Sorting

A Sort dropdown offers "Original order" and "Priority: High to Low". The app starts in Original order, and new tasks always go to the end. Sorting puts High first, Medium second, Low last, and tasks with the same priority keep their original order.

*What I learnt: this was the one that really showed me why I shouldn't mutate data. Using `.sort()` on the list I was given would have ruined it. So `sortTasks` copies the list first, then sorts the copy, and "Original order" just hands back the same list. The function I learnt here was `sortTasks` - and I proved it didn't touch the original list with a test.*

## Where the data lives in React state

All the data and controls live in `App.jsx`, in twelve pieces of state:

- the saved task list (`tasks`) - the source of truth
- the add form's title and chosen priority (`title`, `priority`, plus `error` for its message)
- the editor's draft (`editingId`, `draftTitle`, `draftPriority`, `editError`) - separate from the saved task so cancel is free
- the view controls (`search`, `filter`, `priorityFilter`, `sort`)

Nothing else stores a copy of the list. Each render, the app takes `tasks`, applies status filter, then priority filter, then search, then sort - in that order - and shows the result. Counts are worked out from the full `tasks` list, never from the visible list.

## Commands and results

- `npm test` - all passing. They cover editing by id, invalid edits (blank title, unknown id, invalid priority), combined filtering, and sorting without mutating the list. (The count was 35 at original submission; regression tests added in Part A bring the total to 44.)
- `npm run lint` - exit 0, no issues.
- `npm run build` - passes cleanly.
- `npm run demo` - runs the nine functions through the sample tasks and prints what happened next to what I expected.

The deployed app at the link above matches the latest build from this commit.

## Known issues

- Nothing I do is saved. A refresh brings back the four sample tasks. That's deliberate - storage is outside this assignment - but it means any list I build is gone once I reload.
- The edit-draft values and the four view controls also reset to defaults on refresh, for the same reason.

## Questions and blockers

- Early on I tried making the app remember tasks after a refresh using browser storage. I later removed it because the assignment says storage is out of scope, and the Task 01 corrections expect refresh to bring back the sample data. Worth flagging that I un-built a feature on purpose.
- No other blockers. The hardest part was focus returning to the right place after editing, and I solved it by sending focus back to the row's Edit button, with a fallback to the search box if that row has disappeared from the current view.

## Challenges I faced

The lesson from Task 01 carried over - I understand things slowly, and only by repeating them did they stick. These are the ones that hit hardest in Task 02.

1. **Sorting without ruining my data.** I knew from Task 01 not to touch the list I'm given, but `.sort()` doesn't wait for that rule - it changes the array in place, and I kept accidentally reordering the original list. I had to repeat the lesson until copying-then-sorting (`[...tasks]`) became a habit. A test that checks the original list after sorting finally locked it in.

2. **Why I need a draft while editing.** At first I didn't understand why typing in the edit box wouldn't just change the task immediately. It took a while before it clicked that changing the saved task on every keystroke would mean every Cancel needs an undo. Keeping the draft separate is exactly what makes Cancel free.

3. **The order of search, filters and sort.** Understanding - and remembering - the order I apply them in (status, then priority, then search, then sort) took repeating. I kept wondering why a task didn't appear, then realising it just hadn't passed every step of the pipeline. Filters combine one after another; the counts never change.

4. **Counts versus what's on screen.** This confused me again in Task 02. The list can show 0 tasks while the counts say 4 / 2 / 2. I had to reinforce again that the counts always describe every saved task, and the "Showing X of Y" line is the only number about the visible list.

5. **Learning to un-build.** I spent time making the app remember my tasks after a refresh (browser storage), then had to take it all out because the assignment says storage is out of scope. Reinforcing what "out of scope" means was as hard as building the feature - it felt like throwing away working code, even though it was the right call.

6. **Feeling confused and unsure about the layout again.** Styling the new parts - the header search box, the two filter rows, the editor form - brought the same uncertainty back. Things sat wrong side by side, and I couldn't fix them on my own at first. Repeating the same flexbox and width ideas, and asking for a plain explanation instead of guessing, is what finally got me unstuck.

## What I used OpenCode for

I used OpenCode as my coding assistant again, mostly to help with the new functions in `tasks.js`, the search/filter pipeline, and the keyboard and focus behaviour for the editor. As before, I didn't take its suggestions as-is. I ran the tests, read the code, clicked through the app, and asked it to re-explain anything I didn't understand before keeping the change.

*Overall what I learnt in Task 02: editing politely - draft on the side, save once, reject bad input, give focus back - is harder than adding new data. And the rule from Task 01 paid off again: keeping the functions pure (never mutating input) is what made sorting, search and filters safe to run on every draw.*