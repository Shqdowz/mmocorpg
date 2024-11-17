// -=+=- Dependencies -=+=-
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("Battle a random group of monsters"),

  async execute(interaction, client) {
    // Global arrays
    const monsterArray = client.getArray("monsters");

    // Enemies
    const authorProfile = await client.fetchProfile(interaction.user.id);

    const startAllies = authorProfile.party
      ? authorProfile.party.members.length
      : 1;

    const startEnemies = [];

    for (let i = 0; i < startAllies * 2; i++) {
      const rng = Math.random();
      const tier = rng < 0.6 ? "standard" : rng < 0.9 ? "elite" : "boss";

      const enemy =
        monsterArray[tier][
          Math.floor(Math.random() * monsterArray[tier].length)
        ];
      startEnemies.push(enemy);
    }

    // Handle battle
    await client.handleBattle(interaction, {
      startEnemies,
    });
  },
};
