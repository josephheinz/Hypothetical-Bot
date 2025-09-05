const { App } = require("@slack/bolt");
const { cron, CronJob } = require("cron");
const { Channel, Message } = require("./channel.js");
require('dotenv').config();

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
});

let trackingChannels = {};

async function sendDirectMessage(userId, message) {
    try {
        const result = await app.client.chat.postMessage({
            channel: userId,
            text: message,
        });
        console.log("DM sent successfully:", result.ts);
    } catch (err) {
        console.log("Error sending DM:", error);
    }
}

async function getBotUserId() {
    try {
        const result = await app.client.auth.test({
            token: process.env.SLACK_BOT_TOKEN,
        });
        return result.user_id;
    } catch (error) {
        console.error('Error getting bot user ID:', error);
        return null;
    }
}

async function countReactions(message, channelId) {
    console.log("counting reactions");

    if (!message.reactions) return;

    message.reactions.forEach((reaction) => {
        if (reaction.name != "+1") return;

        trackingChannels[channelId].messages[message.ts].reactions = reaction.count;
    })
}

app.command("/ping", async ({ ack }) => {
    await ack('pong');
});

app.command("/daily", async ({ ack, command, client, say }) => {
    await ack();

    const userMessage = command.text;

    const userId = command.user_id;
    const result = await client.users.info({ user: userId });
    const user = result.user;
    const channelId = command.channel_id;

    if (user.is_admin) {
        trackingChannels[channelId] = new Channel(channelId);

        const result = await client.conversations.members({
            channel: channelId,
        });

        const members = result.members;
        const memberCount = members?.length - 1; // remove the bot from the member count

        await say(`New Daily Hypothetical from <@${userId}>: ${userMessage}\nReact with :thumbsup: on answers you like!`);

        const runAt = new Date();
        runAt.setHours(runAt.getHours() + 2); // 2 hours from now

        let newTimer = new CronJob(
            runAt,
            async () => {
                let noAnswerSet = new Set();
                const botId = await getBotUserId();

                members.forEach(member => {
                    if (!trackingChannels[channelId].users.has(member) && member != botId) noAnswerSet.add(member);
                });

                let noAnswerMessage = "";
                noAnswerSet.forEach((member) => {
                    noAnswerMessage += `<@${member}>, `;
                });

                let favoriteAnswerMsg = 0;
                let mostReactions = 0;
                Object.entries(trackingChannels[channelId].messages).forEach(([_, message]) => {
                    if (message.reactions > mostReactions) {
                        mostReactions = message.reactions;
                        favoriteAnswerMsg = message;
                    }
                });

                let favoriteAnswerMessage = `The favorite answer was: "${favoriteAnswerMsg.text}" by <@${favoriteAnswerMsg.owner}> with ${favoriteAnswerMsg.reactions} :+1:`;

                let allAnswered = trackingChannels[channelId].users.size == memberCount;

                let endedMessage = `Daily Hypothetical: "${userMessage}" ended, 
                \n${allAnswered ? ':tada: Everyone answered!' : `:chart_with_upwards_trend: ${trackingChannels[channelId].users.size} / ${memberCount} users answered.`}
                ${allAnswered ? "" : `\n:chart_with_downwards_trend: ${noAnswerMessage} did not answer`}
                \n${favoriteAnswerMessage}`;

                sendDirectMessage(userId, endedMessage);
                delete trackingChannels[channelId];
            },
            () => { return },
            true,
            "America/Detroit"
        );

    } else {
        await client.chat.postEphemeral({
            channel: channelId,
            user: userId,
            text: 'You do not have permission to run this command.'
        });
    }
});

app.message(async ({ message, client }) => {
    if (!message.user || message.subtype === 'bot_message') return;

    if (message.channel in trackingChannels) {
        try {
            if (trackingChannels[message.channel].users.has(message.user)) return;

            await client.reactions.add({
                channel: message.channel,
                timestamp: message.ts,
                name: "thumbsup",
            });

            trackingChannels[message.channel].addUser(message.user);
            trackingChannels[message.channel].addMessage(message.ts, message.text, message.user, 0);
        } catch (err) {
            console.error("Reaction failed:", err.data?.error || err);
        }
    }
});

// When someone adds a reaction
app.event("reaction_added", async ({ event, client, say }) => {
    // You can fetch the message if needed
    if (event.item.type === "message") {
        const result = await client.conversations.history({
            channel: event.item.channel,
            latest: event.item.ts,
            inclusive: true,
            limit: 1,
        });
        countReactions(result.messages[0], event.item.channel);
    }
});

// When someone removes a reaction
app.event("reaction_removed", async ({ event }) => {
    // You can fetch the message if needed
    if (event.item.type === "message") {
        const result = await client.conversations.history({
            channel: event.item.channel,
            latest: event.item.ts,
            inclusive: true,
            limit: 1,
        });
        countReactions(result.messages[0], event.item.channel);
    }
});


(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();