// -=+=- Dependencies -=+=-
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("Battle a random group of monsters"),

  async execute(interaction, client) {
    function Random(standard, elite, boss) {
      const rng = Math.random();
      const tier =
        rng < standard
          ? "standard"
          : rng < standard + elite
          ? "elite"
          : rng < standard + elite + boss
          ? "boss"
          : null;
      const enemy =
        monsterArray[tier][
          Math.floor(Math.random() * monsterArray[tier].length)
        ];

      return enemy;
    }

    // Global arrays
    const monsterArray = client.getArray("monsters");

    const authorProfile = await client.fetchProfile(interaction.user.id);
    const allyCount = authorProfile.party
      ? authorProfile.party.members.length
      : 1;

    // Enemies
    const waveEnemies = Array.from({ length: 1 }, () => []);

    for (let i = 0; i < allyCount * 2; i++) {
      waveEnemies[0].push(Random(0.6, 0.3, 0.1));
      // waveEnemies[0].push("Scorcher");
    }

    // Handle battle
    await client.handleBattle(interaction, {
      waveEnemies,
    });
  },
};
