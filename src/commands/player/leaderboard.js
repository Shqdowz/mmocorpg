// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// -=+=- Schemas -=+=-
const User = require("../../schemas/userSchema");

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

    const usersMap = {
      "Player level": (await User.find({}))
        .filter((user) => user.level > 1 || user.experience > 0)
        .sort((a, b) => {
          if (b.level === a.level) {
            return b.experience - a.experience;
          }
          return b.level - a.level;
        }),
      "Cat level": (await User.find({}).populate("cat"))
        .filter(
          (user) =>
            user.cat &&
            (user.cat.friendshipLevel > 1 || user.cat.friendshipExperience > 0)
        )
        .sort((a, b) => {
          if (b.cat.friendshipLevel == a.cat.friendshipLevel) {
            return b.cat.friendshipExperience - a.cat.friendshipExperience;
          }
          return b.cat.friendshipLevel - a.cat.friendshipLevel;
        }),
      "mo.coins": (await User.find({}).populate("inventory"))
        .filter((user) => user.inventory["mo.coins"] > 0)
        .sort((a, b) => {
          return b.inventory["mo.coins"] - a.inventory["mo.coins"];
        }),
    };

    const allUsers = usersMap[category];

    const topUsers = allUsers.slice(0, 10);

    const authorIndex = allUsers.findIndex(
      (user) => user._id.toString() == authorProfile._id.toString()
    );
    const authorUser = allUsers[authorIndex];

    const topUsersValues = topUsers.map((user, index) => {
      const valueMap = {
        "Player level": `#${index + 1} - ${client.getEmoji("level")} **${
          user.level
        }**, ${client.getEmoji("experience")} **${user.experience}**`,
        "Cat level": `#${index + 1} - ${client.getEmoji("level")} **${
          user.cat.friendshipLevel
        }**, ${client.getEmoji("experience")} **${
          user.cat.friendshipExperience
        }**`,
        "mo.coins": `#${index + 1} - ${client.getEmoji("mocoin")} **${
          user.inventory["mo.coins"]
        }**`,
      };

      const value = valueMap[category];

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
            authorUser.inventory["mo.coins"]
          }**`;
          break;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`${category} leaderboard`)
      .addFields([
        {
          name: "Top 10",
          value:
            topUsersValues
              .map((value) => `${value.value} - ${value.name}`)
              .join("\n") || "nobody lol",
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
