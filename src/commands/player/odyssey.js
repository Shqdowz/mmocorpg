// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("odyssey")
    .setDescription("Shows your current Portal Odyssey"),

  async execute(interaction, client) {
    const authorProfile = await client.fetchProfile(interaction.user.id);

    function LevelReached(requiredLevel) {
      return authorProfile.level >= requiredLevel ? "🟢" : "🔴";
    }

    function CalculateProgress(level, requiredExperience) {
      let totalExperience = authorProfile.experience;
      while (level > 0) {
        totalExperience += level * 20;
        level--;
      }
      return ((totalExperience / requiredExperience) * 100).toFixed(1);
    }

    const embed = new EmbedBuilder()
      .setTitle(`${authorProfile.username}'s Portal Odyssey`)
      .setDescription(
        `**${CalculateProgress(0, authorProfile.requiredExperience)}%** to \`[${
          authorProfile.level + 1
        }]\`\n**${CalculateProgress(
          authorProfile.level,
          99000
        )}%** to \`[100]\``
      )
      .setColor(client.getColor("level", authorProfile));

    const unlocks = [
      "Battles",
      "Quests",
      "Level 2 gear",
      "Market",
      "Level 3 gear",
      "Guilds",
      "Level 4 gear",
      "Dungeons",
      "Level 5 gear",
      "Cat",
      "Level 6 gear",
      "Raids",
      "Level 7 gear",
      "Nothing", // add more from here
    ];

    unlocks.forEach((unlock, index) => {
      embed.addFields({
        name: `Level ${index * 3 + 1} ${LevelReached(index * 3 + 1)}`,
        value: `- ${unlock}`,
        inline: true,
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
