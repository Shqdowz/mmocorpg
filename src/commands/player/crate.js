// -=+=- Dependencies -=+=-
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");

// -=+=- Schemas -=+=-
const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crate")
    .setDescription("Open a crate"),

  async execute(interaction, client) {
    const authorProfile = await client.fetchProfile(interaction.user.id);

    const dropsArray = client.getArray("drops");

    function OpenCrate(size) {
      let rewards;
      switch (size) {
        case "Small":
          rewards = [
            // mo.coins: 60%
            ["mo.coins", 50, 0.36],
            ["mo.coins", 100, 0.18],
            ["mo.coins", 200, 0.06],
            // Monster drops: 30%
            ["monster drops (standard)", 5, 0.18],
            ["monster drops (standard)", 10, 0.09],
            ["monster drops (standard)", 20, 0.03],
            // Chaos Cubes: 10%
            ["chaos cubes", 1, 0.06],
            ["chaos cubes", 2, 0.03],
            ["chaos cubes", 4, 0.01],
          ];
          break;
        case "Medium":
          rewards = [
            // mo.coins: 60%
            ["mo.coins", 100, 0.36],
            ["mo.coins", 200, 0.18],
            ["mo.coins", 400, 0.06],
            // Monster drops: 30%
            ["monster drops (standard & elite)", 10, 0.18],
            ["monster drops (standard & elite)", 20, 0.09],
            ["monster drops (standard & elite)", 40, 0.03],
            // Chaos Cubes: 10%
            ["chaos cubes", 2, 0.06],
            ["chaos cubes", 4, 0.03],
            ["chaos cubes", 8, 0.01],
          ];
          break;
        case "Large":
          rewards = [
            // mo.coins: 60%
            ["mo.coins", 200, 0.36],
            ["mo.coins", 400, 0.18],
            ["mo.coins", 800, 0.06],
            // Monster drops: 30%
            ["monster drops (standard, elite & boss)", 20, 0.18],
            ["monster drops (standard, elite & boss)", 40, 0.09],
            ["monster drops (standard, elite & boss)", 80, 0.03],
            // Chaos Cubes: 10%
            ["chaos cubes", 4, 0.06],
            ["chaos cubes", 8, 0.03],
            ["chaos cubes", 16, 0.01],
          ];
          break;
      }

      const rng = Math.random();
      let total = 0;

      for (let i = 0; i < rewards.length; i++) {
        total += rewards[i][2];
        if (rng < total) return rewards[i];
      }
    }

    async function GrantReward(reward) {
      let rewardText;
      let loot = [];

      switch (reward[0]) {
        case "mo.coins":
          authorProfile.inventory["mocoins"] += reward[1];
          await authorProfile.inventory.save();

          rewardText = `- ${client.getEmoji("mocoin")} ${reward[0]} x${
            reward[1]
          }`;
          break;
        case "chaos cubes":
          authorProfile.inventory["Chaos Cubes"] += reward[1];
          await authorProfile.inventory.save();

          rewardText = `- ${client.getEmoji("chaos_cube")} ${reward[0]} x${
            reward[1]
          }`;
          break;
        case "monster drops (standard)":
          for (let i = 0; i < reward[1]; i++) {
            const drop =
              dropsArray.standard[
                Math.floor(Math.random() * dropsArray.standard.length)
              ];

            authorProfile.inventory.monsterDrops[drop] =
              (authorProfile.inventory.monsterDrops[drop] || 0) + 1;
            await authorProfile.inventory.save();

            if (loot.find((item) => item[0] == drop)) {
              loot.find((item) => item[0] == drop)[1]++;
            } else {
              loot.push([drop, 1]);
            }
          }

          rewardText = loot
            .map(
              (item) => `- ${client.getEmoji(item[0])} ${item[0]} x${item[1]}`
            )
            .join("\n");
          break;
        case "monster drops (standard & elite)":
          for (let i = 0; i < reward[1]; i++) {
            let drop;

            if (Math.random() < 0.75) {
              drop =
                dropsArray.standard[
                  Math.floor(Math.random() * dropsArray.standard.length)
                ];
            } else {
              drop =
                dropsArray.elite[
                  Math.floor(Math.random() * dropsArray.elite.length)
                ];
            }

            authorProfile.inventory.monsterDrops[drop] =
              (authorProfile.inventory.monsterDrops[drop] || 0) + 1;
            await authorProfile.inventory.save();

            if (loot.find((item) => item[0] == drop)) {
              loot.find((item) => item[0] == drop)[1]++;
            } else {
              loot.push([drop, 1]);
            }
          }

          rewardText = loot
            .map(
              (item) => `- ${client.getEmoji(item[0])} ${item[0]} x${item[1]}`
            )
            .join("\n");
          break;
        case "monster drops (standard, elite & boss)":
          for (let i = 0; i < reward[1]; i++) {
            let drop;
            const rng = Math.random();

            if (rng < 0.6) {
              drop =
                dropsArray.standard[
                  Math.floor(Math.random() * dropsArray.standard.length)
                ];
            } else if (rng < 0.9) {
              drop =
                dropsArray.elite[
                  Math.floor(Math.random() * dropsArray.elite.length)
                ];
            } else {
              drop =
                dropsArray.boss[
                  Math.floor(Math.random() * dropsArray.boss.length)
                ];
            }

            authorProfile.inventory.monsterDrops[drop] =
              (authorProfile.inventory.monsterDrops[drop] || 0) + 1;
            await authorProfile.inventory.save();

            if (loot.find((item) => item[0] == drop)) {
              loot.find((item) => item[0] == drop)[1]++;
            } else {
              loot.push([drop, 1]);
            }
          }

          rewardText = loot
            .map(
              (item) => `- ${client.getEmoji(item[0])} ${item[0]} x${item[1]}`
            )
            .join("\n");
          break;
      }

      return rewardText;
    }

    function GenerateEmbed(reward, rewardText) {
      if (reward) {
        return new EmbedBuilder()
          .setTitle(`Opening a ${size} Crate...`)
          .setDescription(
            `Rewards:\n${rewardText}\n(${Math.round(reward[2] * 100)}% chance)`
          )
          .setFooter({
            iconURL: interaction.user.displayAvatarURL(),
            text: `Performed by ${authorProfile.username}`,
          })
          .setTimestamp()
          .setColor(
            size == "Small"
              ? "199900"
              : size == "Medium"
              ? "#f77001"
              : "#f80000"
          );
      } else {
        return new EmbedBuilder()
          .setTitle(`${authorProfile.username}'s crates`)
          .setDescription(
            `- ${client.getEmoji("small_crate")} Small Crates: x${
              authorProfile.inventory.crates.small || 0
            }\n- ${client.getEmoji("medium_crate")} Medium Crates: x${
              authorProfile.inventory.crates.medium || 0
            }\n- ${client.getEmoji("large_crate")} Large Crates: x${
              authorProfile.inventory.crates.large || 0
            }`
          )
          .setFooter({ text: `Requested by ${interaction.user.username}` })
          .setTimestamp()
          .setColor(client.getColor("level", authorProfile));
      }
    }

    function GenerateComponents() {
      const smallCrateButton = new ButtonBuilder()
        .setCustomId(`smallCrate:${interaction.id}`)
        .setEmoji(client.getEmoji("small_crate"))
        .setLabel(`Open`)
        .setStyle(
          authorProfile.inventory.crates.small
            ? ButtonStyle.Primary
            : ButtonStyle.Secondary
        )
        .setDisabled(!authorProfile.inventory.crates.small);

      const mediumCrateButton = new ButtonBuilder()
        .setCustomId(`mediumCrate:${interaction.id}`)
        .setEmoji(client.getEmoji("medium_crate"))
        .setLabel(`Open`)
        .setStyle(
          authorProfile.inventory.crates.medium
            ? ButtonStyle.Primary
            : ButtonStyle.Secondary
        )
        .setDisabled(!authorProfile.inventory.crates.medium);

      const largeCrateButton = new ButtonBuilder()
        .setCustomId(`largeCrate:${interaction.id}`)
        .setEmoji(client.getEmoji("large_crate"))
        .setLabel(`Open`)
        .setStyle(
          authorProfile.inventory.crates.large
            ? ButtonStyle.Primary
            : ButtonStyle.Secondary
        )
        .setDisabled(!authorProfile.inventory.crates.large);

      return [smallCrateButton, mediumCrateButton, largeCrateButton];
    }

    const reply = await interaction.reply({
      embeds: [GenerateEmbed()],
      components: [
        new ActionRowBuilder().addComponents(...GenerateComponents()),
      ],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) =>
        i.user.id == interaction.user.id && i.customId.endsWith(interaction.id),
      time: 30 * 1000,
    });

    let size;

    collector.on("collect", async (i) => {
      collector.resetTimer({ time: 30 * 1000 });

      size = i.customId.startsWith("small")
        ? "Small"
        : i.customId.startsWith("medium")
        ? "Medium"
        : "Large";

      authorProfile.inventory.crates[size.toLowerCase()]--;
      await authorProfile.inventory.save();

      const reward = OpenCrate(size);
      const rewardText = await GrantReward(reward);

      await interaction.editReply({
        embeds: [GenerateEmbed(reward, rewardText)],
        components: [
          new ActionRowBuilder().addComponents(...GenerateComponents()),
        ],
      });
    });

    collector.on("end", async () => {
      await interaction.editReply({
        embeds: [GenerateEmbed()],
        components: [],
      });
    });
  },
};
