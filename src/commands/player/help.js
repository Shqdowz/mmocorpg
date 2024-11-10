// -=+=- Dependencies -=+=-
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get additional information about a command")
    .addStringOption((option) =>
      option
        .setName("option")
        .setDescription("The option to get information about")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction, client) {
    const focusedOption = interaction.options.getFocused(true);

    let choices = [
      "battle",
      "cat",
      "commands",
      "daily",
      "dungeon",
      "feedback",
      "gear",
      "guild",
      "help",
      "info",
      "inventory",
      "leaderboard",
      "market",
      "odyssey",
      "party",
      "profile",
      "quests",
      "settings",
    ];

    const filtered = choices.filter((choice) =>
      choice.toLowerCase().includes(focusedOption.value.toLowerCase())
    );

    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice }))
    );
  },

  async execute(interaction, client) {
    const option = interaction.options.getString("option");

    let embeds = [];

    switch (option) {
      case "cat":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/cat` help")
            .setDescription(
              "`/cat` allows you to view your cat's profile, give the pet items, pet the cat & rename the cat. When you care for the pet well enough, it will give you rewards, and your bond grows stronger!"
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "commands":
        const commands = [];

        let commandId, commandName, commandDescription, entry;

        client.commands.forEach((command) => {
          commandId = command.id;
          commandName = command.data.name;
          commandDescription = command.data.description;

          entry = `</${commandName}`;

          CreateEntry(command.data);
        });

        function CreateEntry(obj) {
          if (obj.options && obj.options.length > 0) {
            let quit = false;

            obj.options.forEach((option) => {
              if (!option.type) {
                commandDescription = option.description;
                entry += ` ${option.name}`;
                CreateEntry(option);
              }
            });

            obj.options.forEach((option) => {
              if (option.type) {
                if (!quit) {
                  entry += `:${commandId}>`;
                }

                quit = true;

                if (option.required) {
                  entry += ` \`<${option.name}>\``;
                } else {
                  entry += ` \`[${option.name}]\``;
                }
              }
            });

            if (quit) {
              entry += `: ${commandDescription}`;
              commands.push(entry);
              entry = `</${commandName}`;
            }
          } else {
            entry
              ? (entry += `:${commandId}>: ${commandDescription}`)
              : (entry = `</${commandName}:${commandId}>: ${commandDescription}`);

            commands.push(entry);
            entry = `</${commandName}`;
          }
        }

        commands.sort();

        const chunkSize = 10;

        for (let i = 0; i < commands.length; i += chunkSize) {
          const chunk = commands.slice(i, i + chunkSize);
          const embed = new EmbedBuilder()
            .setTitle(`Commands help`)
            .setDescription(
              "Explanation of all commands & subcommands.\n`<field>` is a required field.\n`[field]` is an optional field."
            )
            .addFields([
              {
                name: "List",
                value: chunk.join("\n"),
              },
            ])
            .setColor("#dd7f9d");

          embeds.push(embed);
        }
        break;
      case "daily":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/daily` help")
            .setDescription(
              "`/daily` allows you to claim a small amount of resources every day. By keeping your streak up, you can multiply the gained rewards up to 5x!"
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "feedback":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/feedback` help")
            .setDescription(
              "`/feedback` allows you to send feedback to the developer, such as bug reports or suggestions."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "guild":
        const guildGeneralInformation = [
          `\`Name\`: the guild's name. Cannot be equal to other guild names. Can have between 3 to 15 characters`,
          `\`Description\`: the guild's description. Can have a maximum of 100 characters`,
        ];
        const guildMembers = [
          `\`Leader\`: the leader of the guild. They can edit the guild's settings & kick players from the guild`,
          `\`Member\`: the members of the guild`,
        ];
        const guildSettings = [
          `\`Is open\`: whether the guild allows for new members to join`,
          `\`On request\`: whether the guild requires requests to join`,
        ];

        embeds.push(
          new EmbedBuilder()
            .setTitle("`/guild` help")
            .setDescription(
              "`/guild` allows you to create, view, join, leave, kick members from, edit settings of & manage requests of a guild."
            )
            .addFields([
              {
                name: "General information",
                value: guildGeneralInformation.map((value) => value).join("\n"),
              },
              {
                name: "Members",
                value: guildMembers.map((value) => value).join("\n"),
              },
              {
                name: "Settings",
                value: guildSettings.map((value) => value).join("\n"),
              },
            ])
            .setColor(client.getColor("random"))
        );
        break;
      case "help":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/help` help")
            .setDescription(
              "`/help` allows you to get help on any command. Please don't ask for a `/help help help` command though :("
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "info":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/info` help")
            .setDescription(
              "`/info` allows you to view info about the bot, such as the developer, ways to support, & terms & policies."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "inventory":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/inventory` help")
            .setDescription(
              "`/inventory` allows you to view your own or someone else's inventory. The inventory contains various items, including currencies, monster loot & pet items."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "leaderboard":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/leaderboard` help")
            .setDescription(
              "`/leaderboard` allows you to view and compete in various leaderboards."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "lootbox":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/lootbox` help")
            .setDescription(
              "`/lootbox` allows you to open a loot box, containing a random trophy."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "market":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/market` help")
            .setDescription(
              "`/market` allows you to buy, sell and trade various items."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "party":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/party` help")
            .setDescription(
              "`/party` allows you to view your & leave your party, & invite someone to or kick someone from your party. All party members must be readied up in order to play something together."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "profile":
        const profileProgress = [
          `\`Level\`: the current level`,
          `\`Experience\`: the current experience / the required experience for the next level`,
        ];
        const profileStats = [
          `\`HP\`: the current hitpoints / the maximum hitpoints`,
          `\`SPD\`: how often actions are taken`,
          `\`ATKINT\` (hidden): the interval at which actions are taken`,
        ];

        embeds.push(
          new EmbedBuilder()
            .setTitle("`/profile` help")
            .setDescription(
              "`/profile` allows you to view your own or someone else's profile. It shows information related to the player's progress and statistics."
            )
            .addFields([
              {
                name: "Progress",
                value: profileProgress.map((value) => value).join("\n"),
              },
              {
                name: "Stats",
                value: profileStats.map((value) => value).join("\n"),
              },
            ])
            .setColor(client.getColor("random"))
        );
        break;
      case "quest":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/quest` help")
            .setDescription(
              "`/quest` allows you to do nothing, because it isn't added yet."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "settings":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/settings` help")
            .setDescription(
              "`/settings` allows you to edit your account settings."
            )
            .addFields([
              {
                name: `Always ready`,
                value: `- Whether you stay readied up inside your party after a fight.`,
              },
              {
                name: `Detailed battle`,
                value: `- Whether you want to view details during a fight, such as active effects or player levels.`,
              },
              {
                name: `Instant open`,
                value: `- Whether you want lootboxes to be opened instantly.`,
              },
              {
                name: `Auto recycle`,
                value: `- Whether you want duplicate trophies to be recycled automatically.`,
              },
            ])
            .setColor(client.getColor("random"))
        );
        break;
      case "trophies":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/trophies` help")
            .setDescription(
              "`/trophies` allows you to view your own or someone else's trophies, recycle your trophies & trade trophies with other players."
            )
            .setColor(client.getColor("random"))
        );
        break;
      case "wardrobe":
        embeds.push(
          new EmbedBuilder()
            .setTitle("`/wardrobe` help")
            .setDescription(
              "`/wardrobe` allows you to view & edit your loadout, which is used in fights. You're only able to equip gear you've unlocked."
            )
            .setColor(client.getColor("random"))
        );
        break;
      default:
        return await interaction.reply({
          content: `Couldn't find that help page. Try using the autocomplete!`,
          ephemeral: true,
        });
    }

    if (option == "commands") {
      const previousButton = new ButtonBuilder()
        .setCustomId(`previous:${interaction.id}`)
        .setEmoji("◀️")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true);

      const nextButton = new ButtonBuilder()
        .setCustomId(`next:${interaction.id}`)
        .setEmoji("▶️")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary);

      const reply = await interaction.reply({
        embeds: [embeds[0]],
        components: [
          new ActionRowBuilder().addComponents(previousButton, nextButton),
        ],
        ephemeral: true,
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) =>
          i.user.id == interaction.user.id &&
          i.customId.endsWith(interaction.id),
        time: 60 * 1000,
      });

      let page = 0;

      collector.on("collect", async (i) => {
        switch (i.customId) {
          case `previous:${interaction.id}`:
            page--;
            break;
          case `next:${interaction.id}`:
            page++;
            break;
        }

        previousButton.setDisabled(page == 0);
        nextButton.setDisabled(page == embeds.length - 1);

        await i.update({
          embeds: [embeds[page]],
          components: [
            new ActionRowBuilder().addComponents(previousButton, nextButton),
          ],
        });
      });

      collector.on("end", async () => {
        previousButton.setDisabled(true);
        nextButton.setDisabled(true);

        try {
          await interaction.editReply({
            components: [
              new ActionRowBuilder().addComponents(previousButton, nextButton),
            ],
          });
        } catch (err) {}
      });
    } else {
      await interaction.reply({ embeds: [embeds[0]], ephemeral: true });
    }
  },
};
