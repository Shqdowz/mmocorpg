// -=+=- Dependencies -=+=-
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory"),

  async execute(interaction, client) {
    const authorProfile = await client.fetchProfile(interaction.user.id);

    const description = `${client.getEmoji("mocoin")} mo.coins: **${
      authorProfile.inventory["mocoins"]
    }**\n${client.getEmoji("chaos_cube")} chaos cubes: **${
      authorProfile.inventory["Chaos Cubes"]
    }**`;

    const dropsArray = client.getArray("drops");

    let drops = [];

    ["standard", "elite", "boss"].forEach((tier) => {
      for (const [drop, amount] of Object.entries(
        authorProfile.inventory.monsterDrops
      )) {
        if (dropsArray[tier].includes(drop) && amount > 0)
          drops.push({
            emoji: client.getEmoji(drop),
            name: drop,
            amount: amount,
          });
      }
    });

    function CreateChunks(array) {
      const results = [];
      while (array.length) {
        results.push(array.splice(0, 6));
      }
      return results;
    }

    const chunks = drops.length ? CreateChunks(drops) : [null];

    const embeds = chunks.map((chunk, index) => {
      return new EmbedBuilder()
        .setTitle(`${authorProfile.username}'s inventory`)
        .setDescription(description)
        .addFields({
          name: chunks[0]
            ? `Monster loot (${index + 1}/${chunks.length})`
            : `Monster loot`,
          value: chunks[0]
            ? chunk
                .map((drop) => `${drop.emoji} ${drop.name}: **${drop.amount}**`)
                .join("\n")
            : `No monster drops yet 😔`,
        })
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", authorProfile));
    });

    embeds.push(
      new EmbedBuilder()
        .setTitle(`${authorProfile.username}'s inventory`)
        .setDescription(description)
        .addFields([
          {
            name: `Blueprints`,
            value:
              authorProfile.inventory.blueprints
                .map((blueprint) => blueprint)
                .join(", ") || `None`,
          },
          {
            name: "Pet items",
            value: `💊 Medicines: **${authorProfile.inventory.medicine}**\n🍬 Treats: **${authorProfile.inventory.treat}**\n🧶 Toys: **${authorProfile.inventory.toy}**`,
            inline: true,
          },
        ])
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", authorProfile))
    );

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
      time: 30 * 1000,
    });

    let page = 0;

    collector.on("collect", async (i) => {
      collector.resetTimer({ time: 30 * 1000 });

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
