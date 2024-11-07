const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Displays info about the bot"),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle("Bot info")
      .setDescription(
        "MMOCORPG is a game bot designed around Supercell's mo.co."
      )
      .setThumbnail(client.user.displayAvatarURL())
      .addFields([
        {
          name: "Developer",
          value: "<@856545083310604308> (shqdowz)",
        },
        {
          name: "Support",
          value:
            "Hosting has to be paid for! If you wish to, you're free to donate a small amount of money. All donations will go towards hosting; if there's excess, I will use it for giveaways or events. You can donate [here](https://www.ifsupercellallowsit.com).",
        },
        {
          name: "Fan Content Policy",
          value:
            "This project is unofficial and is not endorsed by Supercell. For more information, see Supercell's [Fan Content Policy](https://www.supercell.com/fan-content-policy).",
        },
      ])
      .setColor("#dd7f9d");

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
