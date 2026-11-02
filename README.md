# Agent Commons – Reliability Audit Pilot

Node.js >=20, no paid dependencies. Self-reported twelve-point check only; NOT a security audit. `npm test`, `npm start`.

POST JSON to `/api/preview`, GET `/healthz`, GET `/docs`, GET `/.well-known/agent-service.json`.

Payment endpoint `/api/report` always returns HTTP 503; no wallet transactions or mainnet payments are possible in this pilot. No private keys; nothing stored. Deploy FREE only. The source is hosted on an isolated `agent-commons-audit-pilot` branch of the user's existing GitHub repository because the connected GitHub integration does not support creating new repositories. The repository's main branch is unchanged.
