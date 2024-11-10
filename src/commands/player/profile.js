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
    .setName("profile")
    .setDescription("View a profile")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user you want to view the profile of")
    ),

  async execute(interaction, client) {
    const user = interaction.options.getUser("target") || interaction.user;
    const userProfile = await User.findOne({
      userId: user.id,
    }).populate("guild");

    async function GenerateEmbed() {
      const embed = new EmbedBuilder()
        .setTitle(`${userProfile.username}'s profile`)
        .setDescription(
          `\n${client.getEmoji("level")} Level: **${
            userProfile.level
          }**\n${client.getEmoji("experience")} Experience: **${
            userProfile.experience
          } / ${userProfile.requiredExperience}**\n${client.getEmoji(
            "guild"
          )} Guild: **${
            userProfile.guild ? userProfile.guild.name : "No guild"
          }**`
        )
        .addFields([
          {
            name: "Stats",
            value: `${client.getEmoji("health")} HP: **${
              userProfile.hitPoints
            }**\n${client.getEmoji("speed")} SPD: **${userProfile.speed}**`,
            inline: true,
          },
        ])
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", userProfile));

      if (userProfile.statPoints) {
        embed.addFields([
          {
            name: "Stat Points",
            value: `${userProfile.statPoints} (click a button below to upgrade a stat!)`,
            inline: true,
          },
        ]);
      }

      return embed;
    }

    async function GenerateComponent() {
      if (userProfile.statPoints) {
        const hitpoints = new ButtonBuilder()
          .setCustomId(`hitpoints:${interaction.id}`)
          .setLabel(`+8 HP`)
          .setEmoji(client.getEmoji("health"))
          .setStyle(ButtonStyle.Primary)
          .setDisabled(userProfile.hitPoints == 300);
        const speed = new ButtonBuilder()
          .setCustomId(`speed:${interaction.id}`)
          .setLabel(`+0.08 SPD`)
          .setEmoji(client.getEmoji("speed"))
          .setStyle(ButtonStyle.Primary)
          .setDisabled(userProfile.speed == 3.0);

        return [new ActionRowBuilder().addComponents(hitpoints, speed)];
      }
      return [];
    }

    const reply = await interaction.reply({
      embeds: [await GenerateEmbed()],
      components: await GenerateComponent(),
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) =>
        i.user.id == userProfile.userId && i.customId.endsWith(interaction.id),
      time: 60 * 1000,
    });

    collector.on("collect", async (i) => {
      switch (i.customId) {
        case `hitpoints:${interaction.id}`:
          userProfile.hitPoints += 8;
          userProfile.maxHitPoints += 8;
          userProfile.statPoints -= 1;
          await userProfile.save();
          break;
        case `speed:${interaction.id}`:
          userProfile.speed = parseFloat((userProfile.speed + 0.08).toFixed(2));
          userProfile.statPoints -= 1;
          await userProfile.save();
          break;
      }

      await interaction.editReply({
        embeds: [await GenerateEmbed()],
        components: await GenerateComponent(),
      });

      if (!userProfile.statPoints) collector.stop();
    });

    collector.on("end", async () => {
      await interaction.editReply({
        embeds: [await GenerateEmbed()],
        components: [],
      });
    });
  },
};
