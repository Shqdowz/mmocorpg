// Schemas
const User = require("../../schemas/userSchema");

// Dependencies
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quests")
    .setDescription("View your current quests"),

  async execute(interaction, client) {
    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    if (authorProfile.level < 4) {
      return await interaction.reply({
        content: `The quests feature unlocks at level 4! Please come back later.`,
        ephemeral: true,
      });
    }

    const next = Math.floor(
      new Date(authorProfile.cooldowns.quests.getTime()).getTime() / 1000
    );

    const embed = new EmbedBuilder()
      .setTitle(
        `${client.getEmoji("quest")} ${authorProfile.username}'s quests`
      )
      .setDescription(
        `${
          authorProfile.quests.length
            ? `New quests <t:${next}:R>.`
            : `You've completed all quests for today!\nNew quests <t:${next}:R>.`
        }`
      )
      .setFooter({
        iconURL: interaction.user.displayAvatarURL(),
        text: `Requested by ${interaction.user.username}`,
      })
      .setTimestamp()
      .setColor(client.getColor("level", authorProfile));

    for (const quest of authorProfile.quests) {
      const size =
        quest.difficulty == "Easy"
          ? "Small"
          : quest.difficulty == "Medium"
          ? "Medium"
          : "Large";

      const completed = quest.completed ? "~~" : "";

      const fieldName = `${client.getEmoji(quest.difficulty)} ${completed}${
        quest.name
      }${completed} ${client.getEmoji(quest.difficulty)}`;
      const fieldValue = `- ${client.getEmoji("objective")} ${completed}${
        quest.description
      }${completed}\n- ${quest.completed ? "🟢" : "🔴"} ${completed}${
        quest.progress
      } / ${quest.goal}${completed}\n> ${client.getEmoji(
        `${size}_crate`
      )} ${completed}${size} Crate${completed}`;

      embed.addFields([
        {
          name: fieldName,
          value: fieldValue,
        },
      ]);
    }

    await interaction.reply({
      embeds: [embed],
    });
  },
};
