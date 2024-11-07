const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward"),

  async execute(interaction, client) {
    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    function GetRefreshTime() {
      const now = new Date();

      const amsterdamOffset = 2 * 60;
      const amsterdamTime = new Date(
        now.getTime() + (now.getTimezoneOffset() + amsterdamOffset) * 60 * 1000
      ).setHours(24, 0, 0, 0);

      return amsterdamTime;
    }

    if (await client.handleCooldown("daily", interaction, authorProfile))
      return;

    const increase = authorProfile.dailyStreak * 0.04 + 1;

    await authorProfile.populate("inventory");

    const moCoins = Math.ceil(
      (Math.random() * 75 + 24) * Math.min(increase, 5)
    );
    authorProfile.inventory.mocoins += moCoins;

    let crates;
    switch (Math.floor(increase)) {
      case 1:
        crates = `- ${client.getEmoji("small_crate")} **+1** Small Crate`;

        authorProfile.inventory.crates.small++;
        break;
      case 2:
        crates = `- ${client.getEmoji("medium_crate")} **+1** Medium Crate`;

        authorProfile.inventory.crates.medium++;
        break;
      case 3:
        crates = `- ${client.getEmoji("large_crate")} **+1** Large Crate`;

        authorProfile.inventory.crates.large++;
        break;
      case 4:
        crates = `- ${client.getEmoji(
          "small_crate"
        )} **+1** Small Crate\n- ${client.getEmoji(
          "large_crate"
        )} **+1** Large Crate`;

        authorProfile.inventory.crates.small++;
        authorProfile.inventory.crates.large++;
        break;
      case 5:
        crates = `- ${client.getEmoji(
          "medium_crate"
        )} **+1** Medium Crate\n- ${client.getEmoji(
          "large_crate"
        )} **+1** Large Crate`;

        authorProfile.inventory.crates.medium++;
        authorProfile.inventory.crates.large++;
        break;
    }

    await authorProfile.inventory.save();

    await interaction.reply({
      content: `You claimed your daily reward! (🔥 **${
        authorProfile.dailyStreak
      }**)\n- ${client.getEmoji("mocoin")} **+${moCoins}** mo.coins\n${crates}`,
      ephemeral: true,
    });
  },
};
