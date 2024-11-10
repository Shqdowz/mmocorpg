// -=+=- Dependencies -=+=-
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

// -=+=- Schemas -=+=-
const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("button")
    .setDescription("(DEV) Example button"),

  async execute(interaction, client) {
    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    const embeds = [
      new EmbedBuilder()
        .setTitle(`Embed 1`)
        .setDescription(`Description 1`)
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", authorProfile)),

      new EmbedBuilder()
        .setTitle(`Embed 2`)
        .setDescription(`Description 2`)
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", authorProfile)),
    ];

    const previousButton = new ButtonBuilder()
      .setCustomId(`previous:${interaction.id}`)
      .setEmoji("◀️")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const nextButton = new ButtonBuilder()
      .setCustomId(`next:${interaction.id}`)
      .setEmoji("▶️")
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary);

    const reply = await interaction.reply({
      embeds: [embeds[0]],
      components: [
        new ActionRowBuilder().addComponents(previousButton, nextButton),
      ],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) =>
        i.user.id == interaction.user.id && i.customId.endsWith(interaction.id),
      time: 60 * 1000,
    });

    let page = 0;

    collector.on("collect", async (i) => {
      switch (i.customId) {
        case `previous:${interaction.id}`:
          page--;
          break;
        case `next:${interaction.id}`:
          page++;
          break;
      }

      previousButton.setDisabled(page == 0);
      nextButton.setDisabled(page == embeds.length - 1);

      await i.update({
        embeds: [embeds[page]],
        components: [
          new ActionRowBuilder().addComponents(previousButton, nextButton),
        ],
      });
    });

    collector.on("end", async () => {
      previousButton.setDisabled(true);
      nextButton.setDisabled(true);

      await interaction.editReply({
        components: [
          new ActionRowBuilder().addComponents(previousButton, nextButton),
        ],
      });
    });
  },
};
