// -=+=- Dependencies -=+=-
const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dungeon")
    .setDescription("Dungeon example"),

  async execute(interaction, client) {
    const ambiances = [
      "mo.co location 1",
      "mo.co location 2",
      "mo.co location 3",
    ];

    const chambers = [
      {
        type: "Altar",
        subtypes: [
          "Chaos",
          "Despair",
          "Healing",
          "Knowledge",
          "Summoning",
          "Wealth",
        ],
        descriptions: [
          "There's an Altar of Chaos, with a gloomy, red light emanating from it. **Will you pray, or offer?**",
          "There's an Altar of Despair, with a gloomy, black light emanating from it. **Will you pray, or offer?**",
          "There's an Altar of Healing, with a bright, green light emanating from it. **Will you pray, or offer?**",
          "There's an Altar of Knowledge, with a bright, blue light emanating from it. **Will you pray, or offer?**",
          "There's an Altar of Summoning, with a gloomy, purple light emanating from it. **Will you pray, or offer?**",
          "There's an Altar of Wealth, with a bright, yellow light emanating from it. **Will you pray, or offer?**",
        ],
      },
      {
        type: "Bazaar",
        subtypes: [null],
        descriptions: [
          "There are a bunch of Merchants selling things at their stalls. One calls you over specifically. **Are you interested in their goods?**",
        ],
      },
      {
        type: "Boss",
        subtypes: [],
        descriptions: [],
      },
      {
        type: "Protect",
        subtypes: ["Merchant", "mo.co Researcher", "mo.co Sniffer", "Spirit"],
        descriptions: [
          "There's a Merchant trying to bribe monsters with coins, but they don't seem interested. **Protect the Merchant**!",
          "There's a mo.co Researcher cornered by monsters. **Protect the mo.co Researcher**!",
          "There's a mo.co Sniffer barking towards monsters, but his chances alone are nigh zero. **Protect the mo.co Sniffer**!",
          "There's a Spirit wandering around, with monsters lurking in the shadows. **Protect the Spirit**!",
        ],
      },
      {
        type: "Fight",
        subtypes: ["Mirror", "Wither"],
        descriptions: [
          "There are a bunch of mirrors. You gaze upon yourself, only to find something amiss; Your movements aren't mirrored. **Fight your mirror self**!",
          "There's a black fog, lowering your visibility. Next thing you know, you notice some of your skills are gone. **Fight without healing**!",
        ],
      },
      {
        type: "Oblation",
        subtypes: [null],
        descriptions: [
          "A Spirit appears from the side, offering you a deal. **Will you take it?**",
        ],
      },
      {
        type: "Puzzle",
        subtypes: ["Memory"],
        descriptions: [
          "There's a screen, rapidly cycling through monster & skill names! **Memorize them**!",
        ],
      },
      {
        type: "Respite",
        subtypes: [null],
        descriptions: [
          "It looks empty, with no sign of danger. **Best to take a short rest, heal up & change your loadout**.",
        ],
      },
      {
        type: "Treasure",
        subtypes: ["Small Chest", "Medium Chest", "Large Chest"],
        descriptions: [
          "There's a small chest up ahead. There could be monsters lurking or traps set up; **do you want to go to the chest and open it**?",
          "There's a medium chest up ahead. There could be monsters lurking or traps set up; **do you want to go to the chest and open it**?",
          "There's a large chest up ahead. There could be monsters lurking or traps set up; **do you want to go to the chest and open it**?",
        ],
      },
      // { // Generated in generateGrid()
      //   type: "Vault",
      //   subtypes: [null],
      //   descriptions: [
      //     "There's a suspicious wall with a single keyhole in it. **Do you have a key?**",
      //   ],
      // },
    ];

    function GenerateGrid(size) {
      const grid = [];

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const chamber = chambers[Math.floor(Math.random() * chambers.length)];
          const random = Math.floor(Math.random() * chamber.subtypes.length);

          const id = row * size + col;
          const type = chamber.type;
          const subtype = chamber.subtypes[random];
          const description = chamber.descriptions[random];
          const nesw = [
            row > 0 ? (row - 1) * size + col : null,
            col < size - 1 ? row * size + (col + 1) : null,
            row < size - 1 ? (row + 1) * size + col : null,
            col > 0 ? row * size + (col - 1) : null,
          ];
          const ventured = false;

          grid.push({ id, type, subtype, description, nesw, ventured });
        }
      }

      // Add a vault
      const randomIndex = Math.floor(Math.random() * grid.length);
      grid[randomIndex].type = "Vault";
      grid[randomIndex].subtype = null;
      grid[randomIndex].description =
        "There's a suspicious wall with a single keyhole in it. **Do you have a key?**";

      return grid;
    }

    function GenerateDungeon(grid, size) {
      const dungeon = [];

      while (dungeon.length < Math.round(((size * size) / 5) * 3)) {
        const chamber = grid[Math.floor(Math.random() * grid.length)];

        if (!dungeon.includes(chamber)) {
          dungeon.push(chamber);
        }
      }

      return dungeon;
    }

    function GenerateView(dungeon, grid, size, current) {
      const view = [];

      for (let row = 0; row < size; row++) {
        let rowStr = "";

        for (let col = 0; col < size; col++) {
          const id = row * size + col;

          if (dungeon.includes(grid[id])) {
            const chamber = grid[id];

            if (chamber.id == current.id) {
              rowStr += "🟩";
            } else if (chamber.ventured) {
              rowStr += "🟥";
            } else {
              rowStr += "⬜";
            }
          } else {
            rowStr += "⬛";
          }
        }

        view.push(rowStr.trimEnd());
      }

      return view.join("\n");
    }

    function CreateReply(moved) {
      view = GenerateView(dungeon, grid, size, current);

      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s dungeon`)
        .setDescription(
          `\`\`\`${view}\`\`\`\nYou arrived at ${
            ambiances[Math.floor(Math.random() * ambiances.length)]
          }. ${current.description}`
        )
        .addFields([
          {
            name: `🏠 Chamber`,
            value: `${
              current.subtype
                ? `${current.type} (${current.subtype})`
                : `${current.type}`
            }`,
          },
          { name: `⚡ Energy remaning`, value: `${energy}` },
        ])
        .setTimestamp()
        .setColor(GetColor());

      let component = new ActionRowBuilder();

      if (!moved) {
        current.nesw.forEach((direction, index) => {
          const invalidDirection =
            direction == null ||
            !dungeon.includes(grid[direction]) ||
            grid[direction].ventured ||
            energy == 0;

          const button = new ButtonBuilder()
            .setCustomId(`movement_${index}:${interaction.id}`)
            .setEmoji(["⬆️", "➡️", "⬇️", "⬅️"][index])
            .setStyle(ButtonStyle.Primary)
            .setDisabled(invalidDirection);

          component.addComponents(button);
        });

        const teleportButton = new ButtonBuilder()
          .setCustomId(`movement_teleport:${interaction.id}`)
          .setLabel("Teleport")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(energy < 2);

        component.addComponents(teleportButton);
      } else {
        switch (current.type) {
          case "Altar":
            const pray = new ButtonBuilder()
              .setCustomId(`chamber_altar_pray:${interaction.id}`)
              .setEmoji("🙏🏻")
              .setLabel("Pray")
              .setStyle(ButtonStyle.Primary);
            const offer = new ButtonBuilder()
              .setCustomId(`chamber_altar_offer:${interaction.id}`)
              .setEmoji("🤲🏻")
              .setLabel("Offer")
              .setStyle(ButtonStyle.Primary);

            component.addComponents(pray, offer);
            break;
          case "Treasure":
            const openChest = new ButtonBuilder()
              .setCustomId(`chamber_chest_open:${interaction.id}`)
              .setEmoji("🗝️")
              .setLabel("Open")
              .setStyle(ButtonStyle.Primary);
            const leaveChest = new ButtonBuilder()
              .setCustomId(`chamber_chest_leave:${interaction.id}`)
              .setEmoji("🔙")
              .setLabel("Leave")
              .setStyle(ButtonStyle.Primary);

            component.addComponents(openChest, leaveChest);
            break;
          case "Vault":
            const openVault = new ButtonBuilder()
              .setCustomId(`chamber_vault_open:${interaction.id}`)
              .setEmoji("🗝️")
              .setLabel("Open")
              .setStyle(ButtonStyle.Primary);
            const leaveVault = new ButtonBuilder()
              .setCustomId(`chamber_vault_leave:${interaction.id}`)
              .setEmoji("🔙")
              .setLabel("Leave")
              .setStyle(ButtonStyle.Primary);

            component.addComponents(openVault, leaveVault);
            break;

          default:
            const def = new ButtonBuilder()
              .setCustomId(`chamber_default:${interaction.id}`)
              .setLabel("Continue")
              .setStyle(ButtonStyle.Primary);

            component.addComponents(def);
            break;
        }
      }

      return {
        embeds: [embed],
        components: [component],
      };
    }

    function GetColor() {
      const colorMap = {
        Chaos: "#ff0000",
        Despair: "#000000",
        Healing: "#00ff00",
        Knowledge: "#0000ff",
        Summoning: "#800080",
        Wealth: "#ffff00",
        Bazaar: "#ffa500",
        Boss: "#800080",
        Fight: "#ff00ff",
        Oblation: "#ff0000",
        Protect: "#ffffff",
        Puzzle: "#0000ff",
        Respite: "#00ff00",
        Treasure: "#ffff00",
        Vault: "#000000",
      };

      if (current.type == "Altar") return colorMap[current.subtype];

      return colorMap[current.type] || "#000000";
    }

    const randomSize = Math.random();
    const size =
      randomSize <= 0.25
        ? 5
        : randomSize <= 0.4667
        ? 6
        : randomSize <= 0.65
        ? 7
        : randomSize <= 0.8
        ? 8
        : randomSize <= 0.9167
        ? 9
        : 10;

    let energy = Math.round((size * size) / 4);

    const grid = GenerateGrid(size);

    const dungeon = GenerateDungeon(grid, size);

    let current = dungeon[Math.floor(Math.random() * dungeon.length)];
    current.type = "Entrance";
    current.subtype = null;
    current.description =
      "You step into the dimly lit entrance of the dungeon. A slight chill runs down your spine. **Which direction will you venture?**";

    const reply = await interaction.reply({
      content: "Dungeon started! See the thread below.",
      fetchReply: true,
    });

    const thread = await reply.startThread({
      name: `${interaction.user.username}'s dungeon`,
    });

    await thread.members.add(interaction.user);

    const turnEmbed = await thread.send(CreateReply(false));

    const collector = turnEmbed.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) =>
        i.user.id == interaction.user.id && i.customId.endsWith(interaction.id),
      time: 120 * 1000,
    });

    collector.on("collect", async (i) => {
      if (i.customId.includes("movement")) {
        // movement
        if (i.customId == `movement_teleport:${interaction.id}`) {
          energy = Math.floor(energy / 2);

          current.ventured = true;

          const availableRooms = dungeon.filter(
            (chamber) => !chamber.ventured && chamber.id != current.id
          );

          current =
            availableRooms[Math.floor(Math.random() * availableRooms.length)];
        } else {
          energy--;

          current.ventured = true;

          current = grid[current.nesw[parseInt(i.customId[9])]];
        }
        await i.update(CreateReply(true));
      } else if (i.customId.includes("chamber")) {
        // chamber
        switch (i.customId) {
          case `chamber_altar_pray:${interaction.id}`:
            if (Math.random() <= 0.4) {
              let reply =
                "You prayed, and the mo.co gods decided to reward you! ";

              switch (current.subtype) {
                case "Healing":
                  reply += "All party members receive healing.";
                  break;
                case "Knowledge":
                  reply += "You now see treasure chambers on the map.";
                  break;
                case "Wealth":
                  reply += "All party members receive loot.";
                  break;

                case "Chaos":
                  reply += "Everyone's loot is safe for another chamber.";
                  break;
                case "Despair":
                  reply += "Everyone's stats remain untouched.";
                  break;
                case "Summoning":
                  reply += "No monsters have been summoned.";
                  break;
              }

              await thread.send(reply);
            } else {
              let reply =
                "You prayed, but the mo.co gods weren't happy enough. ";

              switch (current.subtype) {
                case "Chaos":
                  reply += "All party members lose loot / ... .";
                  break;
                case "Despair":
                  reply += "All party members lose health and speed.";
                  break;
                case "Summoning":
                  reply += "A group of monsters rise from the floor.";
                  break;

                case "Healing":
                  reply += "No healing is granted.";
                  break;
                case "Knowledge":
                  reply += "The map remains as blurry as ever.";
                  break;
                case "Wealth":
                  reply += "There is no descending treasure.";
                  break;
              }

              await thread.send(reply);
            }
            break;
          case `chamber_altar_offer:${interaction.id}`:
            if (Math.random() <= 0.8) {
              let reply =
                "You offered, and the mo.co gods decided to reward you! ";

              switch (current.subtype) {
                case "Healing":
                  reply += "All party members receive healing.";
                  break;
                case "Knowledge":
                  reply += "You now see treasure chambers on the map.";
                  break;
                case "Wealth":
                  reply += "All party members receive loot.";
                  break;

                case "Chaos":
                  reply += "Everyone's loot is safe for another chamber.";
                  break;
                case "Despair":
                  reply += "Everyone's stats remain untouched.";
                  break;
                case "Summoning":
                  reply += "No monsters have been summoned.";
                  break;
              }

              await thread.send(reply);
            } else {
              let reply =
                "You offered, but the mo.co gods weren't happy enough. ";

              switch (current.subtype) {
                case "Chaos":
                  reply += "All party members lose loot / ... .";
                  break;
                case "Despair":
                  reply += "All party members lose health and speed.";
                  break;
                case "Summoning":
                  reply += "A group of monsters rise from the floor.";
                  break;

                case "Healing":
                  reply += "No healing is granted.";
                  break;
                case "Knowledge":
                  reply += "The map remains as blurry as ever.";
                  break;
                case "Wealth":
                  reply += "There is no descending treasure.";
                  break;
              }

              await thread.send(reply);
            }
            break;
          case `chamber_chest_open:${interaction.id}`:
            switch (current.subtype) {
              case "Small Chest":
                if (Math.random() <= 0.25) {
                  await thread.send("There was a trap!");
                } else {
                  await thread.send(
                    "The coast is clear. The chest contains an AMOGUS!"
                  );
                }
                break;
              case "Medium Chest":
                if (Math.random() <= 0.5) {
                  await thread.send("There was a trap!");
                } else {
                  await thread.send(
                    "The coast is clear. The chest contains an AMOGUS!"
                  );
                }
                break;
              case "Large Chest":
                if (Math.random() <= 0.75) {
                  await thread.send("There was a trap!");
                } else {
                  await thread.send(
                    "The coast is clear. The chest contains an AMOGUS!"
                  );
                }
                break;
            }
            break;
          case `chamber_chest_leave:${interaction.id}`:
            await thread.send(
              "You leave the chest, knowing the risks involved."
            );
            break;

          case `chamber_default:${interaction.id}`:
            break;
        }

        await i.update(CreateReply(false));
      }
    });
  },
};
