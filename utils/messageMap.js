const Database = require('better-sqlite3');
const db = new Database('messageMap.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS message_map (
    discord_id TEXT PRIMARY KEY,
    guilded_id TEXT NOT NULL,
    discord_channel_id TEXT NOT NULL,
    guilded_channel_id TEXT NOT NULL
)
`).run();

function mapDiscordToGuilded(discordId, guildedId, discordChannelId, guildedChannelId) {
    const stmt = db.prepare(`
        INSERT INTO message_map (discord_id, guilded_id, discord_channel_id, guilded_channel_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(discord_id) DO UPDATE SET
            guilded_id=excluded.guilded_id,
            discord_channel_id=excluded.discord_channel_id,
            guilded_channel_id=excluded.guilded_channel_id
    `);
    stmt.run(discordId, guildedId, discordChannelId, guildedChannelId);
}

function mapGuildedToDiscord(guildedId, discordId, guildedChannelId, discordChannelId) {
    const stmt = db.prepare(`
        INSERT INTO message_map (discord_id, guilded_id, discord_channel_id, guilded_channel_id)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(discord_id) DO UPDATE SET
            guilded_id=excluded.guilded_id,
            discord_channel_id=excluded.discord_channel_id,
            guilded_channel_id=excluded.guilded_channel_id
    `);
    stmt.run(discordId, guildedId, discordChannelId, guildedChannelId);
}

function getGuildedFromDiscord(discordId) {
    const row = db.prepare(`SELECT guilded_id FROM message_map WHERE discord_id = ?`).get(discordId);
    return row?.guilded_id || null;
}

function getDiscordFromGuilded(guildedId) {
    const row = db.prepare(`SELECT discord_id FROM message_map WHERE guilded_id = ?`).get(guildedId);
    return row?.discord_id || null;
}

function getGuildedMetaFromDiscord(discordId) {
    return db.prepare(`SELECT * FROM message_map WHERE discord_id = ?`).get(discordId) || null;
}

function getDiscordMetaFromGuilded(guildedId) {
    return db.prepare(`SELECT * FROM message_map WHERE guilded_id = ?`).get(guildedId) || null;
}

module.exports = {
    mapDiscordToGuilded,
    mapGuildedToDiscord,
    getGuildedFromDiscord,
    getDiscordFromGuilded,
    getGuildedMetaFromDiscord,
    getDiscordMetaFromGuilded
};
