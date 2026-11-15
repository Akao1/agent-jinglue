# Agent Jinglue · The Product Form of the Agent Government

> A personal workbench that turns the "Three Departments + Six Ministries" agent governance system into something a human can actually use: a dynasty atlas for the big picture, capital offices for the actual work, and the throne room where you — and only you — approve. This repo holds the product design, requirements, feasibility study, and a clickable prototype.

**[中文 README](./README.md)** · For the governance-contract layer, see the sister repo [agent-government](https://github.com/Akao1/agent-government)

## What It Is

If you run several business lines (work, video, study, long-term projects) through multiple AI tools, you've probably hit: re-explaining every task from scratch, no visible global progress, and AI making calls that were yours to make.

Jinglue's answer is a workbench in the metaphor of an imperial court:

| Metaphor | Entity | What you do |
|---|---|---|
| **Dynasty atlas** | Business panorama | Provinces = business lines, prefectures = projects, counties = independently acceptable work items |
| **Capital offices** | Working UI | 18 offices covering drafting, review, execution, audit — each owns one stage of the flow |
| **Throne room** | Approval center | Everything that needs your decision, in one place; each approval is bound to case number, version, and scope |
| **History hall** | Accumulated craft | Finished work is distilled into reusable "ripe land" records for the next task |

Core principles mirror agent-government: **the drafter never approves**, **every approval is scope-bound**, and **small things take the fast lane** (chitchat never becomes a court ceremony).

## Repo Contents

- [`docs/01-产品设计.md`](docs/01-产品设计.md) — product design (Chinese)
- [`docs/02-需求说明书.md`](docs/02-需求说明书.md) — requirements with acceptance criteria (Chinese)
- [`docs/03-可行性方案.md`](docs/03-可行性方案.md) — feasibility & reuse analysis (Chinese)
- [`docs/04-设计演进与交接.md`](docs/04-设计演进与交接.md) — design iteration log & handoff (Chinese)
- [`prototype/`](prototype/index.html) — clickable prototype v0.8.1, pure static HTML/JS — just open `index.html` in a browser

## Status (honest)

- Design docs, requirements, feasibility: finalized (v0.3)
- Prototype: iterated to v0.8.1 (verified in real Chrome: desktop & 375px mobile, keyboard focus, draft retention, error handling, cross-page retrieval)
- The actual software is **not yet built**: real-model-API and local-agent single-end runs, two-end relay, and write isolation are all pending real tests (see the feasibility doc)
- Visual direction not final: the v0.4 look was rejected by the user; the prototype is for interaction & information-architecture review (see the handoff doc)

## License

[MIT](./LICENSE)
