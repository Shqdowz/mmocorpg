const User = require("../../schemas/userSchema");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View a leaderboard")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("The category to view the leaderboard of")
        .setRequired(true)
        .addChoices(
          { name: "Player Level", value: "Player level" },
          { name: "Cat Level", value: "Cat level" },
          { name: "mo.coins", value: "mo.coins" }
        )
    ),
  async execute(interaction, client) {
    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    const category = interaction.options.getString("category");
    let users;

    switch (category) {
      case "Player level":
        users = (await User.find({}))
          .filter((user) => user.level > 1 || user.experience > 0)
          .sort((a, b) => {
            if (b.level === a.level) {
              return b.experience - a.experience;
            }
            return b.level - a.level;
          });
        break;
      case "Cat level":
        users = (await User.find({}).populate("cat"))
          .filter(
            (user) =>
              user.cat &&
              (user.cat.friendshipLevel > 1 ||
                user.cat.friendshipExperience > 0)
          )
          .sort((a, b) => {
            if (b.cat.friendshipLevel == a.cat.friendshipLevel) {
              return b.cat.friendshipExperience - a.cat.friendshipExperience;
            }
            return b.cat.friendshipLevel - a.cat.friendshipLevel;
          });
        break;
      case "mo.coins":
        users = (await User.find({}).populate("inventory"))
          .filter((user) => user.inventory.mocoins > 0)
          .sort((a, b) => {
            return b.inventory.mocoins - a.inventory.mocoins;
          });
        break;
    }

    const topUsers = users.slice(0, 10);

    const authorIndex = users.findIndex(
      (user) => user._id.toString() == authorProfile._id.toString()
    );
    const authorUser = users[authorIndex];

    const topUsersValues = topUsers.map((user, index) => {
      let value;
      switch (category) {
        case "Player level":
          value = `#${index + 1} - ${client.getEmoji("level")} **${
            user.level
          }**, ${client.getEmoji("experience")} **${user.experience}**`;
          break;
        case "Cat level":
          value = `#${index + 1} - ${client.getEmoji("level")} **${
            user.cat.friendshipLevel
          }**, ${client.getEmoji("experience")} **${
            user.cat.friendshipExperience
          }**`;
          break;
        case "mo.coins":
          value = `#${index + 1} - ${client.getEmoji("mocoin")} **${
            user.inventory.mocoins
          }**`;
          break;
      }

      return {
        name: `**${user.username}**`,
        value: value,
      };
    });

    let authorUserValue;
    if (authorUser) {
      switch (category) {
        case "Player level":
          authorUserValue = `${client.getEmoji("level")} **${
            authorUser.level
          }**, ${client.getEmoji("experience")} **${authorUser.experience}**`;
          break;
        case "Cat level":
          authorUserValue = `${client.getEmoji("level")} **${
            authorUser.cat.friendshipLevel
          }**, ${client.getEmoji("experience")} **${
            authorUser.cat.friendshipExperience
          }**`;
          break;
        case "mo.coins":
          authorUserValue = `${client.getEmoji("mocoin")} **${
            authorUser.inventory.mocoins
          }**`;
          break;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`${category} leaderboard`)
      .addFields([
        {
          name: "Top 10",
          value: topUsersValues
            .map((value) => `${value.value} - ${value.name}`)
            .join("\n"),
        },
        {
          name: "Your position",
          value: authorUser
            ? `#${authorIndex + 1} - ${authorUserValue} - **${
                authorUser.username
              }**`
            : "Not ranked",
        },
      ])
      .setFooter({
        iconURL: interaction.user.displayAvatarURL(),
        text: `Requested by ${interaction.user.username}`,
      })
      .setTimestamp()
      .setColor(client.getColor("random"));

    await interaction.reply({
      embeds: [embed],
    });
  },
};
