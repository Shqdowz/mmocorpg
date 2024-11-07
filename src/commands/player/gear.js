const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");

const User = require("../../schemas/userSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gear")
    .setDescription("View, equip and upgrade gear")
    .addSubcommand((subcommand) =>
      subcommand.setName("view").setDescription("View your gear")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("equip")
        .setDescription("Equip gear")
        .addStringOption((option) =>
          option
            .setName("weapon")
            .setDescription("The weapon to equip")
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("active1")
            .setDescription("The active gear to equip on slot 1")
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("active2")
            .setDescription("The active gear to equip on slot 2")
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("active3")
            .setDescription("The active gear to equip on slot 3")
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("active4")
            .setDescription("The active gear to equip on slot 4")
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("passive1")
            .setDescription("The passive gear to equip on slot 1")
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("passive2")
            .setDescription("The passive gear to equip on slot 2")
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("loadout")
            .setDescription("The loadout to equip (or update)")
            .addChoices(
              { name: "1", value: "0" },
              { name: "2", value: "1" },
              { name: "3", value: "2" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("materials")
        .setDescription("View the required materials to upgrade a gear")
        .addStringOption((option) =>
          option
            .setName("gear")
            .setDescription("The gear to view materials for")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("upgrade")
        .setDescription("Upgrade your gear")
        .addStringOption((option) =>
          option
            .setName("gear")
            .setDescription("The gear to upgrade")
            .setAutocomplete(true)
            .setRequired(true)
        )
    ),

  async autocomplete(interaction, client) {
    const gearArray = client.getArray("gear");

    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    });

    async function GetMaterials(gear, level) {
      const materials = [];

      const type = gearArray.weapon.includes(gear)
        ? "weapon"
        : gearArray.active.includes(gear)
        ? "active"
        : "passive";

      if (level == 1) {
        materials.push([gear, 1]);
      }

      if (type == "weapon") {
        materials.push(["mo.coins", 500 * level]);
      }
      if (type == "active") {
        materials.push(["mo.coins", 1000 * level]);
      }
      if (type == "passive") {
        materials.push(["mo.coins", 250 * level]);
      }

      materials.push(...client.getMaterials(gear, level));

      return materials;
    }

    async function HasMaterials(gear, inventory, materials) {
      const missing = [];
      for (const material of materials) {
        if (material[0] == "mo.coins") {
          if (inventory.mocoins < material[1]) {
            missing.push([
              client.getEmoji("mocoin"),
              material[0],
              `${inventory.mocoins}/${material[1]}`,
            ]);
          }
        } else if (
          gearArray.all.includes(material[0]) &&
          !inventory.blueprints.includes(material[0])
        ) {
          missing.push([client.getEmoji("blueprint"), material[0], `0/1`]);
        } else {
          if (inventory.monsterDrops[material[0]] < material[1]) {
            missing.push([
              client.getEmoji(material[0]),
              material[0],
              `${inventory.monsterDrops[material[0]] || 0}/${material[1]}`,
            ]);
          }
        }
      }

      if (missing.length > 0) {
        return [false, missing];
      }
      return [true, gear];
    }

    if (interaction.options.getSubcommand() == "equip") {
      const focusedOption = interaction.options.getFocused(true);

      let choices = [];
      if (focusedOption.name === "weapon") {
        choices = Object.keys(authorProfile.gear.weapon).filter(
          (gear) => authorProfile.gear.weapon[gear] > 0
        );
      } else if (focusedOption.name.startsWith("active")) {
        choices = Object.keys(authorProfile.gear.active).filter(
          (gear) => authorProfile.gear.active[gear] > 0
        );
      } else if (focusedOption.name.startsWith("passive")) {
        choices = Object.keys(authorProfile.gear.passive).filter(
          (gear) => authorProfile.gear.passive[gear] > 0
        );
      }

      const filtered = choices.filter((choice) =>
        choice.toLowerCase().includes(focusedOption.value.toLowerCase())
      );

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    }

    if (interaction.options.getSubcommand() == "materials") {
      let choices = gearArray.all;

      const focusedOption = interaction.options.getFocused(true);

      const filtered = choices.filter((choice) =>
        choice.toLowerCase().includes(focusedOption.value.toLowerCase())
      );

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    }

    if (interaction.options.getSubcommand() == "upgrade") {
      await authorProfile.populate("inventory");

      let choices = [];
      for (const gear of gearArray.all) {
        const type = gearArray.weapon.includes(gear)
          ? "weapon"
          : gearArray.active.includes(gear)
          ? "active"
          : "passive";
        const gearLevel = authorProfile.gear[type][gear] + 1;
        const gearMaterial = await HasMaterials(
          gear,
          authorProfile.inventory,
          await GetMaterials(gear, gearLevel)
        );
        if (gearMaterial[0]) choices.push(gearMaterial[1]);
      }

      const focusedOption = interaction.options.getFocused(true);

      const filtered = choices.filter((choice) =>
        choice.toLowerCase().includes(focusedOption.value.toLowerCase())
      );

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    }
  },

  async execute(interaction, client) {
    const gearArray = client.getArray("gear");
    const dropsArray = client.getArray("drops");

    const authorProfile = await User.findOne({
      userId: interaction.user.id,
    }).populate("loadout");

    function ValidItem(gear) {
      const foundGear = gearArray.all.find(
        (item) => item.toLowerCase() == gear.toLowerCase()
      );
      if (foundGear) return [true, foundGear];
      return [false, gear];
    }

    function GetMaterials(gear, level) {
      const materials = [];

      const type = gearArray.weapon.includes(gear)
        ? "weapon"
        : gearArray.active.includes(gear)
        ? "active"
        : "passive";

      if (level == 1) {
        materials.push([gear, 1]);
      }

      if (type == "weapon") {
        materials.push(["mo.coins", 500 * level]);
      }
      if (type == "active") {
        materials.push(["mo.coins", 1000 * level]);
      }
      if (type == "passive") {
        materials.push(["mo.coins", 250 * level]);
      }

      materials.push(...client.getMaterials(gear, level));

      return materials;
    }

    function HasMaterials(gear, inventory, materials) {
      const missing = [];

      for (const material of materials) {
        if (material[0] == "mo.coins") {
          if (inventory.mocoins < material[1]) {
            missing.push([
              client.getEmoji("mocoin"),
              material[0],
              `${inventory.mocoins}/${material[1]}`,
            ]);
          }
        } else if (
          gearArray.all.includes(material[0]) &&
          !inventory.blueprints.includes(material[0])
        ) {
          missing.push([client.getEmoji("blueprint"), material[0], `0/1`]);
        } else if (dropsArray.all.includes(material[0])) {
          if (
            !inventory.monsterDrops[material[0]] ||
            inventory.monsterDrops[material[0]] < material[1]
          ) {
            missing.push([
              client.getEmoji(material[0]),
              material[0],
              `${inventory.monsterDrops[material[0]] || 0}/${material[1]}`,
            ]);
          }
        }
      }

      if (missing.length > 0) {
        return [false, missing];
      }
      return [true, gear];
    }

    if (interaction.options.getSubcommand() == "view") {
      const loadouts = [...authorProfile.loadout.list];

      const embeds = [
        new EmbedBuilder()
          .setTitle(`${authorProfile.username}'s unlocked gear`)
          .addFields([
            {
              name: "Weapons",
              value: Object.entries(authorProfile.gear.weapon)
                .map(([gear, level]) => {
                  return level > 0
                    ? `${gear}: **LVL ${level}**`
                    : `${gear}: 🔒`;
                })
                .join(`\n`),
            },
            {
              name: "Actives",
              value: Object.entries(authorProfile.gear.active)
                .map(([gear, level]) => {
                  return level > 0
                    ? `${gear}: **LVL ${level}**`
                    : `${gear}: 🔒`;
                })
                .join(`\n`),
            },
            {
              name: "Passives",
              value: Object.entries(authorProfile.gear.passive)
                .map(([gear, level]) => {
                  return level > 0
                    ? `${gear}: **LVL ${level}**`
                    : `${gear}: 🔒`;
                })
                .join(`\n`),
            },
          ])
          .setFooter({
            iconURL: interaction.user.displayAvatarURL(),
            text: `Requested by ${interaction.user.username}`,
          })
          .setTimestamp()
          .setColor(client.getColor("level", authorProfile)),
      ];

      embeds.push(
        ...loadouts.map((loadout, index) => {
          return new EmbedBuilder()
            .setTitle(`${authorProfile.username}'s loadout #${index + 1}`)
            .setDescription(`Equipped: ${loadout.equipped ? "yes" : "no"}`)
            .addFields([
              {
                name: "Weapon",
                value: `${loadout.gear.weapon.map((value) =>
                  value
                    ? `- \`[${
                        authorProfile.gear.weapon[value]
                      }]\` ${client.getEmoji(value)} ${value}`
                    : `- -`
                )}`,
              },
              {
                name: "Actives",
                value: `${loadout.gear.active
                  .map((value) =>
                    value
                      ? `- \`[${
                          authorProfile.gear.active[value]
                        }]\` ${client.getEmoji(value)} ${value}`
                      : `- -`
                  )
                  .join("\n")}`,
              },
              {
                name: "Passives",
                value: `${loadout.gear.passive
                  .map((value) =>
                    value
                      ? `- \`[${
                          authorProfile.gear.passive[value]
                        }]\` ${client.getEmoji(value)} ${value}`
                      : `- -`
                  )
                  .join("\n")}`,
              },
            ])
            .setFooter({
              iconURL: interaction.user.displayAvatarURL(),
              text: `Requested by ${interaction.user.username}`,
            })
            .setTimestamp()
            .setColor(client.getColor("level", authorProfile));
        })
      );

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
      });

      const collector = reply.createMessageComponentCollector({
        ComponentType: ComponentType.Button,
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
    }

    if (interaction.options.getSubcommand() == "equip") {
      const weapon = interaction.options.getString("weapon");

      const active1 = interaction.options.getString("active1");
      const active2 = interaction.options.getString("active2");
      const active3 = interaction.options.getString("active3");
      const active4 = interaction.options.getString("active4");

      const passive1 = interaction.options.getString("passive1");
      const passive2 = interaction.options.getString("passive2");

      const loadout = parseInt(interaction.options.getString("loadout"));

      const currentLoadout = authorProfile.loadout.list.find(
        (loadout) => loadout.equipped
      );
      const specifiedLoadout = authorProfile.loadout.list[loadout];
      const inputLoadout = {
        gear: {
          weapon: [weapon],
          active: [active1, active2, active3, active4],
          passive: [passive1, passive2],
        },
      };

      async function CheckGearValidity() {
        for (const type of Object.keys(inputLoadout.gear)) {
          for (const gear of inputLoadout.gear[type]) {
            if (!gear) continue;

            const validity = ValidItem(gear);

            if (validity[0]) {
              if (!authorProfile.gear[type][validity[1]]) {
                return await interaction.reply({
                  content: `You don't have ${validity[1]} unlocked!`,
                  ephemeral: true,
                });
              }
            } else {
              return await interaction.reply({
                content: `Couldn't find '${validity[1]}'. Did you make a typo?`,
                ephemeral: true,
              });
            }
          }
        }
      }

      async function CheckLoadoutValidity(current, input) {
        let merged = [];
        for (const type of Object.keys(current.gear)) {
          current.gear[type].forEach((gear, index) => {
            return merged.push(input.gear[type][index] || gear);
          });
        }

        merged = merged.filter((value) => value);

        if (new Set(merged).size != merged.length) {
          return await interaction.reply({
            content:
              "You have duplicate gear equipped. Please ensure each equipped gear is unique.",
            ephemeral: true,
          });
        }
      }

      async function UpdateLoadout(loadout, input) {
        for (const type of Object.keys(loadout.gear)) {
          loadout.gear[type].forEach((gear, index) => {
            loadout.gear[type][index] = input.gear[type][index] || gear;
          });
        }
        authorProfile.loadout.markModified("list");
        await authorProfile.loadout.save();
      }

      const hasLoadout = !isNaN(loadout);
      const hasGear = Object.keys(inputLoadout.gear).some((type) =>
        inputLoadout.gear[type].some((gear) => gear)
      );

      let title, fieldValue, footer;

      if (hasLoadout) {
        if (hasGear) {
          // loadout, gear: change gear on said loadout

          if (
            (await CheckGearValidity()) ||
            (await CheckLoadoutValidity(currentLoadout, inputLoadout))
          )
            return;

          await UpdateLoadout(specifiedLoadout, inputLoadout);

          title = `Loadout #${loadout + 1} updated!`;
          fieldValue = specifiedLoadout.gear;
          footer = `Performed`;
        } else {
          // loadout, no gear: equip said loadout

          currentLoadout.equipped = false;
          specifiedLoadout.equipped = true;
          authorProfile.loadout.markModified("list");
          await authorProfile.loadout.save();

          title = `Loadout #${loadout + 1} equipped!`;
          fieldValue = specifiedLoadout.gear;
          footer = `Performed`;
        }
      } else {
        if (hasGear) {
          // no loadout, gear: change gear on current loadout

          if (
            (await CheckGearValidity()) ||
            (await CheckLoadoutValidity(currentLoadout, inputLoadout))
          )
            return;

          await UpdateLoadout(currentLoadout, inputLoadout);

          title = `Loadout #${
            authorProfile.loadout.list.indexOf(currentLoadout) + 1
          } updated!`;
          fieldValue = currentLoadout.gear;
          footer = `Performed`;
        } else {
          // no loadout, no gear: show current equipped loadout

          title = `Loadout #${
            authorProfile.loadout.list.indexOf(currentLoadout) + 1
          }`;
          fieldValue = currentLoadout.gear;
          footer = `Requested`;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .addFields([
          {
            name: "Weapon",
            value: `${fieldValue.weapon.map((value) =>
              value
                ? `- \`[${
                    authorProfile.gear.weapon[value]
                  }]\` ${client.getEmoji(value)} ${value}`
                : `- -`
            )}`,
          },
          {
            name: "Actives",
            value: `${fieldValue.active
              .map((value) =>
                value
                  ? `- \`[${
                      authorProfile.gear.active[value]
                    }]\` ${client.getEmoji(value)} ${value}`
                  : `- -`
              )
              .join("\n")}`,
          },
          {
            name: "Passives",
            value: `${fieldValue.passive
              .map((value) =>
                value
                  ? `- \`[${
                      authorProfile.gear.passive[value]
                    }]\` ${client.getEmoji(value)} ${value}`
                  : `- -`
              )
              .join("\n")}`,
          },
        ])
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `${footer} by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", authorProfile));

      return await interaction.reply({
        embeds: [embed],
      });
    }

    if (interaction.options.getSubcommand() == "materials") {
      await authorProfile.populate("inventory");

      const gear = interaction.options.getString("gear");

      const validity = ValidItem(gear);

      if (!validity[0]) {
        return await interaction.reply({
          content: `Couldn't find '${gear}'. Did you make a typo?`,
          ephemeral: true,
        });
      }

      const type = gearArray.weapon.includes(validity[1])
        ? "weapon"
        : gearArray.active.includes(validity[1])
        ? "active"
        : "passive";
      const gearLevel = authorProfile.gear[type][validity[1]];

      let embed = new EmbedBuilder()
        .setTitle(`\`${gearLevel}\` - ${validity[1]}`)
        .setDescription(
          gearLevel < 11
            ? `Already achieved levels are hidden. __Underlined__ materials are missing.`
            : `All levels are achieved!`
        )
        .setFooter({
          iconURL: interaction.user.displayAvatarURL(),
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp()
        .setColor(client.getColor("level", authorProfile));

      for (let i = 1; i <= 11; i++) {
        if (gearLevel < i) {
          const materials = GetMaterials(validity[1], i);
          const materialsMap = materials
            .map((m) => {
              let emoji, missing;

              if (m[0] == "mo.coins") {
                emoji = client.getEmoji("mocoin");

                if (authorProfile.inventory.mocoins < m[1]) missing = true;
              } else if (m[0] == validity[1]) {
                emoji = client.getEmoji("blueprint");

                if (!authorProfile.inventory.blueprints.includes(m[0]))
                  missing = true;
              } else {
                emoji = client.getEmoji(m[0]);

                if (
                  !authorProfile.inventory.monsterDrops[m[0]] ||
                  authorProfile.inventory.monsterDrops[m[0]] < m[1]
                )
                  missing = true;
              }

              if (missing) return `- ${emoji} __${m[0]} x${m[1]}__`;
              return `- ${emoji} ${m[0]} x${m[1]}`;
            })
            .join("\n");

          embed.addFields({
            name: `Level ${i}${i != gearLevel + 1 ? ` 🔒` : ``}`,
            value: materialsMap,
            inline: true,
          });
        }
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.options.getSubcommand() == "upgrade") {
      const gear = interaction.options.getString("gear");

      const validity = ValidItem(gear);

      if (!validity[0]) {
        return await interaction.reply({
          content: `Couldn't find '${gear}'. Did you make a typo?`,
          ephemeral: true,
        });
      }

      let type = gearArray.weapon.includes(validity[1])
        ? "weapon"
        : gearArray.active.includes(validity[1])
        ? "active"
        : "passive";
      let gearLevel = authorProfile.gear[type][validity[1]] + 1;

      const materials = GetMaterials(validity[1], gearLevel);

      await authorProfile.populate("inventory");

      const result = HasMaterials(
        validity[1],
        authorProfile.inventory,
        materials
      );

      if (!result[0]) {
        return await interaction.reply({
          content: `You're missing some materials!\n\n- ${validity[1]}: ${
            gearLevel - 1
          } -> ${gearLevel}\n${result[1]
            .map((material) => `${material[0]} ${material[1]} (${material[2]})`)
            .join("\n")}`,
          ephemeral: true,
        });
      }

      for (const material of materials) {
        if (material[0] == "mo.coins") {
          authorProfile.inventory.mocoins -= material[1];
          await authorProfile.inventory.save();

          continue;
        }

        if (gearArray.all.includes(material[0])) {
          authorProfile.inventory.blueprints =
            authorProfile.inventory.blueprints.filter(
              (blueprint) => blueprint != material[0]
            );

          authorProfile.inventory.markModified("blueprints"); // necessary?
          await authorProfile.inventory.save();

          continue;
        }

        authorProfile.inventory.monsterDrops[material[0]] -= material[1];
        await authorProfile.inventory.save();
      }

      authorProfile.gear[type][validity[1]] = gearLevel;

      authorProfile.markModified("gear");
      await authorProfile.save();

      const embed = new EmbedBuilder()
        .setTitle(
          gearLevel == 1
            ? `Succesfully crafted ${validity[1]}!`
            : `Successfully upgraded ${validity[1]}!`
        )
        .setDescription(`\`${gearLevel - 1} -> ${gearLevel}\``)
        .addFields({
          name: `Materials spent`,
          value: materials
            .map((material) => {
              if (gearArray.all.includes(material[0])) {
                return `- ${client.getEmoji("blueprint")} ${
                  material[0]
                } blueprint x1`;
              }
              if (material[0] == "mo.coins") {
                return `- ${client.getEmoji("mocoin")} ${material[0]} x${
                  material[1]
                }`;
              }
              return `- ${client.getEmoji(material[0])} ${material[0]} x${
                material[1]
              }`;
            })
            .join("\n"),
        })
        .setColor(client.getColor("level", authorProfile))
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
      });
    }
  },
};
