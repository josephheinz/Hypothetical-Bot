import { App } from "@slack/bolt";
import { CronJob } from "cron";
import { Channel, Message } from "./channel";
import dotenv from "dotenv";

dotenv.config();

process.env.SLACK_LOG_LEVEL = "DEBUG";

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    token: process.env.SLACK_BOT_TOKEN!,
});

interface TrackingChannels {
    [channelId: string]: Channel;
}
const trackingChannels: TrackingChannels = {};

async function sendDirectMessage(userId: string, message: string): Promise<void> {
    try {
        const result = await app.client.chat.postMessage({
            channel: userId,
            text: message,
        });
        console.log("DM sent successfully:", result.ts);
    } catch (err) {
        console.log("Error sending DM:", err);
    }
}

async function getBotUserId(): Promise<string | null> {
    try {
        const result = await app.client.auth.test({
            token: process.env.SLACK_BOT_TOKEN!,
        });
        return result.user_id ?? null;
    } catch (error) {
        console.error("Error getting bot user ID:", error);
        return null;
    }
}

async function countReactions(message: any, channelId: string): Promise<void> {
    console.log("counting reactions");
    const channel: Channel | undefined = trackingChannels[channelId];
    if (!channel) return;

    const messages: Record<number, Message> | undefined = channel.messages;
    if (!messages) return;

    if (!message.reactions) return;

    message.reactions.forEach((reaction: any) => {
        if (reaction.name !== "+1") return;
        const messageInstance: Message | undefined = messages[message.ts];
        if (!messageInstance) return;
        try {
            messageInstance.reactions = reaction.count;
        } catch (err) {
            console.warn(err);
        }
    });
}

async function endDailyHypothetical(
    channel: Channel,
    channelId: string,
    members: string[],
    userId: string,
    userMessage: string,
    memberCount: number
): Promise<void> {
    const noAnswerSet = new Set<string>();
    const botId = await getBotUserId();

    members.forEach((member) => {
        if (!channel.users.has(member) && member !== botId) {
            noAnswerSet.add(member);
        }
    });
    console.log(channel.users, channel.messages);

    const noAnswerMessage = Array.from(noAnswerSet)
        .map((m) => `<@${m}>`)
        .join(", ");

    let favoriteAnswerMsg: Message | undefined = Object.values(channel.messages ?? {}).reduce(
        (maxMsg, msg) => (msg.reactions > (maxMsg?.reactions ?? 0) ? msg : maxMsg),
        undefined as Message | undefined
    );

    const favoriteAnswerText = favoriteAnswerMsg
        ? `The favorite answer was: "${favoriteAnswerMsg.text}" by <@${favoriteAnswerMsg.owner}> with ${favoriteAnswerMsg.reactions} :+1:`
        : "No favorite answer today.";

    const allAnswered = channel.users.size === memberCount;

    const endedMessage = `Daily Hypothetical: "${userMessage}" ended,
\n${allAnswered ? ":tada: Everyone answered!" : `:chart_with_upwards_trend: ${channel.users.size} / ${memberCount} users answered.`}
${allAnswered ? "" : `\n:chart_with_downwards_trend: ${noAnswerMessage} did not answer`}
\n${favoriteAnswerText}`;

    await sendDirectMessage(userId, endedMessage);

    // clean up tracking
    delete trackingChannels[channelId];
}


app.command("/ping", async ({ ack }) => {
    await ack("pong");
});

app.command("/daily", async ({ ack, command, client, say }) => {
    await ack();

    const userMessage = command.text;
    const userId = command.user_id;
    const channelId = command.channel_id;

    const userInfo = await client.users.info({ user: userId });
    const user = userInfo.user as any;

    if (user.is_admin) {
        trackingChannels[channelId] = new Channel(Number(channelId));

        const result = await client.conversations.members({ channel: channelId });
        const members = result.members ?? [];
        const memberCount = members.length - 1;
        const channel: Channel = trackingChannels[channelId];

        await say(
            `New Daily Hypothetical from <@${userId}>: ${userMessage}\nReact with :thumbsup: on answers you like!`
        );

        const runAt = new Date();
        runAt.setHours(runAt.getHours() + 2);

        new CronJob(
            runAt,
            async () => await endDailyHypothetical(channel, channelId, members, userId, userMessage, memberCount),
            () => { },
            true,
            "America/Detroit"
        );

    } else {
        await client.chat.postEphemeral({
            channel: channelId,
            user: userId,
            text: "You do not have permission to run this command.",
        });
    }
});

app.message(async ({ message, client }) => {
    const msg = message as any;
    if (!msg.user || msg.subtype === "bot_message") return;

    if (msg.channel in trackingChannels) {
        const channel: Channel | undefined = trackingChannels[msg.channel];
        if (!channel) return;

        try {
            if (channel.users.has(msg.user)) return;

            await client.reactions.add({
                channel: msg.channel,
                timestamp: msg.ts,
                name: "thumbsup",
            });

            channel.addUser(msg.user);
            channel.addMessage(msg.ts, msg.text, msg.user, 0);
        } catch (err: any) {
            console.error("Reaction failed:", err.data?.error || err);
        }
    }
});

app.event("reaction_added", async ({ event, client }) => {
    if (event.item.type === "message") {
        const result = await client.conversations.history({
            channel: event.item.channel,
            latest: event.item.ts,
            inclusive: true,
            limit: 1,
        });
        await countReactions(result.messages?.[0], event.item.channel);
    }
});

app.event("reaction_removed", async ({ event, client }) => {
    if (event.item.type === "message") {
        const result = await client.conversations.history({
            channel: event.item.channel,
            latest: event.item.ts,
            inclusive: true,
            limit: 1,
        });
        await countReactions(result.messages?.[0], event.item.channel);
    }
});

(async () => {
    await app.start(process.env.PORT ? Number(process.env.PORT) : 3000);
    console.log("❓ Hypothetical Bot is running!");
})();
