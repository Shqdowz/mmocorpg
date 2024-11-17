// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quests")
    .setDescription("View your current quests"),

  async execute(interaction, client) {
    const authorProfile = await client.fetchProfile(interaction.user.id);

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
            ? `You've completed all quests for today!\n`
            : `Be sure to complete them on time!\n`
        }New quests <t:${next}:R>.`
      )
      .setFooter({
        iconURL: interaction.user.displayAvatarURL(),
        text: `Requested by ${interaction.user.username}`,
      })
      .setTimestamp()
      .setColor(client.getColor("level", authorProfile));

    if (authorProfile.quests.length) {
      for (const quest of authorProfile.quests) {
        const size =
          quest.difficulty == "Easy"
            ? "Small"
            : quest.difficulty == "Medium"
            ? "Medium"
            : "Large";

        let fieldName, fieldValue;

        if (quest.completed) {
          fieldName = `${client.getEmoji(quest.difficulty)} ~~${
            quest.name
          }~~ ${client.getEmoji(quest.difficulty)}`;
          fieldValue = `- ${client.getEmoji("objective")} ~~${
            quest.description
          }~~\n- ${quest.completed ? "🟢" : "🔴"} ~~${quest.progress} / ${
            quest.goal
          }~~\n> ${client.getEmoji(`${size}_crate`)} ~~${size} Crate~~`;
        } else {
          fieldName = `${client.getEmoji(quest.difficulty)} ${
            quest.name
          } ${client.getEmoji(quest.difficulty)}`;
          fieldValue = `- ${client.getEmoji("objective")} ${
            quest.description
          }\n- ${quest.completed ? "🟢" : "🔴"} ${quest.progress} / ${
            quest.goal
          }\n> ${client.getEmoji(`${size}_crate`)} ${size} Crate`;
        }

        embed.addFields([
          {
            name: fieldName,
            value: fieldValue,
          },
        ]);
      }
    }

    await interaction.reply({
      embeds: [embed],
    });
  },
};
