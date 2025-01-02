// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");

// -=+=- Schemas -=+=-
const Quest = require("../../schemas/questSchema");
const Monster = require("../../schemas/monsterSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("create")
    .setDescription("(DEV) Create a database entry")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("quest")
        .setDescription("(DEV) Create a quest")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The quest name")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("The quest objective")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("level")
            .setDescription("The required experience level")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("difficulty")
            .setDescription("The quest objective")
            .addChoices(
              { name: "Easy", value: "Easy" },
              { name: "Medium", value: "Medium" },
              { name: "Hard", value: "Hard" }
            )
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("goal")
            .setDescription("The number to reach for the reward")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("scale")
            .setDescription(
              "The % in decimals to scale the quest per player level"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("commands")
            .setDescription(
              "The commands that can progress the quest, seperated by commas"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("monster")
        .setDescription("(DEV) Create a monster")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The monster's name")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("hitpoints")
            .setDescription("The monster's HP")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("speed")
            .setDescription("The monster's speed")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("skills")
            .setDescription(
              "The monster's skills & chances (skill,chance|skill,chance)"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("drop")
            .setDescription("The monster's drop")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("tier")
            .setDescription("The monster's tier (for coins & experience)")
            .addChoices(
              { name: "Standard", value: "Standard" },
              { name: "Elite", value: "Elite" },
              { name: "Boss", value: "Boss" },
              { name: "Champion", value: "Champion" }
            )
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    if (interaction.options.getSubcommand() == "quest") {
      const name = interaction.options.getString("name");
      const description = interaction.options.getString("description");
      const level = interaction.options.getNumber("level");
      const difficulty = interaction.options.getString("difficulty");
      const goal = interaction.options.getNumber("goal");
      const scale = interaction.options.getNumber("scale");
      const commandsArray = interaction.options.getString("commands");

      const commands = commandsArray.split(",");

      const quest = new Quest({
        name,
        description,
        level,
        difficulty,
        goal,
        scale,

        commands,
      });
      await quest.save();

      const embed = new EmbedBuilder()
        .setTitle("Quest created!")
        .addFields([
          {
            name: "Name",
            value: name,
            inline: true,
          },
          {
            name: "Description",
            value: description,
            inline: true,
          },
          {
            name: "Level / Goal",
            value: `${level} / ${goal}`,
            inline: true,
          },
          {
            name: "Scale",
            value: `${scale}`,
            inline: true,
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
        ephemeral: true,
      });
    }

    if (interaction.options.getSubcommand() == "monster") {
      const name = interaction.options.getString("name");
      const hitpoints = interaction.options.getInteger("hitpoints");
      const speed = interaction.options.getNumber("speed");
      let skills = interaction.options.getString("skills");
      const drop = interaction.options.getString("drop");
      const tier = interaction.options.getString("tier");

      skills = skills.split("|").map((skill) => {
        const [name, chance] = skill.split(",");
        return [name, parseInt(chance)];
      });

      const monster = new Monster({
        name,
        tier,
        hitpoints,
        speed,
        thresholds: {},
        skills,
        drop,
      });
      await monster.save();

      const embed = new EmbedBuilder()
        .setTitle(`Monster created!`)
        .setDescription(`**__Don't forget to add thresholds!__**`)
        .addFields([
          {
            name: `Name`,
            value: name,
          },
          {
            name: `HP`,
            value: hitpoints.toString(),
          },
          {
            name: `SPD`,
            value: speed.toString(),
          },
          {
            name: `Skills`,
            value: skills
              .map((skill) => `${skill[0]}: ${skill[1]}%`)
              .join("\n"),
          },
          {
            name: `Drop`,
            value: drop.toString(),
          },
        ])
        .setTimestamp()
        .setColor("Green");

      await interaction.reply({ embeds: [embed] });
    }
  },
};
