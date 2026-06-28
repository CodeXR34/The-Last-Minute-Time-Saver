# The Last-Minute Life Saver

A smart task management application powered by Google Gemini. This app goes beyond basic AI labels by implementing a Continuous Agentic Observer that autonomously manages your priorities.

## How the agent works

Our AI agent runs continuously in the background, acting as a smart observer over your entire task list. Based on a configurable interval (`VITE_OBSERVER_INTERVAL_SECONDS`), it evaluates all your pending tasks against each other, automatically re-ranking them based on approaching deadlines and changing priorities. It maintains a live Decision Log so you can see exactly why it moved a task up or escalated its urgency. When it spots a highly complex task, it highlights it so you can manually request it to be broken down into bite-sized, actionable subtasks. It's not just a smart label—it's a proactive assistant that manages your workload.

> **Note on Demo Setup:** For development, `VITE_OBSERVER_INTERVAL_SECONDS` defaults to `300` (5 minutes) in `.env.local` to save API quota. Before running an actual live demo, you should change this to a shorter value like `30` or `60` so the audience sees the background re-ranking happen quickly.

## Tech Stack
- React 19 + Vite
- Firebase (Auth & Firestore)
- Tailwind CSS
- Google Gemini API (`gemini-2.5-flash`)
