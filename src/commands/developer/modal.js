const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("modal")
    .setDescription("(DEV) Example modal"),

  async execute(interaction, client) {
    const modal = new ModalBuilder()
      .setCustomId(`exampleModal:${interaction.id}`)
      .setTitle("Player survey");

    const textInput = new TextInputBuilder()
      .setCustomId(`modalInput:${interaction.id}`)
      .setLabel("Whats your credit card details?")
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(100)
      .setPlaceholder("Placeholder")
      .setStyle(TextInputStyle.Paragraph)
      .setValue("DefaultInput");

    modal.addComponents(new ActionRowBuilder().addComponents(textInput));

    await interaction.showModal(modal);

    const filter = (i) =>
      i.customId == `exampleModal:${interaction.id}` &&
      i.user.id == interaction.user.id;
    const submitted = await interaction.awaitModalSubmit({
      filter,
      time: 60 * 1000,
    });

    await submitted.reply({
      content: `${
        interaction.user
      }'s credit card details: ${submitted.fields.getTextInputValue(
        "modalInput"
      )}`,
      ephemeral: true,
    });
  },
};
