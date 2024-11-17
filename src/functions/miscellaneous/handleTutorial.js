// -=+=- Dependencies -=+=-
const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");

module.exports = (client) => {
  client.handleTutorial = async (interaction, userProfile) => {
    const embed = new EmbedBuilder()
      .setTitle(`Welcome to MMOCORPG!`)
      .setDescription(
        `MMOCORPG is a text-based game bot based on Supercell's mo.co.`
      )
      .addFields({
        name: `Let's get started!`,
        value: `Before we let you loose in the chaotic worlds, we will do a tutorial battle for you to understand the core gameplay. Click the button below to start!`,
      })
      .setTimestamp()
      .setColor("#dd7f9d");

    const button = new ButtonBuilder()
      .setCustomId(`start:${interaction.id}`)
      .setLabel("Start")
      .setStyle(ButtonStyle.Success);

    const reply = await interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(button)],
    });

    // const collector = reply.createMessageComponentCollector({
    //   componentType: ComponentType.Button,
    //   filter: (i) =>
    //     i.user.id == interaction.user.id && i.customId.endsWith(interaction.id),
    // });

    // collector.on("collect", async (i) => {
    //   const reply = await i.reply({
    //     content: `${interaction.user} Tutorial battle started! See the thread below.`,
    //     fetchReply: true,
    //   });

    //   const thread = await reply.startThread({
    //     name: `${interaction.user.username}'s party VS Lil Spitter's party`,
    //   });

    //   await thread.members.add(interaction.user);
    // });
  };
};
