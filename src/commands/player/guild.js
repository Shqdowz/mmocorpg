// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");

// -=+=- Schemas -=+=-
const Guild = require("../../schemas/guildSchema");
const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guild")
    .setDescription("Guild commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new guild")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the guild")
            .setMinLength(3)
            .setMaxLength(15)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("A brief description of the guild")
            .setMaxLength(100)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Shows information about a guild")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The user you want to view the guild of")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("join")
        .setDescription("Join an existing guild")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the guild to join")
            .setMinLength(3)
            .setMaxLength(15)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kick")
        .setDescription("Kick a member from the guild")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The user to kick")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("leave").setDescription("Leave your current guild")
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("requests")
        .setDescription("Manage join requests")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("list")
            .setDescription("List pending join requests")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("accept")
            .setDescription("Accept a join request")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user whose request to accept")
                .setRequired(true)
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("settings")
        .setDescription("Edit guild settings")
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("Change the guild's description")
            .setMaxLength(100)
        )
        .addBooleanOption((option) =>
          option
            .setName("isopen")
            .setDescription("Whether the guild is open for new members")
        )
        .addBooleanOption((option) =>
          option
            .setName("joinrequestapproval")
            .setDescription(
              "Whether the guild requires approval for join requests"
            )
        )
    ),

  async execute(interaction, client) {
    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    await authorProfile.populate("guild");

    if (authorProfile.level < 16) {
      return await interaction.reply({
        content: `The guilds feature unlocks at level 16! Please come back later.`,
        ephemeral: true,
      });
    }

    const maxMembers = 10;

    if (interaction.options.getSubcommand() == "create") {
      // If the author is already in a guild
      if (authorProfile.guild) {
        return await interaction.reply({
          content:
            "You are already in a guild. Please leave your current guild first.",
          ephemeral: true,
        });
      }

      const name = interaction.options.getString("name");
      const lowerCaseName = name.toLowerCase();
      const description =
        interaction.options.getString("description") || "No description";

      const guildExists = await Guild.findOne({
        lowerCaseName: lowerCaseName,
      });

      // If a guild with the specified name already exists
      if (guildExists) {
        await interaction.reply({
          content: "A guild with that name already exists!",
          ephemeral: true,
        });
      } else {
        const guild = new Guild({
          _id: new mongoose.Types.ObjectId(),
          name,
          description,
          lowerCaseName,
          leader: authorProfile._id,
          members: [authorProfile._id],
        });
        await guild.save();

        authorProfile.guild = guild._id;
        await authorProfile.save();

        const embed = new EmbedBuilder()
          .setTitle(`Guild Created: ${guild.name}`)
          .setDescription(guild.description)
          .addFields([
            {
              name: "Is open",
              value: `${guild.settings.isOpen}`,
              inline: true,
            },
            {
              name: "On request",
              value: `${guild.settings.joinRequestApproval}`,
              inline: true,
            },
          ])
          .setFooter({
            iconURL: interaction.user.displayAvatarURL(),
            text: `Performed by ${interaction.user.username}`,
          })
          .setTimestamp()
          .setColor(client.getColor("random"));

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    if (interaction.options.getSubcommand() == "info") {
      const user = interaction.options.getUser("target") || interaction.user;

      const guild = authorProfile.guild;

      // If the author/specified user isn't in a guild
      if (!guild) {
        return await interaction.reply({
          content: "No guild found.",
          ephemeral: true,
        });
      }

      await guild.populate("leader");
      await guild.populate("members");

      let members = "";
      guild.members.forEach((member, index) => {
        members += `${index + 1}. **${member.username}**\n`;
      });

      members += `Total members: **${guild.members.length} / 10**`;

      const embed = new EmbedBuilder()
        .setTitle(`${authorProfile.username}'s guild: ${guild.name}`)
        .setDescription(`${guild.description}`)
        .addFields([
          {
            name: `${client.getEmoji("leader")} Leader`,
            value: guild.leader.username,
          },
          { name: `${client.getEmoji("member")} Members`, value: members },
          { name: "Is open", value: guild.settings.isOpen ? "Yes" : "No" },
          {
            name: "On request",
            value: guild.settings.joinRequestApproval ? "Yes" : "No",
          },
        ])
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("random"));

      await interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() == "join") {
      const name = interaction.options.getString("name");
      const lowerCaseName = name.toLowerCase();

      // If the user is already in a guild
      if (authorProfile.guild) {
        return await interaction.reply({
          content:
            "You are already in a guild. Please leave your current guild first.",
          ephemeral: true,
        });
      }

      const guild = await Guild.findOne({
        lowerCaseName: lowerCaseName,
      });

      // If the specified guild doesn't exist
      if (!guild) {
        return await interaction.reply({
          content: `Guild **${name}** not found.`,
          ephemeral: true,
        });
      }

      // If the guild is full
      if (guild.members.length >= maxMembers) {
        return await interaction.reply({
          content: "This guild has reached the maximum number of members.",
          ephemeral: true,
        });
      }

      // If the guild is closed
      if (!guild.settings.isOpen) {
        return await interaction.reply({
          content: "This guild currently doesn't accept new members.",
          ephemeral: true,
        });
      }

      // Remove previous pending guild join request
      if (authorProfile.pendingJoinRequest) {
        const previousGuild = await Guild.findById(
          authorProfile.pendingJoinRequest
        );

        const requestIndex = previousGuild.joinRequests.findIndex(
          (request) => request.user.toString() == authorProfile._id.toString()
        );

        previousGuild.joinRequests.splice(requestIndex, 1);
        await previousGuild.save();
      }

      // Send pending guild join request
      if (guild.settings.joinRequestApproval) {
        guild.joinRequests.push({
          user: authorProfile._id,
          username: authorProfile.username,
        });
        await guild.save();

        authorProfile.pendingJoinRequest = guild._id;
        await authorProfile.save();

        return await interaction.reply({
          content: "Sent a request to join the guild!",
          ephemeral: true,
        });
      }

      guild.members.push(authorProfile._id);
      await guild.save();

      authorProfile.guild = guild._id;
      authorProfile.pendingJoinRequest = null;
      await authorProfile.save();

      await interaction.reply({
        content: `You have joined the guild: **${guild.name}**`,
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() == "kick") {
      const user = await interaction.options.getUser("target");

      const targetProfile = await User.findOne({
        userId: user.id,
      });

      const guild = targetProfile.guild;

      // If the specified user isn't in a guild
      if (!guild) {
        return await interaction.reply({
          content: "That user is not in a guild.",
          ephemeral: true,
        });
      }

      // If the specified user isn't in the author's guild
      if (guild._id.toString() != authorProfile.guild._id.toString()) {
        return await interaction.reply({
          content: "That user is not in your guild.",
          ephemeral: true,
        });
      }

      // If the author isn't the guild's leader
      if (guild.leader.toString() != authorProfile._id.toString()) {
        return await interaction.reply({
          content: "You are not the leader of the guild.",
          ephemeral: true,
        });
      }

      const memberToKick = await User.findOne({ userId: user.id });
      guild.members.pull(memberToKick._id);
      await guild.save();

      memberToKick.guild = null;
      await memberToKick.save();

      const embed = new EmbedBuilder()
        .setTitle("Member Kicked!")
        .setDescription(`**${user.username}** has been kicked from the guild.`)
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Performed by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("random"));

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.options.getSubcommand() == "leave") {
      const guild = authorProfile.guild;

      // If the author isn't in a guild
      if (!guild) {
        return await interaction.reply({
          content: "You are not in a guild.",
          ephemeral: true,
        });
      }

      guild.members.pull(authorProfile._id);

      if (guild.members.length > 0) {
        const oldestMember = guild.members[0];
        guild.leader = oldestMember;
        await guild.save();
      } else {
        await Guild.findByIdAndDelete(guild._id);
      }

      authorProfile.guild = null;
      await authorProfile.save();

      await interaction.reply({
        content: "You have left the guild.",
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommandGroup() == "requests") {
      const guild = authorProfile.guild;

      // If the author isn't in a guild
      if (!guild) {
        return await interaction.reply({
          content: "You are not in a guild.",
          ephemeral: true,
        });
      }

      // If the author isn't the leader of the guild
      if (guild.leader.toString() != authorProfile._id.toString()) {
        return await interaction.reply({
          content: "You are not the leader of the guild.",
          ephemeral: true,
        });
      }

      if (interaction.options.getSubcommand() == "list") {
        // If there are no pending join requests
        if (guild.joinRequests.length == 0) {
          return await interaction.reply({
            content: "There are no pending join requests.",
            ephemeral: true,
          });
        }

        let requestList = "";
        guild.joinRequests.forEach((request, index) => {
          requestList += `${index + 1}. **${request.username}**\n`;
        });

        const embed = new EmbedBuilder()
          .setTitle("Pending join requests")
          .setDescription(`Requests to join **${guild.name}**:`)
          .addFields([{ name: "Requests", value: requestList }])
          .setFooter({
            iconURL: interaction.user.displayAvatarURL(),
            text: `Requested by ${interaction.user.username}`,
          })
          .setTimestamp()
          .setColor(client.getColor("random"));

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (interaction.options.getSubcommand() == "accept") {
        // If the guild is full
        if (guild.members.length >= maxMembers) {
          return await interaction.reply({
            content: "This guild has reached the maximum number of members.",
            ephemeral: true,
          });
        }

        const user = interaction.options.getUser("user");

        const requestIndex = guild.joinRequests.findIndex(
          (request) => request.username.toString() == user.username
        );

        // If the specified user didn't send a join request
        if (requestIndex == -1) {
          return await interaction.reply({
            content: "That user has not sent a join request.",
            ephemeral: true,
          });
        }

        const acceptedUserProfile = await User.findOne({
          username: user.username,
        });
        acceptedUserProfile.guild = guild._id;
        acceptedUserProfile.pendingJoinRequest = null;
        await acceptedUserProfile.save();

        guild.members.push(acceptedUserProfile._id);
        guild.joinRequests.splice(requestIndex, 1);
        await guild.save();

        const embed = new EmbedBuilder()
          .setTitle("Join request accepted")
          .setDescription(
            `**${acceptedUserProfile.username}** has been accepted into **${guild.name}**.`
          )
          .setTimestamp()
          .setColor(client.getColor("random"));

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    if (interaction.options.getSubcommand() == "settings") {
      const description = interaction.options.getString("description");
      const isOpen = interaction.options.getBoolean("isopen");
      const joinRequestApproval = interaction.options.getBoolean(
        "joinrequestapproval"
      );

      const guild = authorProfile.guild;

      // If the author isn't in a guild
      if (!guild) {
        return await interaction.reply({
          content: "You are not in a guild.",
          ephemeral: true,
        });
      }

      // If the author isn't the guild leader
      if (guild.leader.toString() != authorProfile._id.toString()) {
        return await interaction.reply({
          content: "You are not the leader of the guild.",
          ephemeral: true,
        });
      }

      if (description) {
        guild.description = description;
      }
      if (isOpen != null) {
        guild.settings.isOpen = isOpen;
      }
      if (joinRequestApproval != null) {
        guild.settings.joinRequestApproval = joinRequestApproval;
      }
      await guild.save();

      const embed = new EmbedBuilder()
        .setTitle(`Guild settings updated: **${guild.name}**`)
        .setDescription("Updated guild settings:")
        .addFields([
          {
            name: "Description",
            value: guild.description || "No description",
          },
          {
            name: "Open for new members",
            value: guild.settings.isOpen ? "Yes" : "No",
          },
          {
            name: "Join request approval required",
            value: guild.settings.joinRequestApproval ? "Yes" : "No",
          },
        ])
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Performed by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("random"));

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
