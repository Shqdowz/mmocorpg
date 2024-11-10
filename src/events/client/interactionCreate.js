// -=+=- Dependencies -=+=-
const mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");

// -=+=- Schemas -=+=-
const Achievement = require("../../schemas/achievementSchema");
const Inventory = require("../../schemas/inventorySchema");
const Loadout = require("../../schemas/loadoutSchema");
const User = require("../../schemas/userSchema");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {
    let authorProfile = await User.findOne({
      userId: interaction.user.id,
    }).populate("guild");

    if (!authorProfile) {
      const achievement = new Achievement({
        _id: new mongoose.Types.ObjectId(),
      });
      await achievement.save();

      const inventory = new Inventory({
        _id: new mongoose.Types.ObjectId(),
      });
      await inventory.save();

      const loadout = new Loadout({
        _id: new mongoose.Types.ObjectId(),
      });
      await loadout.save();

      authorProfile = new User({
        _id: new mongoose.Types.ObjectId(),
        userId: interaction.user.id,
        username: interaction.user.username,

        achievement: achievement._id,
        inventory: inventory._id,
        loadout: loadout._id,
      });
      await authorProfile.save();
    }

    if (authorProfile.username != interaction.user.username) {
      authorProfile.username = interaction.user.username;
      await authorProfile.save();
    }

    if (interaction.isChatInputCommand()) {
      // If the author is blacklisted
      if (authorProfile.blacklist) {
        return await interaction.reply({
          content:
            "You are blacklisted from using the bot! This will not expire.",
          ephemeral: true,
        });
      }

      // If the author is banned
      if (authorProfile.ban - Date.now() > 0) {
        const next = Math.floor(new Date(authorProfile.ban.getTime()) / 1000);

        return await interaction.reply({
          content: `You are banned from using the bot! The ban will expire <t:${next}:R>.`,
          ephemeral: true,
        });
      } else {
        authorProfile.ban = null;
        await authorProfile.save();
      }
    }

    if (interaction.isChatInputCommand()) {
      const target = interaction.options.getUser("target");

      if (target) {
        let targetProfile = await User.findOne({ userId: target.id });

        if (!targetProfile) {
          const achievement = new Achievement({
            _id: new mongoose.Types.ObjectId(),
          });
          await achievement.save();

          const inventory = new Inventory({
            _id: new mongoose.Types.ObjectId(),
          });
          await inventory.save();

          const loadout = new Loadout({
            _id: new mongoose.Types.ObjectId(),
          });
          await loadout.save();

          const targetProfile = new User({
            _id: new mongoose.Types.ObjectId(),
            userId: target.id,
            username: target.username,

            achievement: achievement._id,
            inventory: inventory._id,
            loadout: loadout._id,
          });
          await targetProfile.save();
        }

        if (targetProfile.username != target.username) {
          targetProfile.username = target.username;
          await targetProfile.save();
        }
      }
    }

    if (interaction.isChatInputCommand()) {
      if (await client.handleCooldown("global", interaction, authorProfile))
        return;

      const { commands } = client;
      const { commandName, options } = interaction;

      const command = commands.get(commandName);
      if (!command) return;

      if (
        command.data.description.includes("(DEV)") &&
        interaction.user.id != "856545083310604308"
      ) {
        return await interaction.reply({
          content: `You cannot use this command.`,
          ephemeral: true,
        });
      }

      // Handle before
      await client.alwaysHandle(interaction, authorProfile);

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);

        const guild = await client.guilds.fetch("1250387871517638708");
        const channel = await guild.channels.fetch("1251589448215302185");

        let subcommands = [];

        if (options._group) subcommands.push(options._group);
        if (options._subcommand) subcommands.push(options._subcommand);

        const formattedOptions = options._hoistedOptions
          .map((option) => `${option.name}:${option.value}`)
          .join(" ");

        const embed = new EmbedBuilder()
          .setTitle(`Error occurred while executing /${commandName}`)
          .setDescription(`\`\`\`${error.stack}\`\`\``)
          .addFields([
            {
              name: "Subcommands",
              value: subcommands.length ? subcommands.join(" ") : "-",
            },
            {
              name: "Options",
              value: formattedOptions || "-",
            },
            {
              name: "User",
              value: `${interaction.user} (${interaction.user.username}, ${interaction.user.id})`,
            },
          ])
          .setTimestamp()
          .setColor("#FF0000");

        await channel.send({
          content: `<@856545083310604308>`,
          embeds: [embed],
        });

        await interaction.reply({
          content: `Something went wrong while executing this command. The error has been sent to the developers.`,
          ephemeral: true,
        });
      }

      // Handle after
      // await client.alwaysHandle("after", interaction, authorProfile);
    }

    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.autocomplete(interaction, client);
      } catch (error) {
        console.error(error);
      }
    }
  },
};
