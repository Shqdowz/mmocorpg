const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market")
    .setDescription("Buy, sell or trade items at the merket")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("buy")
        .setDescription("Buy items")
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("The item to buy")
            .setRequired(true)
            .addChoices(
              { name: "Medicine", value: "medicines" },
              { name: "Treats", value: "treats" },
              { name: "Toy", value: "toys" }
            )
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount to buy")
            .addChoices(
              { name: "1", value: 1 },
              { name: "5 (-5%)", value: 5 },
              { name: "10 (-10%)", value: 10 }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("View a list of all market items")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("sell").setDescription("Sell items")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("trade").setDescription("Trade items")
    ),

  async execute(interaction, client) {
    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    if (interaction.options.getSubcommand() == "buy") {
      const item = interaction.options.getString("item");
      const amount = interaction.options.getNumber("amount") || 1;
      await authorProfile.populate("inventory");

      const discount = amount >= 10 ? 0.9 : amount >= 5 ? 0.95 : 1;
      let cost;

      switch (item) {
        case "medicines":
          cost = 80 * amount * discount;
          break;
        case "treats":
          cost = 40 * amount * discount;
          break;
        case "toys":
          cost = 20 * amount * discount;
          break;
      }

      // If the author doesn't have the required mo.coins
      if (authorProfile.inventory.mocoins < cost) {
        return await interaction.reply({
          content: `You don't have enough mo.coins to buy this item!`,
          ephemeral: true,
        });
      }

      authorProfile.inventory[item] += amount;
      authorProfile.inventory.mocoins -= cost;
      await authorProfile.inventory.save();

      const embed = new EmbedBuilder()
        .setTitle("Purchase succesful!")
        .setDescription(
          `Bought **${amount}** **${item}** for **${cost}** mo.coins.`
        )
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Performed by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor("#00ff00");

      try {
        await interaction.reply({ embeds: [embed] });
      } catch (err) {}
    }

    if (interaction.options.getSubcommand() == "list") {
      const embed = new EmbedBuilder()
        .setTitle("Market (1/1)")
        .setDescription(
          "On all products: 5% discount on 5+ quantity & 10% discount on 10+ quantity!"
        )
        .addFields(
          {
            name: "Medicine",
            value: "80 mo.coins",
            inline: true,
          },
          {
            name: "Treats",
            value: "40 mo.coins",
            inline: true,
          },
          {
            name: "Toy",
            value: "20 mo.coins",
            inline: true,
          }
        )
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("random"));

      await interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() == "sell") {
      await interaction.reply({
        content: `I haven't coded this command yet lol`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() == "trade") {
      await interaction.reply({
        content: `I haven't coded this command yet lol`,
        ephemeral: true,
      });
    }
  },
};
