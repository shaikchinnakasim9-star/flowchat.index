# ChatFlow

ChatFlow turns process descriptions into editable flowcharts and one-question-at-a-time forms. Parsing uses local JavaScript rules and templates: no AI service, API key, account, or paid plan is required.

## Run locally

- Node.js 18.18 or newer
- Install dependencies with `npm install`
- Start with `npm start` and open <http://localhost:3000>

For development, use `npm run dev`. In Windows PowerShell, use `npm.cmd install`, `npm.cmd start`, `npm.cmd run dev`, and `npm.cmd test` if script execution is blocked.

The Windows desktop app also runs locally with `npm.cmd run desktop`; it does not need provider credentials or a settings file.

## Use

Paste a process or choose one of the sample workflows, then select **Generate flowchart**. The local rule-based analyst extracts named actors and responsibilities, ordered actions, explicit dependencies, decision outcomes, start/end conditions, and retry loops. It deduplicates repeated actions, preserves unclear source text as a review note, and never invents missing branch outcomes. A missing decision outcome triggers one clarification question at a time before the diagram is finalized.

Assumptions and parser warnings are shown separately from detected actors. Review them by editing the source or workflow steps; responsibility assignments can also be edited in the step editor. Flowcharts include start/end, action, decision, input/output, and document-style note nodes. Click a node to jump to its editor; change node titles, details, and types; drag step cards to rearrange; add or remove sequence, dependency, and retry-loop connections; and zoom or pan the diagram. Chat forms ask one question at a time and support text, email, number, date, yes/no, and explicit multiple-choice answers.

The floating Help Assistant answers local FAQs about ChatFlow, workflows, project planning, and common programming topics using JavaScript rules and a small knowledge base. It can explain the currently open workflow or a selected step; it does not inspect other saved projects or call an AI service. Chat history is stored in this browser, and common API-key/token formats are removed before chat text or workflow details are displayed.

Saved workflows stay in browser local storage. Text extraction for TXT, PDF, and DOCX files runs in the browser. The diagram renderer and optional document readers are loaded from CDNs; workflow parsing itself is local and never sends process text to an AI provider.

## API

- `GET /api/health` reports `{ "status": "ok", "engine": "local-rules", "apiRequired": false }`.
- `POST /api/analyze` accepts `{ "name": "...", "input": "..." }` and returns a rule-generated `{ "workflow": ... }`.

The workflow contains `version`, `name`, `input`, `steps`, `questions`, `warnings`, `connections`, actor responsibilities, assumptions, clarification prompts, and optional start/end conditions. The JavaScript package exports `generateWorkflow` and `validateWorkflow` from `lib/workflow-parser.js`.

## Tests

Run `npm test` for parser, server, and Help Assistant tests.

## Demo sign-in

The email sign-in is a local UI demo, not authentication. It does not send an email or verify identity. Saved projects and the demo email stay in the current browser and are not synced.
