// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// -=+=- Schemas -=+=-
const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Change your settings")
    .addStringOption((option) =>
      option
        .setName("setting")
        .setDescription("The setting to change")
        .addChoices({ name: "Always ready", value: "Always Ready" })
    )
    .addBooleanOption((option) =>
      option
        .setName("enabled")
        .setDescription("Whether the setting should be enabled or not")
    ),

  async execute(interaction, client) {
    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    const setting = interaction.options.getString("setting");
    const enabled =
      interaction.options.getBoolean("enabled") ||
      !authorProfile.settings[setting];

    if (!setting) {
      const embed = new EmbedBuilder()
        .setTitle(`Your current settings`)
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", authorProfile));

      for (const setting of Object.keys(authorProfile.settings)) {
        embed.addFields({
          name: `${setting}`,
          value: `${authorProfile.settings[setting]}`,
        });
      }

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    authorProfile.settings[setting] = enabled;
    await authorProfile.save();

    const embed = new EmbedBuilder()
      .setTitle(`Setting changed!`)
      .addFields([
        {
          name: `${setting}`,
          value: `${authorProfile.settings[setting]}`,
        },
      ])
      .setFooter({
        iconURL: interaction.user.displayAvatarURL(),
        text: `Performed by ${interaction.user.username}`,
      })
      .setTimestamp()
      .setColor(client.getColor("level", authorProfile));

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
