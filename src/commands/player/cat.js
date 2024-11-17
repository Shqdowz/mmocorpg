// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");

// -=+=- Schemas -=+=-
const Cat = require("../../schemas/catSchema");
const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cat")
    .setDescription("Cat commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("give")
        .setDescription("Give the cat medicine, food or toys")
        .addStringOption((option) =>
          option
            .setName("item")
            .setDescription("The item to give the cat")
            .setRequired(true)
            .addChoices(
              { name: "Medicine", value: "medicine" },
              { name: "Treats", value: "treat" },
              { name: "Toy", value: "toy" }
            )
        )
        .addNumberOption((option) =>
          option.setName("amount").setDescription("The amount to give the cat")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("pet").setDescription("Pet the cat")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("profile")
        .setDescription("View the cat's state & needs")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rename")
        .setDescription("Rename your cat")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name for the cat")
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(15)
        )
    ),

  async execute(interaction, client) {
    const authorProfile = await client.fetchProfile(interaction.user.id);

    if (authorProfile.level < 28) {
      return await interaction.reply({
        content: `The cat feature unlocks at level 28! Please come back later.`,
        ephemeral: true,
      });
    }

    let cat;

    if (!authorProfile.cat) {
      cat = new Cat({
        _id: new mongoose.Types.ObjectId(),
        owner: authorProfile._id,
        previousDecay: Date.now(),
      });
      await cat.save();

      authorProfile.cat = cat._id;
      await authorProfile.save();
    } else {
      cat = authorProfile.cat;
    }

    async function ConvertToEmoji(value) {
      const greens = Math.ceil(value / 10);

      let response = "";
      for (let i = 0; i < 10; i++) {
        if (i < greens) {
          response += "🟩";
        } else {
          response += "⬛";
        }
      }

      return response;
    }

    if (interaction.options.getSubcommand() == "give") {
      const item = interaction.options.getString("item");
      const amount = interaction.options.getNumber("amount") || 1;

      const type =
        item == "medicine"
          ? "health"
          : item == "treat"
          ? "hunger"
          : "happiness";

      // If the author doesn't have any <item>
      if (authorProfile.inventory[item] == 0) {
        return await interaction.reply({
          content: `You don't have any **${item}s** left! Buy more at the market.`,
          ephemeral: true,
        });
      }

      // If the author doesn't have the specified amount of <item>
      if (authorProfile.inventory[item] < amount) {
        return await interaction.reply({
          content: `You don't have that many **${item}s** left! You only have ${authorProfile.inventory[item]}.`,
          ephemeral: true,
        });
      }

      // If the cat's <trait> is already at max
      if (cat[type] >= 100) {
        return await interaction.reply({
          content: `${cat.name}'s **${type}** is already full!`,
          ephemeral: true,
        });
      }

      authorProfile.inventory[item] -= amount;
      await authorProfile.inventory.save();

      const replenish = (Math.floor(Math.random() * 6) + 10) * amount;

      cat[type] = Math.min(100, (cat[type] += replenish));
      await cat.save();

      const dialogues = ["Meow!", "Meow meow!", "Meow :3", "Meow meow :3"];
      const reply = `**${cat.name}**: '${
        dialogues[Math.floor(Math.random() * dialogues.length)]
      }' (**+${replenish}** ${type})`;

      if (cat[type] == 100) {
        const experience = Math.floor(Math.random() * 5) + 1;
        authorProfile.experience += experience;
        await authorProfile.save();

        reply += `\nSince you raised their **${type}** trait to 100, here is **${experience}** experience!`;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Gave ${cat.name} ${item}s!`)
        .setDescription(reply)
        .addFields([
          {
            name: "Health",
            value: `${await ConvertToEmoji(cat.health)} (${cat.health}%)`,
          },
          {
            name: "Hunger",
            value: `${await ConvertToEmoji(cat.hunger)} (${cat.hunger}%)`,
          },
          {
            name: "Happiness",
            value: `${await ConvertToEmoji(cat.happiness)} (${cat.happiness}%)`,
          },
        ])
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Performed by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("random"));

      await interaction.reply({
        embeds: [embed],
      });
    }

    if (interaction.options.getSubcommand() == "pet") {
      if (await client.handleCooldown("pet", interaction, authorProfile))
        return;

      cat.friendshipExperience += 1;
      await cat.save();

      let top = "``` /\\_/\\\n";
      let middle = ["( o.o )\n", "( >.< )\n", "( ^.^ )\n"];
      let bottom = [" > ^ <```", " >   <```"];

      const art =
        (top +=
        middle[Math.floor(Math.random() * middle.length)] +=
          bottom[Math.floor(Math.random() * bottom.length)]);

      const texts = [
        "🤍",
        "🩷",
        "meow",
        "mmm",
        "mmmm",
        "purr",
        "purr purr",
        "purrrr",
        "that's the spot!",
        ":D",
      ];

      let text =
        texts[Math.floor(Math.random() * texts.length)] +
        "\n(+1 friendship experience)";

      const embed = new EmbedBuilder()
        .setTitle(`Petted ${cat.name}!`)
        .setDescription(`${art}\n${text}`)
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Performed by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("random"));

      await interaction.reply({
        embeds: [embed],
      });

      // Quest
      await client.handleQuests(interaction, authorProfile);
    }

    if (interaction.options.getSubcommand() == "profile") {
      let description = "\0";
      const hour = 60 * 60 * 1000;

      if (Date.now() - cat.previousDecay > hour) {
        const hoursPassed = Math.floor((Date.now() - cat.previousDecay) / hour);
        cat.previousDecay = cat.previousDecay.getTime() + hoursPassed * hour;

        const decayIncreaser =
          cat.growthStage == "kitten"
            ? 1
            : cat.growthStage == "juvenile"
            ? 2
            : cat.growthStage == "adolescent"
            ? 3
            : 4;

        for (let i = 0; i < hoursPassed; i++) {
          const healthDecay = Math.ceil(Math.random() * 4) + decayIncreaser;
          const hungerDecay =
            Math.ceil(Math.random() * 4) + (decayIncreaser + 1);
          const happinessDecay =
            Math.ceil(Math.random() * 4) + (decayIncreaser + 2);

          cat.health = Math.max(1, cat.health - healthDecay);
          cat.hunger = Math.max(1, cat.hunger - hungerDecay);
          cat.happiness = Math.max(1, cat.happiness - happinessDecay);
        }
        await cat.save();

        if (cat.health >= 80 && cat.hunger >= 80 && cat.happiness >= 80) {
          const rewardMultiplier =
            cat.growthStage == "kitten"
              ? 0
              : cat.growthStage == "juvenile"
              ? 0.2
              : cat.growthStage == "adolescent"
              ? 0.5
              : 1;

          const moCoins = Math.ceil(Math.random() * 25) + rewardMultiplier * 25;
          authorProfile["mocoins"] += moCoins;
          await authorProfile.save();
          const experience =
            Math.ceil(Math.random() * 10) + rewardMultiplier * 10;
          cat.friendshipExperience += experience;
          await cat.save();

          description = `\n\nPurr! (^>w<^) Thank you for fur-vently keeping me healthy, fed and happy. (^-w-^) Here are **${moCoins}** meow.coins! (^•w•^) I also got **${experience}** purr-sonality points!`;
        }
      }

      if (cat.friendshipLevel < 50) {
        if (cat.friendshipExperience >= cat.friendshipRequiredExperience) {
          cat.friendshipLevel += 1;
          cat.friendshipExperience -= cat.friendshipRequiredExperience;
          cat.friendshipRequiredExperience += 10;
          await cat.save();

          const mocoins =
            Math.ceil(Math.random() * 20 + 20) * (cat.friendshipLevel - 1);
          const experience =
            Math.ceil(Math.random() * 10 + 10) * (cat.friendshipLevel - 1);
          authorProfile["mocoins"] += mocoins;
          authorProfile.experience += experience;
          await authorProfile.save();

          description += `\n\nOur friendship leveled up to level **${cat.friendshipLevel}**! Here are ${mocoins} meow.coins & ${experience} experience!`;

          if (
            Math.ceil(Math.random() * 20) == 1 &&
            cat.growthStage != "adult"
          ) {
            if (cat.growthStage == "kitten" && cat.friendshipLevel < 10) {
              cat.growthStage = "juvenile";
              description += `\n\nPaw-some! I've become a juvenile faster than expected! (^>w<^)`;
            } else if (
              cat.growthStage == "juvenile" &&
              cat.friendshipLevel > 10 &&
              cat.friendshipLevel < 25
            ) {
              cat.growthStage = "adolescent";
              description += `\n\nMeow-velous! I've become an adolescent faster than expected! (^>w<^)`;
            } else if (
              cat.growthStage == "adolescent" &&
              cat.friendshipLevel > 25 &&
              cat.friendshipLevel < 40
            ) {
              cat.growthStage = "adult";
              description += `\n\nPurr-azy! I've become an adult faster than expected! (^>w<^)`;
            }
            await cat.save();
          }

          switch (cat.friendshipLevel) {
            case 10:
              if (cat.growthStage != "juvenile") {
                cat.growthStage = "juvenile";
                description += `\n\nPaw-some! I've become a juvenile now! (^>w<^)`;
              }
              break;
            case 25:
              if (cat.growthStage != "adolescent") {
                cat.growthStage = "adolescent";
                description += `\n\nMeow-velous! I've become an adolescent now! (^>w<^)`;
              }
              break;
            case 40:
              if (cat.growthStage != "adult") {
                cat.growthStage = "adult";
                description += `\n\nPurr-azy! I've become an adult now! (^>w<^)`;
              }
              break;
          }
          await cat.save();
        }
      }

      const next = Math.floor(
        new Date(cat.previousDecay.getTime() + hour).getTime() / 1000
      );

      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s cat '${cat.name}'`)
        .setDescription(
          `Next rewards & decay: <t:${next}:R>\n\n- Friendship level: **${cat.friendshipLevel}**\n- Friendship experience: **${cat.friendshipExperience} / ${cat.friendshipRequiredExperience}**\n- Growth stage: **${cat.growthStage}**${description}`
        )
        .addFields([
          {
            name: "Health",
            value: `${await ConvertToEmoji(cat.health)} (${cat.health}%)`,
          },
          {
            name: "Hunger",
            value: `${await ConvertToEmoji(cat.hunger)} (${cat.hunger}%)`,
          },
          {
            name: "Happiness",
            value: `${await ConvertToEmoji(cat.happiness)} (${cat.happiness}%)`,
          },
        ])
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("random"));

      await interaction.reply({
        embeds: [embed],
      });
    }

    if (interaction.options.getSubcommand() == "rename") {
      const name = interaction.options.getString("name");

      cat.name = name;
      await cat.save();

      await interaction.reply({
        content: `Renamed your cat to **${name}**!`,
        ephemeral: true,
      });
    }
  },
};
