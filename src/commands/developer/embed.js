// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("(DEV) Example embed"),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      // .setAuthor({
      //   url: `https://www.youtube.com/@ShqdowzYT`,
      //   iconURL: interaction.user.displayAvatarURL(),
      //   name: "Author",
      // })
      .setTitle("Title")
      //.setURL(`https://www.youtube.com/@ShqdowzYT`)
      .setDescription("Description")
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields([
        {
          name: "Field 1",
          value: "Value 1",
          inline: true,
        },
        {
          name: "Field 2",
          value: "Value 2",
          inline: true,
        },
      ])
      .setImage(client.user.displayAvatarURL())
      .setFooter({
        iconURL: interaction.user.displayAvatarURL(),
        text: `Requested by ${interaction.user.username}`,
      })
      .setTimestamp()
      .setColor("Red");

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
