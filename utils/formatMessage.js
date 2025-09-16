function formatName({ nickname, username }) {
  return nickname && nickname !== username
    ? `${nickname} (${username})`
    : username;
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

  const line = `${name}: ${text}${attachmentLinks ? '\n' + attachmentLinks : ''}`;
  return [line];
}

function guildedToDiscordMessage(message) {
  const text = message.content || '';
  const attachmentLinks = (message.attachments || [])
    .map(att => `[📎 ${att.filename}](${att.url})`)
    .join('\n');

  return [`${text}${attachmentLinks ? '\n' + attachmentLinks : ''}`];
}

module.exports = {
  discordToGuildedMessage,
  guildedToDiscordMessage
};
