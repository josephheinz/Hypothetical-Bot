# Installation Guide

Follow these steps to set up and run the Slack Daily Hypothetical Bot.

---

## 1. Clone the repository
```bash
git clone https://github.com/josephheinz/Hypothetical-Bot.git
cd Hypothetical-Bot
```

---

## 2. Install dependencies
```bash
npm install
```

---

## 3. Set up environment variables
Create a .env file in the project root with the following values:
```env
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=your_slack_bot_token
PORT=3000
```

---

## 4. Configure your Slack app
1. Go to [Slack API: Your Apps](https://api.slack.com/apps)
2. Enable Slash Commands and add:
  - /ping
  - /daily
3. Enable Event Subscriptions and subscribe to:
  - message.channels
  - reaction_added
  - reaction_removed
4. Install the app into your workspace.
5. Copy the Bot User OAuth Token into your `.env`.

---

## 5. Run the bot
Start the app:
```bash
node index.js
```
