// -=+=- Dependencies -=+=-
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("menu")
    .setDescription("(DEV) Example select menu"),

  async execute(interaction, client) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`exampleMenu:${interaction.id}`)
      .setDisabled(false)
      .setMinValues(1)
      .setMaxValues(2)
      .setPlaceholder("Placeholder")
      .setOptions(
        new StringSelectMenuOptionBuilder({
          label: `Option 1`,
          value: `Value 1`,
        }),
        new StringSelectMenuOptionBuilder({
          label: `Option 2`,
          value: `Value 2`,
        })
      );

    const reply = await interaction.reply({
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: false,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) =>
        i.user.id == interaction.user.id && i.customId.endsWith(interaction.id),
      time: 60 * 1000,
    });

    collector.on("collect", async (i) => {
      await i.reply({
        content: `You chose: ${i.values.join(", ")}`,
        ephemeral: true,
      });
    });
  },
};
