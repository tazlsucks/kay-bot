const { Client, GatewayIntentBits, Events } = require('discord.js');
const { Client: GuildedClient } = require('guilded.js');
const fs = require('fs');
const fetch = require('node-fetch');
const { discordToGuildedMessage, guildedToDiscordMessage } = require('./utils/formatMessage');
const {
    mapDiscordToGuilded,
    mapGuildedToDiscord,
    getGuildedFromDiscord,
    getDiscordFromGuilded
} = require('./utils/messageMap');
const { DISCORD_TOKEN, GUILDED_TOKEN } = require('./config');

const discord = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const guilded = new GuildedClient({ token: GUILDED_TOKEN });

const rawMap = JSON.parse(fs.readFileSync('channelMap.json', 'utf8'));
const discordToGuilded = {};
const guildedToDiscord = {};

for (const pair of rawMap) {
    if (pair.discord && pair.guilded) {
        discordToGuilded[pair.discord] = pair.guilded;
        guildedToDiscord[pair.guilded] = pair.discord;
    }
}

let discordBotUserId = null;
let guildedBotUserId = null;

discord.once(Events.ClientReady, (client) => {
    discordBotUserId = client.user.id;
    console.log(`Discord bot ready as ${client.user.tag}`);
});

guilded.on('ready', () => {
    guildedBotUserId = guilded.user.id;
    console.log(`Guilded bot ready as ${guilded.user.name}`);
});

discord.on(Events.MessageCreate, async (message) => {
    if (message.author?.id === discordBotUserId) return;
    if (await getGuildedFromDiscord(message.id)) return;

    const guildedChannelId = discordToGuilded[message.channel.id];
    if (!guildedChannelId) return;

    try {
    const { content, embeds } = discordToGuildedMessage(message);

        const files = [];
        for (const att of message.attachments.values()) {
            try {
                const res = await fetch(att.url);
                const buffer = await res.arrayBuffer();
                files.push({
                    name: att.name,
                    file: Buffer.from(buffer)
                });
            } catch (err) {
                console.error(`Failed to fetch Discord attachment: ${att.url}`, err);
            }
        }

        let replyMessageIds = [];
        if (message.reference?.messageId) {
            const repliedGuildedId = getGuildedFromDiscord(message.reference.messageId);
            if (repliedGuildedId) {
                replyMessageIds = [repliedGuildedId];
            }
        }

        const sent = await guilded.messages.send(guildedChannelId, {
            content,
            embeds: embeds && embeds.length ? embeds : undefined,
            files,
            ...(replyMessageIds.length ? { replyMessageIds } : {})
        });

        mapDiscordToGuilded(message.id, sent.id, message.channel.id, guildedChannelId);
    } catch (err) {
        console.error('Error forwarding to Guilded:', err);
    }
});
 
discord.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (newMessage.author?.id === discordBotUserId) return;

    const guildedChannelId = discordToGuilded[newMessage.channel.id];
    if (!guildedChannelId) return;

    try {
        const guildedMsgId = getGuildedFromDiscord(newMessage.id);
        if (!guildedMsgId) return;

        const { content, embeds } = discordToGuildedMessage(newMessage);
        await guilded.messages.update(guildedChannelId, guildedMsgId, {
            content,
            embeds: embeds && embeds.length ? embeds : undefined
        });
    } catch (err) {
        console.error('Error editing Guilded message:', err);
    }
});

guilded.on('messageCreated', async (message) => {
    if (message.createdById === guildedBotUserId) return;
    if (await getDiscordFromGuilded(message.id)) return;

    const discordChannelId = guildedToDiscord[message.channelId];
    if (!discordChannelId) return;

    try {
    const { content, embeds } = guildedToDiscordMessage(message);
        const files = [];
        for (const att of (message.attachments || [])) {
            try {
                const res = await fetch(att.url);
                const buffer = await res.arrayBuffer();
                files.push({
                    attachment: Buffer.from(buffer),
                    name: att.filename || 'file'
                });
            } catch (err) {
                console.error(`Failed to fetch Guilded attachment: ${att.url}`, err);
            }
        }

        let messageReference = null;
        if (message.replyMessageIds?.length) {
            const repliedDiscordId = getDiscordFromGuilded(message.replyMessageIds[0]);
            if (repliedDiscordId) {
                messageReference = { messageId: repliedDiscordId };
            }
        }

        const channel = await discord.channels.fetch(discordChannelId);
        const sent = await channel.send({
            content,
            embeds: embeds && embeds.length ? embeds : undefined,
            files,
            ...(messageReference ? { reply: messageReference } : {})
        });

        mapGuildedToDiscord(message.id, sent.id, message.channelId, discordChannelId);
    } catch (err) {
        console.error('Error forwarding to Discord:', err);
    }
});

guilded.on('messageUpdated', async (message) => {
    if (message.createdById === guildedBotUserId) return;

    const discordChannelId = guildedToDiscord[message.channelId];
    if (!discordChannelId) return;

    try {
        const discordMsgId = getDiscordFromGuilded(message.id);
        if (!discordMsgId) return;

        const channel = await discord.channels.fetch(discordChannelId);
        const original = await channel.messages.fetch(discordMsgId);

        const { content, embeds } = guildedToDiscordMessage(message);
        // Discord edit: include embeds if present, and mark edited
        await original.edit({
            content: `${content} *(edited)*`,
            embeds: embeds && embeds.length ? embeds : []
        });
    } catch (err) {
        console.error('Error editing Discord message:', err);
    }
});

discord.login(DISCORD_TOKEN);
guilded.login(GUILDED_TOKEN);
