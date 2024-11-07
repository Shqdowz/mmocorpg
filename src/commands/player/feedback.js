const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("Send feedback to the developers")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of feedback to send")
        .addChoices(
          {
            name: "Suggestion",
            value: "Suggestion",
          },
          {
            name: "Bug Report",
            value: "Bug Report",
          }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("feedback")
        .setDescription("The feedback you wish to share")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const type = interaction.options.getString("type");
    const feedback = interaction.options.getString("feedback");

    const embed = new EmbedBuilder()
      .setTitle(
        `${type} from ${interaction.user.username} (${interaction.user.id})`
      )
      .setDescription(feedback)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .setColor(type == "Suggestion" ? "Green" : "Red");

    const guild = await client.guilds.fetch("1250387871517638708");
    const channel =
      type == "Suggestion"
        ? await guild.channels.fetch("1253673162961457153")
        : await guild.channels.fetch("1260880403158401065");

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      content: `Thank you for taking the time to write feedback! It has been sent to the developers.`,
      ephemeral: true,
    });
  },
};
