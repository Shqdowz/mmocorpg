// -=+=- Schemas -=+=-
const Quest = require("../../schemas/questSchema");

module.exports = (client) => {
  client.handleCooldown = async (cooldown, interaction, authorProfile) => {
    function GetRefreshTime() {
      const now = new Date();

      const amsterdamOffset = 2 * 60;
      const amsterdamTime = new Date(
        now.getTime() + (now.getTimezoneOffset() + amsterdamOffset) * 60 * 1000
      ).setHours(24, 0, 0, 0);

      return amsterdamTime;
    }

    async function RefreshQuests() {
      authorProfile.quests = [];
      await authorProfile.save();

      const easyQuests = await Quest.find({
        level: { $lte: authorProfile.level },
        difficulty: "Easy",
      });
      const mediumQuests = await Quest.find({
        level: { $lte: authorProfile.level },
        difficulty: "Medium",
      });
      const hardQuests = await Quest.find({
        level: { $lte: authorProfile.level },
        difficulty: "Hard",
      });

      for (let i = 0; i < 3; i++) {
        let rng = Math.random();
        const quests =
          rng < 0.6 ? easyQuests : rng < 0.9 ? mediumQuests : hardQuests;
        const quest = quests[Math.floor(Math.random() * quests.length)];

        if (quest.scale) {
          quest.goal = Math.round(
            quest.goal * (1 + quest.scale * (authorProfile.level - 1))
          );
        }

        authorProfile.quests.push({
          name: quest.name,
          description: quest.description,
          difficulty: quest.difficulty,
          progress: quest.progress,
          goal: quest.goal,
          completed: quest.completed,
          commands: quest.commands,
        });
        await authorProfile.save();
      }
    }

    const cooldownMap = {
      global: async (interaction, authorProfile) => {
        if (
          authorProfile.cooldowns.global &&
          new Date() < authorProfile.cooldowns.global
        ) {
          return await interaction.reply({
            content: "You are currently on global cooldown!",
            ephemeral: true,
          });
        }
        authorProfile.cooldowns.global = new Date(
          new Date().getTime() + 3 * 1000
        );
        await authorProfile.save();
      },
      daily: async (interaction, authorProfile) => {
        const day = 24 * 60 * 60 * 1000;

        if (
          authorProfile.cooldowns.daily &&
          new Date() < authorProfile.cooldowns.daily
        ) {
          const next = Math.floor(
            new Date(authorProfile.cooldowns.daily.getTime()).getTime() / 1000
          );
          return await interaction.reply({
            content: `You already claimed today's daily reward! You can claim again <t:${next}:R>.`,
            ephemeral: true,
          });
        }

        if (
          authorProfile.cooldowns.daily &&
          new Date() < authorProfile.cooldowns.daily + day
        ) {
          authorProfile.dailyStreak += 1;
          await authorProfile.save();
        } else {
          authorProfile.dailyStreak = 1;
          await authorProfile.save();
        }

        authorProfile.cooldowns.daily = GetRefreshTime();
        await authorProfile.save();
      },
      quests: async (interaction, authorProfile) => {
        if (
          !authorProfile.cooldowns.quests ||
          authorProfile.cooldowns.quests < new Date()
        ) {
          authorProfile.cooldowns.quests = GetRefreshTime();
          await authorProfile.save();

          await RefreshQuests();
        }
      },
      pet: async (interaction, authorProfile) => {
        if (
          authorProfile.cooldowns.pet &&
          new Date() < authorProfile.cooldowns.pet
        ) {
          const next = Math.floor(
            new Date(authorProfile.cooldowns.pet.getTime()).getTime() / 1000
          );
          return await interaction.reply({
            content: `You recently petted **${cat.name}**! You can pet again <t:${next}:R>.`,
            ephemeral: true,
          });
        }
        authorProfile.cooldowns.pet = new Date(
          new Date().getTime() + 60 * 1000
        );
        authorProfile.save();
      },
    };

    return cooldownMap[cooldown](interaction, authorProfile);
  };
};
