const User = require("../../schemas/userSchema");
const wait = require("node:timers/promises").setTimeout;
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("command")
    .setDescription("(DEV) Example command")
    .addUserOption((option) =>
      option.setName("target").setDescription("The user").setRequired(true)
    )
    .addBooleanOption((option) =>
      option.setName("flag").setDescription("True or false")
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The channel")
    )
    .addIntegerOption((option) =>
      option.setName("number").setDescription("An integer")
    )
    .addMentionableOption((option) =>
      option.setName("mentionable").setDescription("A mentionable entity")
    )
    .addNumberOption((option) =>
      option.setName("float").setDescription("A number")
    )
    .addRoleOption((option) =>
      option.setName("role").setDescription("The role")
    )
    .addStringOption((option) =>
      option.setName("input").setDescription("A string")
    ),

  async execute(interaction, client) {
    const user = interaction.options.getUser("target");
    const boolean = interaction.options.getBoolean("flag");
    const channel = interaction.options.getChannel("channel");
    const integer = interaction.options.getInteger("number");
    const mentionable = interaction.options.getMentionable("mentionable");
    const number = interaction.options.getNumber("float");
    const role = interaction.options.getRole("role");
    const string = interaction.options.getString("input");

    // await interaction.deferReply({});

    await interaction.reply({
      content: `user ${user}, boolean ${boolean}, channel ${channel}, integer ${integer}, mentionable ${mentionable}, number ${number}, role ${role}, string ${string}`,
    });

    // await wait(3 * 1000);

    // await interaction.editReply({
    //   content: `Edited or deferred reply`,
    // });

    // await wait(3 * 1000);

    // await interaction.followUp({
    //   content: `Follow up reply`,
    // });

    // await interaction.deleteReply();

    // const message = await interaction.fetchReply();
    // console.log(message);
  },
};
