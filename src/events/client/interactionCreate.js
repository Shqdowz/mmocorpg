// -=+=- Dependencies -=+=-
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      // Fetch user profile
      const authorProfile = await client.fetchProfile(interaction.user.id);

      if (authorProfile.username != interaction.user.username) {
        authorProfile.username = interaction.user.username;
        await authorProfile.save();
      }

      // Fetch target profile
      const target = interaction.options.getUser("target");

      if (target) {
        const targetProfile = await client.fetchProfile(target.id);

        if (targetProfile.username != target.username) {
          targetProfile.username = target.username;
          await targetProfile.save();
        }
      }

      // Check for limitations
      if (authorProfile.blacklist) {
        return await interaction.reply({
          content:
            "You are blacklisted from using the bot! This will not expire.",
          ephemeral: true,
        });
      }

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

      // Handle command
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
