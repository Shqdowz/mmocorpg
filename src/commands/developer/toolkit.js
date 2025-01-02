// -=+=- Dependencies -=+=-
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// -=+=- Schemas -=+=-
const Achievement = require("../../schemas/achievementSchema");
const Cat = require("../../schemas/catSchema");
const Guild = require("../../schemas/guildSchema");
const Loadout = require("../../schemas/loadoutSchema");
const Monster = require("../../schemas/monsterSchema");
const Party = require("../../schemas/partySchema");
const Quest = require("../../schemas/questSchema");
const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("toolkit")
    .setDescription("(DEV) Dev toolkit"),

  async execute(interaction, client) {
    const authorProfile = await client.fetchProfile(interaction.user.id);

    // -=+=- Up-to-date profile -=+=-
    // authorProfile = await client.fetchProfile(authorProfile.userId)

    // -=+=- Cooldown -=+=-
    // if (
    //   authorProfile.cooldowns.daily &&
    //   new Date() < authorProfile.cooldowns.daily
    // ) {
    //   const next = Math.floor(
    //     new Date(authorProfile.cooldowns.daily.getTime()).getTime() / 1000
    //   );
    //   return await interaction.reply({
    //     content: `You already claimed today's daily reward! You can claim again <t:${next}:R>.`,
    //     ephemeral: true,
    //   });
    // }

    // // If refresh at midnight
    // authorProfile.cooldowns.daily = GetRefreshTime();
    // await authorProfile.save();
    // // If refresh after duration
    // authorProfile.cooldowns.global = new Date(new Date().getTime() + 3 * 1000);
    // await authorProfile.save();

    // -=+=- Function returning reply -=+=-
    // if (await client.handleCooldown("global", interaction, authorProfile))
    //   return;

    // -=+=- New schema variable add -=+=-
    // authorProfile.inventory.monsterDrops["Berserker Fist"] =
    //   (authorProfile.inventory.monsterDrops["Berserker Fist"] || 0) + 1;
    // authorProfile.inventory["mocoins"] += 10;
    // await authorProfile.inventory.save();

    // -=+=- Channel sending -=+=-
    // const guild = await client.guilds.fetch("");
    // const channel = await guild.channels.fetch("");
    // await channel.send()

    // -=+=- Variable mapping -=+=-
    // const variableMap = {
    //   "Option 1": ["Red", true],
    //   "Option 2": ["Blue", false],
    //   "Option 3": ["Green", true],
    // };
    // const [color, sus] = map["Option 1"];
    // console.log(color, sus);

    // -=+=- Function mapping -=+=-
    // const functionMap = {
    //   "Option 1": () => {
    //     console.log("This is option 1");
    //   },
    //   "Option 2": () => {
    //     console.log("This is option 2");
    //   },
    //   "Option 3": () => {
    //     console.log("This is option 3");
    //   },
    // };
    // functionMap["Option 1"]();

    // -=+=- Thread creating -=+=- !!!

    // -=+=- Database document updating/finding -=+=- !!!

    // -=+=- Pagination -=+=-
    // let embeds = []; // fill up with embeds
    // const previousButton = new ButtonBuilder()
    //   .setCustomId(`previous:${interaction.id}`)
    //   .setEmoji("◀️")
    //   .setLabel("Previous")
    //   .setStyle(ButtonStyle.Primary)
    //   .setDisabled(true);

    // const nextButton = new ButtonBuilder()
    //   .setCustomId(`next:${interaction.id}`)
    //   .setEmoji("▶️")
    //   .setLabel("Next")
    //   .setStyle(ButtonStyle.Primary);

    // const reply = await interaction.reply({
    //   embeds: [embeds[0]],
    //   components: [
    //     new ActionRowBuilder().addComponents(previousButton, nextButton),
    //   ],
    //   ephemeral: true,
    // });

    // const collector = reply.createMessageComponentCollector({
    //   componentType: ComponentType.Button,
    //   filter: (i) =>
    //     i.user.id == interaction.user.id && i.customId.endsWith(interaction.id),
    //   time: 30 * 1000,
    // });

    // let page = 0;

    // collector.on("collect", async (i) => {
    //   await i.deferUpdate(); // If no i.acknowledgement
    //   collector.resetTimer({ time: 30 * 1000 });

    //   switch (i.customId) {
    //     case `previous:${interaction.id}`:
    //       page--;
    //       break;
    //     case `nextButton:${interaction.id}`:
    //       page++;
    //       break;
    //   }

    //   previousButton.setDisabled(page == 0);
    //   nextButton.setDisabled(page == embeds.length - 1);

    //   await i.update({
    //     embeds: [embeds[page]],
    //     components: [
    //       new ActionRowBuilder().addComponents(previousButton, nextButton),
    //     ],
    //   });
    // });

    // collector.on("end", async () => {
    //   previousButton.setDisabled(true);
    //   nextButton.setDisabled(true);

    //   await interaction.editReply({
    //     components: [
    //       new ActionRowBuilder().addComponents(previousButton, nextButton),
    //     ],
    //   });
    // });
  },
};
