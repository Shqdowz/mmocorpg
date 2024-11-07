const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("odyssey")
    .setDescription("Shows your current Portal Odyssey"),

  async execute(interaction, client) {
    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    function LevelReached(requiredLevel) {
      if (authorProfile.level >= requiredLevel) {
        return "🟢";
      }
      return "🔴";
    }

    function CalculateTotalProgress(level) {
      let totalExperience = authorProfile.experience;
      while (level > 0) {
        totalExperience += level * 20;
        level--;
      }
      return totalExperience;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${authorProfile.username}'s Portal Odyssey`)
      .setDescription(
        `**${parseFloat(
          (
            (authorProfile.experience / authorProfile.requiredExperience) *
            100
          ).toFixed(1)
        )}%** to \`[${authorProfile.level + 1}]\`\n**${parseFloat(
          ((CalculateTotalProgress(authorProfile.level) / 99000) * 100).toFixed(
            1
          )
        )}%** to \`[100]\``
      )
      .setColor(client.getColor("level", authorProfile));

    const unlocks = [
      [1, ["- Battles"]],
      [4, ["- Quests"]],
      [7, ["- Shrine Canyon battles"]],
      [10, ["- Cat", "- Dungeons"]],
      [13, ["- Overgrown Ruins battles"]],
      [16, ["- Guilds"]],
      [19, ["- Forest Barracks battles"]],
      [22, ["- something1"]],
      [25, ["- Spirit Caverns battles"]],
    ];

    for (const unlock of unlocks) {
      embed.addFields({
        name: `Level ${unlock[0]} ${LevelReached(unlock[0])}`,
        value: unlock[1].map((u) => u).join("\n"),
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
