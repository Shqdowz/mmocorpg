const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blueprint")
    .setDescription("(DEV) Command blueprint"),

  async execute(interaction, client) {},
};
