// -=+=- Dependencies -=+=-
const { EmbedBuilder } = require("discord.js");

// -=+=- Utility -=+=-
const wait = require("node:timers/promises").setTimeout;

module.exports = (client) => {
  client.handleAchievements = async (interaction, userProfile, extra) => {
    // Get the newest updated profile
    userProfile = await client.fetchProfile(userProfile.userId);

    async function UpdateAchievement(achievement, progress) {
      achievement.progress = Math.min(
        achievement.goal,
        achievement.progress + progress
      );

      if (achievement.progress > achievement.goal) {
        // if +amount
        // achievement.goal = achievement.goal + (achievement.goal / achievement.tier)
        // achievement.tier++;

        // if *amount
        achievement.goal *= 2;
        achievement.tier++;
      }

      await userProfile.achievement.save();
    }

    const { options, commandName } = interaction;

    const allCommands = [commandName];
    if (options._group) allCommands.push(options._group);
    if (options._subcommand) allCommands.push(options._subcommand);
    const fullCommand = allCommands.map((command) => command).join(" ");

    for (const [name, data] of Object.entries(userProfile.achievement)) {
      if (data.tier > 5 || data.commands.includes(fullCommand)) continue;

      const achievement = userProfile.achievement[name];

      switch (name) {
        case "Battle Master":
          if (
            extra.enemies.every((enemy) => enemy.profile.copy.hitPoints == 0)
          ) {
            await UpdateAchievement(achievement, 1);
          }
          break;
      }
    }

    if (ach.completed) {
      userProfile.inventory.crates.large =
        (userProfile.inventory.crates.large || 0) + 1;
      await userProfile.inventory.save();

      const embed = new EmbedBuilder()
        .setTitle(`Achievement completed!`)
        .setDescription(
          `\`(${achievement.tier})\` ${quest.name}: ${quest.description}`
        )
        .addFields({
          name: `Reward`,
          value: `- ${client.getEmoji(`${size}_crate`)} Large Crate x1`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", userProfile));

      setTimeout(async () => {
        await interaction.channel.send({
          content: `${await client.users.fetch(userProfile.userId)}`,
          embeds: [embed],
        });
      }, 50);
    }
  };
};
