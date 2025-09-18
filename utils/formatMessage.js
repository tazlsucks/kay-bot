function formatName({ nickname, username }) {
  return nickname && nickname !== username
    ? `${nickname} (${username})`
    : username;
}

function discordEmbedToGuilded(embed) {
  const obj = {};
  if (embed.title) obj.title = embed.title;
  if (embed.description) obj.description = embed.description;
  if (embed.url) obj.url = embed.url;
  if (embed.color) obj.color = embed.color;
  if (embed.fields && embed.fields.length) obj.fields = embed.fields.map(f => ({ name: f.name, value: f.value, inline: f.inline }));
  if (embed.thumbnail?.url) obj.thumbnail = { url: embed.thumbnail.url };
  if (embed.image?.url) obj.image = { url: embed.image.url };
  if (embed.footer?.text) obj.footer = { text: embed.footer.text };
  if (embed.author?.name) obj.author = { name: embed.author.name };
  return obj;
}

function guildedEmbedToDiscord(embed) {
  const obj = {};
  if (embed.title) obj.title = embed.title;
  if (embed.description) obj.description = embed.description;
  if (embed.url) obj.url = embed.url;
  if (embed.color) obj.color = embed.color;
  if (embed.fields && embed.fields.length) obj.fields = embed.fields.map(f => ({ name: f.name, value: f.value, inline: f.inline }));
  if (embed.thumbnail?.url) obj.thumbnail = { url: embed.thumbnail.url };
  if (embed.image?.url) obj.image = { url: embed.image.url };
  if (embed.footer?.text) obj.footer = { text: embed.footer.text };
  if (embed.author?.name) obj.author = { name: embed.author.name };
  return obj;
}

function discordToGuildedMessage(message) {
  const name = formatName({
    nickname: message.member?.nickname,
    username: message.author.username
  });

  const text = message.content || '';
  const attachmentLinks = [...message.attachments.values()]
    .map(att => `[📎 ${att.name}](${att.url})`)
    .join('\n');

  // Convert embeds to a simple textual fallback and structured embeds
  const embedTexts = (message.embeds || [])
    .map(e => {
      const parts = [];
      if (e.title) parts.push(`**${e.title}**`);
      if (e.description) parts.push(e.description);
      return parts.join('\n');
    })
    .filter(Boolean)
    .join('\n\n');

  const content = `${name}: ${text}${attachmentLinks ? '\n' + attachmentLinks : ''}${embedTexts ? '\n' + embedTexts : ''}`;
  const embeds = (message.embeds || []).map(discordEmbedToGuilded).filter(e => Object.keys(e).length);
  return { content, embeds };
}

function guildedToDiscordMessage(message) {
  const text = message.content || '';
  const attachmentLinks = (message.attachments || [])
    .map(att => `[📎 ${att.filename}](${att.url})`)
    .join('\n');

  const content = `${text}${attachmentLinks ? '\n' + attachmentLinks : ''}`;
  const embeds = (message.embeds || []).map(guildedEmbedToDiscord).filter(e => Object.keys(e).length);
  return { content, embeds };
}

module.exports = {
  discordToGuildedMessage,
  guildedToDiscordMessage
};
