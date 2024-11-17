// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// -=+=- Schemas -=+=-
const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("market")
    .setDescription("Buy, sell or trade items at the market")
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
              { name: "Medicine", value: "medicine" },
              { name: "Treats", value: "treat" },
              { name: "Toy", value: "toy" }
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
    const authorProfile = await client.fetchProfile(interaction.user.id);

    if (authorProfile.level < 10) {
      return await interaction.reply({
        content: `The market feature unlocks at level 10! Please come back later.`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() == "buy") {
      const item = interaction.options.getString("item");
      const amount = interaction.options.getNumber("amount") || 1;

      const discount = amount >= 10 ? 0.9 : amount >= 5 ? 0.95 : 1;

      const costMap = {
        medicine: 80 * amount * discount,
        treat: 40 * amount * discount,
        toy: 20 * amount * discount,
      };

      const cost = costMap[item];

      // If the author doesn't have the required mo.coins
      if (authorProfile.inventory["mocoins"] < cost) {
        return await interaction.reply({
          content: `You don't have enough mo.coins to buy this item!`,
          ephemeral: true,
        });
      }

      authorProfile.inventory[item] += amount;
      authorProfile.inventory["mocoins"] -= cost;
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

      await interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() == "list") {
      const embed = new EmbedBuilder()
        .setTitle("Market (1/1)")
        .setDescription(`There's currently no ongoing sale :(`)
        .addFields(
          {
            name: "Medicine",
            value: "80 mo.coins",
            inline: true,
          },
          {
            name: "Treat",
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
