// -=+=- Dependencies -=+=-
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const mongoose = require("mongoose");

// -=+=- Schemas -=+=-
const Party = require("../../schemas/partySchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("party")
    .setDescription("Party commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Shows information about your party")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("invite")
        .setDescription("Invite someone to your party")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The user to invite")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kick")
        .setDescription("Kick a party member")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The user to kick")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("leave").setDescription("Leave your current party")
    ),

  async execute(interaction, client) {
    let authorProfile = await client.fetchProfile(interaction.user.id);

    const author = interaction.user;

    if (!authorProfile.party) {
      const party = new Party({
        _id: new mongoose.Types.ObjectId(),
        leader: authorProfile._id,
        members: [
          {
            profile: authorProfile._id,
            ready: authorProfile.settings["Always Ready"],
          },
        ],
      });
      await party.save();

      authorProfile.party = party._id;
      await authorProfile.save();
    }

    const target = interaction.options.getUser("target");
    let targetProfile;
    if (target) {
      targetProfile = await client.fetchProfile(target.id);
    }

    const maxMembers = 3;

    if (interaction.options.getSubcommand() == "info") {
      async function GenerateEmbed() {
        const embed = new EmbedBuilder()
          .setTitle(`${author.username}'s party`)
          .addFields([
            { name: "Leader", value: authorProfile.party.leader.username },
            {
              name: "Members",
              value: `${authorProfile.party.members
                .map(
                  (member, index) =>
                    `${index + 1}. ${member.ready ? `🟢` : `🔴`} **${
                      member.profile.username
                    }**`
                )
                .join("\n")}\nTotal members: **${
                authorProfile.party.members.length
              } / 3**`,
            },
          ])
          .setFooter({
            iconURL: author.displayAvatarURL(),
            text: `Requested by ${author.username}`,
          })
          .setTimestamp()
          .setColor(
            authorProfile.party.members.every((member) => member.ready)
              ? "Green"
              : "Red"
          );

        return embed;
      }

      const readyButton = new ButtonBuilder()
        .setCustomId(`ready:${interaction.id}`)
        .setLabel(`Ready`)
        .setStyle(ButtonStyle.Success);

      const unreadyButton = new ButtonBuilder()
        .setCustomId(`unready:${interaction.id}`)
        .setLabel(`Unready`)
        .setStyle(ButtonStyle.Danger);

      const reply = await interaction.reply({
        embeds: [await GenerateEmbed()],
        components: [
          new ActionRowBuilder().addComponents(readyButton, unreadyButton),
        ],
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.customId.endsWith(interaction.id),
        time: 30 * 1000,
      });

      collector.on("collect", async (i) => {
        collector.resetTimer({ time: 30 * 1000 });

        const clickerProfile = await client.fetchProfile(i.user.id);

        const memberIndex = authorProfile.party.members.findIndex(
          (member) =>
            member.profile._id.toString() == clickerProfile._id.toString()
        );

        if (memberIndex == -1) return;

        switch (i.customId) {
          case `ready:${interaction.id}`:
            authorProfile.party.members[memberIndex].ready = true;
            await authorProfile.party.save();
            break;
          case `unready:${interaction.id}`:
            authorProfile.party.members[memberIndex].ready = false;
            await authorProfile.party.save();
            break;
        }

        await interaction.editReply({ embeds: [await GenerateEmbed()] });
        await i.reply({
          content: `You are now ${
            i.customId == `ready:${interaction.id}` ? `ready` : `unready`
          }!`,
          ephemeral: true,
        });
      });

      collector.on("end", async () => {
        await interaction.editReply({
          embeds: [await GenerateEmbed()],
          components: [],
        });
      });
    }

    if (interaction.options.getSubcommand() == "invite") {
      // If the author isn't the leader of the party
      if (
        authorProfile.party.leader._id.toString() !=
        authorProfile._id.toString()
      ) {
        return await interaction.reply({
          content: "You are not the leader of the party.",
          ephemeral: true,
        });
      }

      // If the author invites themselves
      if (authorProfile.username == targetProfile.username) {
        return await interaction.reply({
          content: "You can't invite yourself!",
          ephemeral: true,
        });
      }

      // If the author's party is full
      if (authorProfile.party.members.length >= maxMembers) {
        return await interaction.reply({
          content: "This party has reached the maximum number of members.",
          ephemeral: true,
        });
      }

      if (targetProfile.party) {
        // If the author invites someone that is already in their party
        if (
          targetProfile.party._id.toString() ==
          authorProfile.party._id.toString()
        ) {
          return await interaction.reply({
            content: "That user is already in your party!",
            ephemeral: true,
          });
        }
      }

      let embed = new EmbedBuilder()
        .setTitle(`Party invitation!`)
        .setDescription(
          `${author.username} invited ${target.username} to their party. Will you accept, ${target.username}?`
        )
        .setFooter({
          iconURL: author.displayAvatarURL(),
          text: `Performed by ${author.username}`,
        })
        .setTimestamp()
        .setColor("Aqua");

      const acceptButton = new ButtonBuilder()
        .setCustomId(`accept:${interaction.id}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success);

      const declineButton = new ButtonBuilder()
        .setCustomId(`decline:${interaction.id}`)
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger);

      const reply = await interaction.reply({
        content: `${target}`,
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(acceptButton, declineButton),
        ],
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) =>
          i.user.id == target.id && i.customId.endsWith(interaction.id),
        time: 60 * 1000,
      });

      let clicked = false;
      collector.on("collect", async (i) => {
        authorProfile = await client.fetchProfile(interaction.user.id);

        if (authorProfile.party.members.length >= 3) {
          return await i.reply({
            content: `Unfortunately, the party has already reached the maximum players just now.`,
            ephemeral: true,
          });
        }

        switch (i.customId) {
          case `accept:${interaction.id}`:
            clicked = true;

            if (targetProfile.party) {
              const memberIndex = targetProfile.party.members.findIndex(
                (member) =>
                  member.profile._id.toString() == targetProfile._id.toString()
              );

              targetProfile.party.members.splice(memberIndex, 1);
              await targetProfile.party.save();

              if (
                targetProfile._id.toString() ==
                targetProfile.party.leader._id.toString()
              ) {
                if (targetProfile.party.members.length > 0) {
                  targetProfile.party.leader =
                    targetProfile.party.members[0].profile._id;
                  await targetProfile.party.save();
                } else {
                  await Party.findByIdAndDelete(targetProfile.party._id);
                }
              }
            }

            authorProfile.party.members.push({
              profile: targetProfile._id,
              ready: targetProfile.settings["Always Ready"],
            });
            await authorProfile.party.save();

            targetProfile.party = authorProfile.party._id;
            await targetProfile.save();

            embed = new EmbedBuilder()
              .setTitle(`Party invitation accepted!`)
              .setDescription(
                `${target.username} is now in ${author.username}'s party.`
              )
              .setFooter({
                iconURL: target.displayAvatarURL(),
                text: `Performed by ${target.username}`,
              })
              .setTimestamp()
              .setColor("Green");
            break;
          case `decline:${interaction.id}`:
            clicked = true;

            embed = new EmbedBuilder()
              .setTitle(`Party invitation declined!`)
              .setDescription(`${target.username} declined the invite.`)
              .setFooter({
                iconURL: target.displayAvatarURL(),
                text: `Performed by ${target.username}`,
              })
              .setTimestamp()
              .setColor("Red");
            break;
        }

        collector.stop();
      });

      collector.on("end", async () => {
        acceptButton.setDisabled(true);
        declineButton.setDisabled(true);

        if (!clicked) {
          embed = new EmbedBuilder()
            .setTitle(`Party invitation missed!`)
            .setDescription(`${target.username} missed the invite.`)
            .setTimestamp()
            .setColor("Grey");
        }

        await interaction.editReply({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(acceptButton, declineButton),
          ],
        });
      });
    }

    if (interaction.options.getSubcommand() == "kick") {
      // If the author isn't the party leader
      if (
        authorProfile.party.leader._id.toString() !=
        authorProfile._id.toString()
      ) {
        return await interaction.reply({
          content: "You are not the leader of the party.",
          ephemeral: true,
        });
      }

      // If the author tries to kick themselves
      if (targetProfile.username == authorProfile.username) {
        return await interaction.reply({
          content: "You can't kick yourself!",
          ephemeral: true,
        });
      }

      // If the specified user isn't in the author's party
      if (
        !targetProfile.party ||
        targetProfile.party._id.toString() != authorProfile.party._id.toString()
      ) {
        return await interaction.reply({
          content: "That user is not in your party.",
          ephemeral: true,
        });
      }

      const memberIndex = targetProfile.party.members.findIndex(
        (member) =>
          member.profile._id.toString() == targetProfile._id.toString()
      );

      targetProfile.party.members.splice(memberIndex, 1);
      await targetProfile.party.save();

      targetProfile.party = null;
      await targetProfile.save();

      const embed = new EmbedBuilder()
        .setTitle("Member Kicked!")
        .setDescription(
          `**${target.username}** has been kicked from the party.`
        )
        .setFooter({
          iconURL: author.displayAvatarURL(),
          text: `Performed by ${author.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("random"));

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.options.getSubcommand() == "leave") {
      const memberIndex = authorProfile.party.members.findIndex(
        (member) =>
          member.profile._id.toString() == authorProfile._id.toString()
      );

      authorProfile.party.members.splice(memberIndex, 1);
      await authorProfile.party.save();

      if (authorProfile.party.members.length > 0) {
        authorProfile.party.leader = authorProfile.party.members[0].profile._id;
        await authorProfile.party.save();
      } else {
        await Party.findByIdAndDelete(authorProfile.party._id);
      }

      authorProfile.party = null;
      await authorProfile.save();

      await interaction.reply({
        content: "You have left the party.",
        ephemeral: true,
      });
    }
  },
};
