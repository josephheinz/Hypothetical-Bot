const { App } = require("@slack/bolt");
require('dotenv').config();

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
});

let trackingChannels = {};

app.command("/ping", async ({ ack }) => {
    await ack('pong');
});

app.command("/daily", async ({ ack, command, client, say }) => {
    await ack();

    const userMessage = command.text;

    const userId = command.user_id;
    const result = await client.users.info({ user: userId });
    const user = result.user;

    if (user.is_admin) {
        trackingChannels[command.channel_id] = new Set();

        await say(`New Daily Hypothetical from <@${userId}>: ${userMessage}`);

        setTimeout(async () => {
            delete trackingChannels[command.channel_id];
        }, 30000);
    } else {
        await client.chat.postEphemeral({
            channel: command.channel_id,
            user: userId,
            text: 'You do not have permission to run this command.'
        });
    }
});

app.message(async ({ message, client }) => {
    console.log("adsf");
    //if (!message.user || message.subtype === 'bot_message') return;

    if (trackingChannels.has(message.channel)) {
        try {
            if (trackingChannels[message.channel].has(message.user)) return;

            await client.reactions.add({
                channel: message.channel,
                timestamp: message.ts,
                name: "thumbsup",
            });

            trackingChannels[message.channel].add(message.user);

            console.log(`Reacted to ${message.user}`);
        } catch (err) {
            console.error("Reaction failed:", err.data?.error || err);
        }
        console.log(`User <@${message.user}> sent: ${message.text}`);
    }
    else {
        console.log("channel not in tracking list");
    }
});

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();