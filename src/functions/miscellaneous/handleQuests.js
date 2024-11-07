const { EmbedBuilder } = require("discord.js");

const User = require("../../schemas/userSchema");

const wait = require("node:timers/promises").setTimeout;

module.exports = (client) => {
  client.handleQuests = async (interaction, userProfile, extra) => {
    async function UpdateQuest(quest, progress) {
      quest.progress = Math.min(quest.goal, quest.progress + progress);
      quest.completed = quest.progress == quest.goal;

      await userProfile.markModified("quests");
      await userProfile.save();
    }

    // Get the newest updated profile
    userProfile = await User.findOne({ userId: userProfile.userId });

    if (userProfile.cat) await userProfile.populate("cat");
    if (userProfile.guild) await userProfile.populate("guild");
    if (userProfile.party) await userProfile.populate("party");
    await userProfile.populate("inventory");

    const { options, commandName } = interaction;

    const allCommands = [commandName];
    if (options._group) allCommands.push(options._group);
    if (options._subcommand) allCommands.push(options._subcommand);
    const fullCommand = allCommands.map((command) => command).join(" ");

    for (const quest of userProfile.quests) {
      if (quest.completed || !quest.commands.includes(fullCommand)) continue;

      switch (quest.name) {
        case "Big Brawl":
          if (userProfile.party && userProfile.party.members.length == 3) {
            await UpdateQuest(quest, 1);
          }
          break;
        case "By a Thread":
          if (
            extra.player.profile.copy.hitPoints &&
            extra.player.profile.copy.hitPoints <
              extra.player.profile.copy.maxHitPoints * 0.2
          ) {
            await UpdateQuest(quest, 1);
          }
          break;
        case "Good Parent":
          await UpdateQuest(quest, 1);
          break;
        case "Immaculate Strength":
          await UpdateQuest(quest, extra.player.stats["Damage Dealt"]);
          break;
        case "Monster Hunter":
          await UpdateQuest(quest, extra.player.stats["Kills Made"]);
          break;
        case "One on One":
          for (const enemy of extra.enemies) {
            if (
              enemy.profile.copy.tier == "Boss" &&
              enemy.profile.copy.hitPoints == 0
            ) {
              if (quest.progress < quest.goal) {
                await UpdateQuest(quest, 1);
              }
            }
          }
          break;
        case "Quick Work":
          if (extra.player.stats["Turns Taken"] < 4) {
            await UpdateQuest(quest, 1);
          }
          break;
        case "Underdog":
          if (
            extra.enemies.every((enemy) => enemy.profile.copy.hitPoints == 0) &&
            extra.player.stats["Damage Taken"] >
              extra.player.stats["Damage Dealt"]
          ) {
            await UpdateQuest(quest, 1);
          }
          break;
        case "Unscathed":
          if (
            extra.player.profile.copy.hitPoints ==
            extra.player.profile.copy.maxHitPoints
          ) {
            await UpdateQuest(quest, 1);
          }
          break;
        case "Unstoppable":
          if (
            extra.enemies.every((enemy) => enemy.profile.copy.hitPoints == 0)
          ) {
            await UpdateQuest(quest, 1);
          } else {
            await UpdateQuest(quest, -quest.progress);
          }
          break;
      }

      if (quest.completed) {
        const Size =
          quest.difficulty == "Easy"
            ? "Small"
            : quest.difficulty == "Medium"
            ? "Medium"
            : "Large";
        const size = Size.toLowerCase();

        userProfile.inventory.crates[size] =
          (userProfile.inventory.crates[size] || 0) + 1;
        await userProfile.inventory.save();

        const embed = new EmbedBuilder()
          .setTitle(`Quest completed!`)
          .setDescription(`${quest.name}: ${quest.description}`)
          .addFields({
            name: `Reward`,
            value: `- ${client.getEmoji(`${size}_crate`)} ${Size} Crate x1`,
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
    }

    if (
      userProfile.quests.length &&
      userProfile.quests.every((quest) => quest.completed)
    ) {
      userProfile.quests = [];
      userProfile.experience += 25;
      await userProfile.save();

      await wait(1 * 1000);

      await interaction.channel.send({
        content: `${await client.users.fetch(
          userProfile.userId
        )} You completed all your quests! Here's a bonus **25** experience :)`,
      });
    }
  };
};
