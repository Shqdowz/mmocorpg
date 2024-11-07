const { ActivityType } = require("discord.js");

module.exports = (client) => {
  const type = ActivityType.Custom;
  const name = "status";
  const state = [
    "🐈 playing with the cat",
    "👾 farming some monsters",
    "🏰 chilling with the guild",
    "🗡️ raiding a dungeon",
    `📜 completing quests`,
  ];
  const status = [
    "online",
    "idle",
    "dnd",
    // "invisible"
  ];

  client.pickPresence = async () => {
    const presence = {
      type: type,
      name: name,
      state: state[Math.floor(Math.random() * state.length)],
      status: status[Math.floor(Math.random() * status.length)],
    };

    await client.user.setPresence({
      activities: [
        {
          name: presence.name,
          type: presence.type,
          state: presence.state,
        },
      ],
      status: presence.status,
    });
  };
};
