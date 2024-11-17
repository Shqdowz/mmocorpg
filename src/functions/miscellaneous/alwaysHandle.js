// -=+=- Dependencies -=+=-
const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.alwaysHandle = async (interaction, authorProfile) => {
    authorProfile = await client.fetchProfile(authorProfile.userId);

    // Level up handle
    async function HandleLevelUp() {
      if (authorProfile.experience < authorProfile.requiredExperience) return;

      while (authorProfile.experience >= authorProfile.requiredExperience) {
        authorProfile.experience -= authorProfile.requiredExperience;
        authorProfile.requiredExperience += 20;
        authorProfile.level += 1;
        if (authorProfile.level % 3 == 1) authorProfile.statPoints += 1;
        await authorProfile.save();

        authorProfile.inventory.mocoins += authorProfile.level * 100;
        await authorProfile.inventory.save();
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎊 Congratulations ${interaction.user.username}! 🎊`)
        .setDescription(`You leveled up to level **${authorProfile.level}**!`)
        .addFields({
          name: `Rewards`,
          value: `- ${client.getEmoji("mocoin")} x${authorProfile.level * 100}${
            authorProfile.level % 3 == 1 ? `\n- 1 Stat Point` : ``
          }`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", authorProfile));

      if (authorProfile.level % 3 == 1) {
        const contents = [
          "Quests",
          "Level 2 gear",
          "Market",
          "Level 3 gear",
          "Guilds",
          "Level 4 gear",
          "Dungeons",
          "Level 5 gear",
          "Cat",
          "Level 6 gear",
          "Raids",
          "Level 7 gear",
          "Nothing", // add more from here
          "Level 8 gear",
          "Nothing",
          "Level 9 gear",
          "Nothing",
          "Level 10 gear",
          "Nothing",
          "Level 11 gear",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
          "Nothing",
        ];

        const content = contents[Math.floor((authorProfile.level - 1) / 3)];

        embed.addFields({
          name: `Unlocked new content!`,
          value: `- ${content}`,
        });
      }

      await interaction.channel.send({
        content: `${interaction.user}`,
        embeds: [embed],
      });
    }

    await HandleLevelUp();

    if (authorProfile.level >= 4) {
      await client.handleCooldown("quests", interaction, authorProfile);
    }

    // async function DecayCat() {
    //   // Make it check for every hour starting my midnight
    //   const hour = 60 * 60 * 1000;

    //   if (Date.now() - authorProfile.cat.previousDecay > hour) {
    //     const hoursPassed = Math.floor(
    //       (Date.now() - authorProfile.cat.previousDecay) / hour
    //     );

    //     const decayIncreaser =
    //       authorProfile.cat.growthStage == "kitten"
    //         ? 1
    //         : authorProfile.cat.growthStage == "juvenile"
    //         ? 2
    //         : authorProfile.cat.growthStage == "adolescent"
    //         ? 3
    //         : 4;

    //     for (let i = 0; i < hoursPassed; i++) {
    //       const healthDecay = Math.ceil(Math.random() * 4) + decayIncreaser;
    //       const hungerDecay =
    //         Math.ceil(Math.random() * 4) + (decayIncreaser + 1);
    //       const happinessDecay =
    //         Math.ceil(Math.random() * 4) + (decayIncreaser + 2);

    //       authorProfile.cat.health = Math.max(
    //         1,
    //         authorProfile.cat.health - healthDecay
    //       );
    //       authorProfile.cat.hunger = Math.max(
    //         1,
    //         authorProfile.cat.hunger - hungerDecay
    //       );
    //       authorProfile.cat.happiness = Math.max(
    //         1,
    //         authorProfile.cat.happiness - happinessDecay
    //       );
    //     }
    //     await authorProfile.cat.save();
    //   }
    // }

    // await DecayCat();

    async function HandleCatLevelUp() {}
  };
};
