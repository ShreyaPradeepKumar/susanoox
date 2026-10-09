# Task 01 Completion Report

## What I built

I built a personal task tracker using React, JavaScript and Tailwind CSS.

In Task 01, I got these features working:

- **Add a task** - type a title and press Add.
- **Complete a task** - tick the checkbox on a row.
- **Reopen a task** - untick the checkbox to make it pending again.
- **Delete a task** - the Delete button on each row.
- **Filter the list** - show All, Pending, or Completed.
- **See counts** - Total, Pending and Completed numbers at the bottom of the card, which update on every change.

A new task starts as pending. The whole screen works with the keyboard.

*What I learnt here: the functions `addTask`, `toggleTask` and `deleteTask`. I learnt that a checkbox is just a boolean - ticking and unticking the same task is only flipping one value back and forth.*

## How the code is organised

The main file is `src/App.jsx`. It holds all the state and shares it with small components:

- `TaskInput` - the text box and the Add button
- `TaskList` - the list, or a message when it's empty
- `TaskItem` - one row with the checkbox, the title, and the Delete button
- `FilterButtons` - the All / Pending / Completed buttons
- `TaskSummary` - the three counts

The task logic lives in `src/tasks.js` as plain functions, kept away from React so I can test them on their own:

- `addTask` - adds a task and trims the title. Blank titles are rejected.
- `toggleTask` - flips completed on or off for one task.
- `deleteTask` - removes the task with the given id.
- `filterTasks` - returns tasks for "all", "pending" or "completed".
- `getCounts` - returns total, pending and completed as three numbers.

One rule I used everywhere: none of these functions change the list I give them. A change that works returns a brand new list. A change that is rejected (like a blank title) returns the *same* list. React re-draws when it sees a new list and ignores a change when the same list comes back.

*What I learnt here: `filterTasks` and `getCounts`. I learnt to keep logic in plain functions instead of writing it inside the component, because then I could run it from a console script and check it without opening the browser.*

## Where the data lives

All the data is in `App.jsx`, held by React state:

- the task list (`tasks`)
- the text I'm typing (`title`)
- the selected filter (`filter`)
- the validation message (`error`)

There is no second copy of the list. Every time the app draws itself, it works out the visible list on the spot with `filterTasks(tasks, filter)` and the counts with `getCounts(tasks)`. The counts always describe the whole list, not just the visible rows.

*What I learnt here: the visible list and the counts are calculated, never stored. I don't keep a "filtered list" anywhere - I filter on every draw. That way nothing can ever get out of sync.*

## What I tested

- **Blank titles** - pressing Add with an empty box shows a message and does not add a task.
- **Duplicate titles** - I can add "Learn React" twice. Each task has its own unique id, so ticking one never touches the other.
- **Keyboard** - Enter adds from the input, Tab moves through in a sensible order, and the checkbox works from the keyboard.
- **Long titles** - titles wrap onto new lines instead of pushing the Delete button off the screen.
- **Narrow screens** - at 320px wide nothing spills out of the card, and the Add button stays inside it.
- **Build and lint** - `npm run build` and `npm run lint` both pass.

*What I learnt here: `filterTasks` and `getCounts` came up again in reverse - I checked that the visible list and the counts agreed after every action I tried.*

## The review corrections

My reviewer Mr Ponperumal found five things to fix, and I fixed all of them:

1. **Add row overflowing at 320px** - the input was pushing the Add button out of the card. I added `min-w-0` so the input can shrink and the button stays inside.
2. **Long titles breaking the row** - titles with long unbroken words were shoving the controls away. I fixed the row so titles wrap and the checkbox and Delete always stay visible.
3. **Filter buttons invisible to screen readers** - I added `aria-pressed` to the All / Pending / Completed buttons so assistive tools know which one is selected.
4. **Validation message not connected** - the "please enter a task" message wasn't linked to the input. I wired it up with `aria-invalid` and `aria-describedby` so the browser reads out the error with the field.
5. **README was wrong** - it described the functions' return values wrongly and said refresh saves changes. I rewrote those parts: refresh restores the starting sample tasks and does not save user changes.

To check them, I opened the app, set DevTools to 320px width, tested every box and button with the keyboard, and ran the build again. The fixed version is the one deployed as `de3a0ca`.

*What I learnt here: the fixes were mostly about shrinking (`min-w-0`), telling screen readers what's going on, and keeping my README honest. Small changes, but they change how usable the page is.*

## Challenges I faced

The hardest part of this task wasn't the code - it was understanding what was actually happening, and I had to get the same ideas explained to me again and again before they stuck.

1. **React state and why the screen redraws.** My biggest struggle. For a long time I didn't get where the data lived or why changing something updated the page. I kept asking for the same explanation in plainer words until it finally clicked: "state changes, React redraws the component." Now I see the whole app as state in `App.jsx` flowing down into the components.

2. **Writing the functions.** I expected the logic to be the easy part, but turning "add a task" into a working function took many tries. I had to learn to take the list *in*, return the result *out*, never touch the input, trim the title, reject blank titles, and leave every other task alone. The trickiest rule - return a **new** list when it works, return the **same** list when it's rejected - took the longest to trust; I kept accidentally changing the original list instead of returning a copy. What finally reinforced it was writing tests that check the original list is still intact afterwards.

3. **Filters don't delete anything.** It genuinely confused me that the counts could say 4/2/2 while the list showed 0 tasks. I kept thinking I'd lost data. The rule - "counts describe every saved task, 'Showing X of Y' describes what's visible" - needed repeating before I stopped worrying.

4. **Getting the fonts and text right.** Making the text look good - sizes, weights, wrapping, readable labels - was fiddlier than I expected. I spent time adjusting font classes one by one until rows looked clean and priorities were readable, not just coloured.

5. **Understanding Tailwind while integrating it with React.** Tailwind was completely new to me, and learning it at the same time as React made it twice as confusing. Writing styles as utility classes right inside the components felt messy - I kept asking "where does the CSS actually live?" - and I had to learn to read a long row of class names like it was a stylesheet. It finally clicked when I accepted that the styling lives in the class attribute, and React's only job is deciding which components appear.

## What I used OpenCode for

I used OpenCode (a coding assistant) throughout, especially for the tricky parts - the responsive layout at 320px, the accessibility fixes, and understanding how React state flows one way through the components.

I didn't accept its suggestions blindly. I read what it produced, ran the build, tried the clicks in the browser, and only kept something when I could explain why it worked. If I didn't understand a suggestion, I asked it to explain again in plain words before using it.

*What I learnt overall in Task 01: my first version worked, but the review taught me that working is not the same as finished. Proper shrinking layout, screen-reader support, and honest docs are part of the job, and making the logic plain functions is what made all of it testable.*

## Known issues

The app does not save anything. When I refresh the page, my changes are lost and the starting sample tasks come back. That is expected for this exercise - storage, databases and backends are outside the scope - but worth knowing before relying on it.

## Links

- GitHub repository: https://github.com/ShreyaPradeepKumar/susanoox
- Commit reviewed for Task 01: `de3a0ca` (task 1 correction completion)
- Deployed application: https://ShreyaPradeepKumar.github.io/susanoox/