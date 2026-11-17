# Task 05 Completion Report — 17 November 2026

Task 05 is complete in the existing Task Tracker application. Part A applies the Task 04 review corrections. Part B adds an opt-in local JSON Server mode for development: GET on mount and POST/PATCH/DELETE from the real interface, with validation, pending states, explicit retry/reload handling, and no change to the default browser/localStorage build.

## Part A — Task 04 review corrections

| Item | Result |
| --- | --- |
| A1: preview status and keyboard focus | Mounted `role="status"` now reads `2 sample tasks ready to preview.` or `No sample tasks available.` Retry returns focus to **Load sample tasks** only when the focused Retry control disappears; it does not steal focus after the user moves elsewhere. |
| Code/test commit | `cfad86ff027f0d5d072b152ee6ee9d604f02913c` — `fix Task 04 preview status and retry focus` |
| Report commit | `de6576a320cd6f9918b3622c3268e35455eea4d3` — `record Task 04 correction evidence and learning` |
| Browser evidence | Chrome `157.0.8103.39` with controlled HTTP `500 → 200`: two-sample case showed the status text, active element **Load sample tasks**, next Tab first preview checkbox; empty case showed `No sample tasks available.`, active element **Load sample tasks**, next Tab `BODY`. |

Full evidence remains in `task report/task-04-completion-report.md` under `Task 04 review correction (17 November 2026)`.

## Part B — Local JSON Server CRUD mode

### Setup and versions

| Item | Version / value |
| --- | --- |
| Node | `v22.12.0` |
| npm | `10.9.0` |
| Vite | `8.3.2` |
| React | `19.2.8` |
| JSON Server | `1.0.0-beta.15` (pinned in `mock/package.json`) |
| Chrome | `Google Chrome 157.0.8103.39` |
| API base | `http://127.0.0.1:3001` |
| Tasks endpoint | `http://127.0.0.1:3001/tasks` |

Install and setup commands:

```bash
cd task_1/task-tracker
npm install
npm --prefix mock install
```

Start JSON Server in one terminal:

```bash
npm --prefix mock run api
```

Start the app in local API mode in a second terminal:

```bash
npm run dev -- --mode mock
```

Then open `http://127.0.0.1:5173/susanoox/`. The first API start copies `mock/db.seed.json` to the ignored `mock/db.json`; delete `mock/db.json` to reset. Normal `npm run dev` and the deployed build stay in browser/localStorage mode and do not require JSON Server.

### Seed data and API walkthrough

Seed records:

```json
[
  { "id": "t1", "title": "Practise fetch", "completed": false, "priority": "high" },
  { "id": "t2", "title": "Check a failed save", "completed": true, "priority": "medium" },
  { "id": "t3", "title": "Practise fetch", "completed": true, "priority": "low" }
]
```

`GET /tasks` returned `200 OK` with the three seed records.

`POST /tasks` with `{"title":"Check POST","completed":false,"priority":"high"}` returned `201 Created`, including generated id `iOSK65a0OPc` and the submitted fields. The first inline `curl` attempt was a PowerShell quoting error (`Expected property name or '}' in JSON at position 1`); the successful request used `--data-binary @post-task.json`.

`PATCH /tasks/iOSK65a0OPc` with `{"title":"Check PATCH","completed":true,"priority":"low"}` returned `200 OK` with the updated record. `GET /tasks/iOSK65a0OPc` returned `200 OK`, and `DELETE /tasks/iOSK65a0OPc` returned `200 OK`. The final `GET /tasks` returned `200 OK` with only the three seed records again.

A real browser run later produced POST id `VK3dAhXAInE`, visible as row `Write CDP evidence | High | Edit | Delete`, then removed it with `DELETE /tasks/VK3dAhXAInE` (`200 OK`).

### Data flow

1. `src/main.jsx` sets `dataMode="api"` only when `import.meta.env.DEV && import.meta.env.MODE === 'mock'`. Production and ordinary dev runs use `dataMode="browser"`.
2. `App.jsx` receives `dataMode` and `taskApi`; API mode skips the browser-storage effect entirely and hides sample-task import.
3. On mount, `fetchTasks()` performs one `GET /tasks`. The response must be a valid, duplicate-free task array. A load sequence number prevents a stale GET from overwriting newer tasks.
4. Add uses `POST /tasks`; toggle and edit use `PATCH /tasks/:id` with only allow-listed fields; delete uses `DELETE /tasks/:id`. The returned task from POST/PATCH replaces the local record, so the server-generated ID and confirmed values remain authoritative.
5. Inputs and responses are validated in `src/taskCrudApi.js`. IDs are URL-encoded. Extra response fields are ignored, and invalid responses do not mutate the canonical list or drafts.
6. View controls remain pure and derived; counts describe the full API-backed list even when filters hide rows.

### Failure handling

| Failure | Visible behaviour | Recovery |
| --- | --- | --- |
| Initial GET fails | Alert: `Could not reach the local API. Check that JSON Server is running. Tasks cannot be changed until the list loads.` Controls stay disabled. | **Retry loading** repeats the GET. |
| POST/PATCH/DELETE returns HTTP error | Alert names the HTTP status and says `Your list and drafts are unchanged. You can retry this change or reload tasks.` Add title/priority or the open editor draft stays intact. | **Retry this change** repeats the identical write; **Reload tasks** fetches fresh server state. |
| Write fails at network level | Alert says `The result is uncertain. Reload tasks from the API before trying again.` | **Retry this change** is hidden because the server may have applied the write; **Reload tasks** reconciles. |
| JSON unreadable or unexpected schema | Specific `json`/`validation` failure message; no state mutation. | Definite failures can be retried; uncertain write responses offer reload. |
| Concurrent loads | Sequence guard ignores older responses. | Newer successful response remains authoritative. |

No automatic retries or polling were added.

### Verification matrix

| Requirement | Status | Evidence |
| --- | --- | --- |
| Use existing application only | Done | Changes are in `task_1/task-tracker`; no duplicate app |
| Pin and document JSON Server | Done | `mock/package.json` pins `json-server@1.0.0-beta.15`; README documents setup/reset |
| Seed with three specified records | Done | `mock/db.seed.json`; baseline GET returned `t1`, `t2`, `t3` with 200 |
| Walk through GET/POST/PATCH/DELETE | Done | Curl examples above plus real browser statuses |
| Opt-in mode only in development | Done | `import.meta.env.DEV && import.meta.env.MODE === 'mock'` in `main.jsx` |
| Default browser mode unchanged | Done | Plain dev server: no API requests, import panel present, browser-storage footer |
| API mode hides sample import | Done | Browser check found no `Load sample tasks`; UI test asserts no import region |
| API mode avoids localStorage/JSONPlaceholder | Done | UI test spies on `Storage.prototype.getItem`/`setItem`; both were never called |
| GET on mount and manual reload | Done | UI tests and real browser `Retry loading`/`Reload tasks` checks |
| Add/toggle/edit/delete mapped to CRUD | Done | UI tests and real server state checks |
| Server-generated IDs used | Done | Browser id `VK3dAhXAInE` appeared in UI and server data |
| Pending text and disabled controls | Done | `Saving new task…`, `Saving completion change…`, `Saving edit…`, `Saving deletion…` observed |
| Validation of requests and responses | Done | `tests/taskCrudApi.test.js`; invalid records and duplicate IDs rejected |
| Friendly HTTP/network/JSON/schema errors | Done | Controlled Chrome failures and unit tests |
| Retry/reload without auto retry | Done | Click-controlled retry/reload tests |
| Stale GET safety | Done | Chrome check with two held GETs; newer title persisted |
| Accessibility cues | Done | `role="status"` pending messages, `role="alert"` errors, labelled controls |
| No extra backend/state library | Done | Only pinned local mock server; no production backend |

### Automated checks

Command: `npm test`

- Node tests: `128` passed, `0` failed.
- UI tests: `34` passed, `0` failed (3 files).
- New files: `tests/taskCrudApi.test.js`, `tests/ui/local-api.test.jsx`.

Additional commands:

- `npm run lint` — passed with no output/errors.
- `npm run build` — passed; `dist/assets/index-CRm7aW1D.js` 251.05 kB (gzip 76.50 kB), `index-BzHoi5tx.css` 13.23 kB (gzip 3.62 kB).
- `npm run demo` — passed.

Implementation commit: `2477468b4f2f4272b22931e0a600af39acf8e549` — `add local JSON Server CRUD mode`.

### Real-browser evidence

Chrome `157.0.8103.39` was driven through the Chrome DevTools Protocol from `C:\Users\shrey\AppData\Local\Temp\opencode\verify\`.

Mock mode initial state, with the first GET held, showed exactly:

```text
Local API mode

Loading tasks…

Task Tracker
...
No tasks yet. Add your first one above.

Total: 0
Pending: 0
Completed: 0

Showing 0 of 0 tasks

Tasks are stored by the local JSON Server API.
```

All controls were disabled and no sample-import region was present. After releasing the GET, the three seed rows appeared with counts `Total: 3`, `Pending: 1`, `Completed: 2`, `Showing 3 of 3 tasks`.

CRUD through the real UI:

| Action | Pending text | DOM result | Response | Server check |
| --- | --- | --- | --- | --- |
| Add `Write CDP evidence`, high | `Saving new task…` | Row `Write CDP evidence | High | Edit | Delete`, `Total: 4` | `POST /tasks` 201 | GET 200, id `VK3dAhXAInE` |
| Toggle `t1` | `Saving completion change…` | t1 checkbox true, `Completed: 3` | `PATCH /tasks/t1` 200 | GET 200, `t1.completed: true` |
| Edit `t2` to `Check a failed save - edited`, high | `Saving edit…` | New title/priority visible | `PATCH /tasks/t2` 200 | GET 200, updated record |
| Delete added task | `Saving deletion…` | 3 rows, `Total: 3` | `DELETE /tasks/VK3dAhXAInE` 200 | GET 200, only seed-derived records |

Controlled HTTP 500 during an edit showed exactly:

```text
The local API rejected the change with HTTP 500.

Your list and drafts are unchanged. You can retry this change or reload tasks.

Retry this change
Reload tasks
```

The editor stayed open with `#task-edit-title = "Will fail first"` and `#task-edit-priority = "low"`. Clicking **Retry this change** succeeded: `t2` became `Will fail first` with priority `low`.

Controlled network failure showed exactly:

```text
Could not reach the local API. Check that JSON Server is running.

The result is uncertain. Reload tasks from the API before trying again.

Reload tasks
```

**Retry this change** was absent. **Reload tasks** cleared the alert and restored three enabled rows.

Fresh-load GET failure showed exactly:

```text
Could not reach the local API. Check that JSON Server is running. Tasks cannot be changed until the list loads.

Retry loading
```

Search, add, filters, and row controls stayed disabled. **Retry loading** then restored all three rows with no alerts.

Stale GET check: two loads were held; the newer response was fulfilled with `FRESH FROM NEWER GET`, then the older response with server data. The title `FRESH FROM NEWER GET` and `Total: 1` remained; the older title was absent.

Default browser mode with JSON Server stopped showed `Task Tracker`, four initial rows, `Total: 4`, `Import sample tasks`, **Load sample tasks**, and `Tasks are saved in this browser, not to an account or cloud service.` No `Local API mode` text appeared and requests to port 3001 were empty.

No application defects were found. Two harness caveats: CDP-fulfilled 500 responses needed `Access-Control-Allow-Origin: *` to avoid being converted into CORS network errors, and `--watch` did not see an external `Copy-Item` overwrite, so JSON Server was restarted after seed resets.

### Known limitations and untested items

- Local API mode is development-only; the deployed Pages build cannot use `127.0.0.1:3001` and remains the browser/localStorage build.
- JSON Server has no authentication and is intended as a local mock, not a production backend.
- Multi-tab coordination is still unsupported in both modes.
- Firefox, Safari, Edge, and physical mobile devices were not tested; Chrome was used for real-browser checks.
- If JSON Server is not running, mock mode shows the friendly network alert and refuses changes until the list loads.

### Learning and assistance

- Learned to gate opt-in app behaviour on both Vite dev status and explicit mode, so production builds cannot accidentally enter mock mode.
- Learned to treat a write network failure as uncertain, because the server may have applied it even when the browser never received the response.
- Learned to sequence asynchronous GETs so older responses cannot overwrite newer server state.
- Learned to scope Testing Library label queries when add and edit forms both contain a `Priority` control.
- Used opencode/ChatGPT assistance for implementation, test debugging, and CDP browser harnesses; all commands, outputs, and source changes were reviewed before committing.
- No external code was copied into the repository, and no secrets were added.

### Submission

- Repository: https://github.com/ShreyaPradeepKumar/susanoox
- Deployed app: https://ShreyaPradeepKumar.github.io/susanoox/
- Task 05 implementation commit: https://github.com/ShreyaPradeepKumar/susanoox/commit/2477468b4f2f4272b22931e0a600af39acf8e549
- README: `task_1/task-tracker/README.md`
- This report: `task report/task-05-completion-report.md`
