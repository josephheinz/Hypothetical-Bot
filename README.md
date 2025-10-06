# Slack Daily Hypothetical Bot

A Slack bot built with [Bolt.js](https://slack.dev/bolt-js) that runs **Daily Hypothetical** prompts in a channel.  
Admins can start a session, participants reply in-thread, and after 2 hours the bot reports who answered, who didn’t, and which answer got the most 👍 reactions.  

---

## Features
- `/ping` – quick test command (responds with `pong`).
- `/daily [question]` – starts a Daily Hypothetical in the current channel (admins only).
- Tracks which members submit answers.
- Auto-reacts with 👍 on each submitted answer.
- Tracks reactions to determine the favorite answer.
- After 2 hours:
  - Summarizes participation.
  - Shows who didn’t answer.
  - Highlights the most-liked response.
  - Sends the summary via DM to the admin who started it.

---

## Usage
- In Slack, type: /daily What’s your dream vacation?
- Members reply in the channel with their answers.
- The bot will:
- React 👍 to all responses.
- Track replies and votes.
- After 2 hours, DM the admin with results.

---

## Installation
See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

---

## License
MIT License
