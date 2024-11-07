const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crash")
    .setDescription("(DEV) Crash the bot"),

  async execute(interaction, client) {
    await interaction.reply({
      content: `Putting the bot to sleep...`,
      ephemeral: true,
    });

    process.exit(0);
  },
};
