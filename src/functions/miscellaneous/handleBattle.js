// -=+=- Dependencies -=+=-
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

// -=+=- Schemas -=+=-
const Monster = require("../../schemas/monsterSchema");

// -=+=- Utilities -=+=-
const wait = require("node:timers/promises").setTimeout;

module.exports = (client) => {
  client.handleBattle = async (interaction, settings) => {
    if (interaction.channel.type != 0) {
      return await interaction.reply({
        content: `You can only use this command in text channels!`,
        ephemeral: true,
      });
    }

    const { startEnemies } = settings;

    // -=+=- Global variables -=+=-
    const gearArray = client.getArray("gear");
    const monsterArray = client.getArray("monsters");

    let playerId = 0;

    let players = [];
    let allPlayers = [];
    let allies = [];
    let allAllies = [];
    let enemies = [];
    let allEnemies = [];

    const maxTime = 10.0;
    let currentTime = 0.0;
    let overtime = false;
    let gameEnded = false;

    let teammates;
    let opponents;
    let winners;

    // -=+=- Functions -=+=-
    function FixedFloat(number) {
      return parseFloat(number.toFixed(2));
    }

    function MapEffect(effect) {
      const messages = {
        Damage: `**-${effect.value}** ${client.getEmoji("damage")}`,
        Healing: `**+${effect.value}** ${client.getEmoji("health")}`,
        Speed: `**${effect.value > 0 ? "+" : ""}${
          effect.value
        }** ${client.getEmoji("speed")}`,
        Stun: `**${Math.round(effect.value * 100)}%** ${client.getEmoji(
          "stun"
        )}`,
        DamageIncrease: `**${Math.round(
          (effect.value - 1) * 100
        )}%** ${client.getEmoji("damage_increase")}`,
        DamageReduction: `**${Math.round(
          (1 - effect.value) * 100
        )}%** ${client.getEmoji("damage_reduction")}`,
        Cleanse: "🧹",
      };

      return `- ${messages[effect.type]} for ${effect.duration} turn${
        effect.duration > 1 ? "s" : ""
      } (from **${
        players.find((player) => player.id == effect.by).name
      }**'s **${effect.from}**)`;
    }

    function AffectedText(player) {
      const deadEmoji =
        player.hitPoints == 0
          ? player.user
            ? client.getEmoji("player_dead") + " "
            : client.getEmoji("monster_dead") + " "
          : "";

      return `- ${deadEmoji}\`[${player.level}]\` ${player.name}:`;
    }

    function MapPlayers(players) {
      return players
        .map((player) => {
          return `\`[${player.level}]\` ${player.name}: ${client.getEmoji(
            "health"
          )} **${player.hitPoints}** / **${player.maxHitPoints}**`;
        })
        .join("\n");
    }

    function MapTurns(players) {
      return players
        .slice(1, players.length + 1)
        .map(
          (player) =>
            `\`[${player.level}]\` ${player.name} (**${player.next.toFixed(
              2
            )}**)`
        )
        .join("\n");
    }

    function GetCooldown(active) {
      const cooldowns = [
        ["Monster Taser", "Smart Fireworks"],
        ["Life Jacket", "Water Balloon"],
        ["Boombox", "Snow Globe"],
        ["Turbo Pills"],
        ["Really Cool Sticker"],
        ["Shelldon"],
      ];

      for (let i = 0; i < cooldowns.length; i++) {
        if (cooldowns[i].includes(active)) return i;
      }
    }

    function ScaleByLevel(level, increase) {
      return 1 - increase + increase * level;
    }

    function PushToPlayers(player, group) {
      players.push(player);
      allPlayers.push(player);

      if (group == 1) {
        allies.push(player);
        allAllies.push(player);
      }
      if (group == 2) {
        enemies.push(player);
        allEnemies.push(player);
      }
    }

    async function PushUser(profile, group) {
      playerId++;

      profile.isBusy = true;
      await profile.save();

      const user = await client.users.fetch(profile.userId);
      const loadout = profile.loadout.list.find((loadout) => loadout.equipped);

      const player = {
        id: playerId,
        index: players.length,
        name: profile.username,
        user: user,
        group: group,

        level: profile.level,
        hitPoints: profile.hitPoints,
        speed: profile.speed,
        interval: FixedFloat(1 / profile.speed),
        next: FixedFloat(1 / profile.speed),

        maxHitPoints: profile.hitPoints,
        baseSpeed: profile.speed,

        gear: {
          active: {
            list: profile.gear.active,
            equipped: [...loadout.gear.active],
          },
          passive: {
            list: profile.gear.passive,
            equipped: [...loadout.gear.passive],
          },
          weapon: {
            list: profile.gear.weapon,
            equipped: [...loadout.gear.weapon],
          },
        },

        profile: profile,

        stats: {
          "Damage Dealt": 0,
          "Damage Taken": 0,
          "Healing Done": 0,
          "Kills Made": 0,
          "Turns Taken": 0,
        },
        thresholds: {
          "Chicken Stick": 0,
          "Medicine Ball": 0,
          "Monster Slugger": 0,
          "Portable Portal": 0,
          Spinsickle: [],
          "Techno Fists": 0,
          "Very Long Bow": 0,
          "Wolf Stick": 0,

          "Active Ace": false,
          "Bunch of Dice": false,
          "Explode-o-matic Trigger": 0,
        },

        activeEffects: [],
        cooldowns: [],
      };

      PushToPlayers(player, group);
      return;
    }

    async function PushMonster(name, group, time, from) {
      playerId++;

      const profile = await Monster.findOne({ name: name });

      // Refresh player's Shelldon/Wolf
      if (profile.name == "Shelldon" || profile.name == "Wolf") {
        const oldPet = players.find(
          (player) =>
            player.name == profile.name && player.thresholds.ownerId == from.id
        );

        if (oldPet) {
          players = players.filter((player) => player != oldPet);
          allies = allies.filter((player) => player != oldPet);
          allAllies = allAllies.filter((player) => player != oldPet);
        }
      }

      function CreateMonster(level, hitPoints) {
        const monsterSpeed = FixedFloat(
          profile.speed * ScaleByLevel(level, 0.005)
        );

        return {
          id: playerId,
          index: players.length,
          name: profile.name,
          user: null,
          group: group,

          level: level,
          hitPoints: hitPoints,
          speed: monsterSpeed,
          interval: FixedFloat(1 / monsterSpeed),
          next: time + FixedFloat(1 / monsterSpeed),

          maxHitPoints: hitPoints,
          baseSpeed: monsterSpeed,

          skills: profile.skills,

          tier: profile.tier,
          drop: profile.drop,

          stats: {
            "Damage Dealt": 0,
            "Damage Taken": 0,
            "Healing Done": 0,
            "Kills Made": 0,
            "Turns Taken": 0,
          },
          thresholds: profile.thresholds,

          activeEffects: [],
        };
      }

      if (from) {
        if (profile.name == "Lil Grunt" && from.name == "Lil Grunt") {
          const level = from.level;
          const hitPoints = from.hitPoints;

          const monster = CreateMonster(level, hitPoints);

          PushToPlayers(monster, group);
          return;
        }

        if (
          profile.name == "Chicken" ||
          profile.name == "Shelldon" ||
          profile.name == "Wolf"
        ) {
          const gearTypeMap = {
            Chicken: ["Chicken Stick", "weapon"],
            Shelldon: ["Shelldon", "active"],
            Wolf: ["Wolf Stick", "weapon"],
          };

          const [gear, type] = gearTypeMap[name];

          const level = Math.max(1, 10 * from.gear[type].list[gear] - 10);
          const hitPoints = Math.round(
            profile.hitPoints * ScaleByLevel(from.gear[type].list[gear], 0.2)
          );

          const monster = CreateMonster(level, hitPoints);

          monster.thresholds.ownerId = from.id;

          PushToPlayers(monster, group);
          return;
        }

        const level = Math.max(
          1,
          Math.floor(Math.random() * 5) + (averageLevel - 4)
        );
        const hitPoints = Math.round(
          profile.hitPoints * ScaleByLevel(level, 0.04)
        );

        const monster = CreateMonster(level, hitPoints);

        PushToPlayers(monster, group);
        return;
      } else {
        const level = Math.max(
          1,
          Math.floor(Math.random() * 5) + (averageLevel - 4)
        );
        const hitPoints = Math.round(
          profile.hitPoints * ScaleByLevel(level, 0.04)
        );

        const monster = CreateMonster(level, hitPoints);

        PushToPlayers(monster, group);
        return;
      }
    }

    // -=+=- Ally team -=+=-
    const authorProfile = await client.fetchProfile(interaction.user.id);

    if (authorProfile.party && authorProfile.party.members.length > 1) {
      if (
        authorProfile.party.leader._id.toString() !=
        authorProfile._id.toString()
      ) {
        return await interaction.reply({
          content: `Only the party leader can start a battle! Alternatively, you can leave the party.`,
          ephemeral: true,
        });
      }

      if (authorProfile.party.members.some((member) => member.profile.isBusy)) {
        return await interaction.reply({
          content: `A party member is currently busy!`,
          ephemeral: true,
        });
      }

      if (authorProfile.party.members.some((member) => !member.ready)) {
        return await interaction.reply({
          content: `All party members have to be ready to start a battle! Alternatively, you can leave the party.`,
          ephemeral: true,
        });
      }

      for (const member of authorProfile.party.members) {
        member.profile = await client.fetchProfile(member.profile.userId);
        await PushUser(member.profile, 1);
      }
    } else {
      if (authorProfile.isBusy) {
        return await interaction.reply({
          content: `You're currently busy!`,
          ephemeral: true,
        });
      }

      await PushUser(authorProfile, 1);
    }

    // -=+=- Enemy team -=+=-
    const averageLevel = Math.round(
      allies.reduce((total, ally) => total + ally.level, 0) / allies.length
    );

    for (const enemy of startEnemies) {
      await PushMonster(enemy, 2, 0, null);
    }

    // -=+=- Battle starting -=+=-
    const reply = await interaction.reply({
      content: "Battle started! See the thread below.",
      fetchReply: true,
    });

    const thread = await reply.startThread({
      name: `${allies[0].name}'s party VS ${enemies[0].name}'s party`,
    });

    for (const player of players.filter((p) => p.user)) {
      await thread.members.add(player.user);
    }

    // -=+=- Main battle logic -=+=-
    async function HandleTurn(player) {
      const next = Math.floor(
        new Date(Date.now() + (overtime ? 7.5 * 1000 : 15 * 1000)).getTime() /
          1000
      );

      const turnEmbed = new EmbedBuilder()
        .setTitle(
          `${overtime ? `⏰ ` : `\0`}\`[${player.level}]\` ${
            player.name
          }'s turn!${
            player.user ? ` (ends <t:${next}:R>)` : `\0`
          } (**${currentTime.toFixed(2)}**)${overtime ? ` ⏰` : `\0`}`
        )
        .setDescription(
          player.user ? `Choose a move!` : `Monster is choosing a move...`
        )
        .addFields([
          {
            name: "-=+=- Hunters -=+=-",
            value: MapPlayers(allies),
            inline: true,
          },
          {
            name: "-=+=- Monsters -=+=-",
            value: MapPlayers(enemies),
            inline: true,
          },
          {
            name: "-=+=- Upcoming turns -=+=-",
            value: MapTurns(players),
          },
        ])
        .setColor(overtime ? "Red" : "Green");

      // -=+=- Buttons -=+=-
      let buttons = [];

      if (player.user) {
        player.gear.active.equipped.forEach((gear, index) => {
          if (gear) {
            let onCooldown = false;
            let gearCooldown = 0;

            for (const cooldown of player.cooldowns) {
              if (cooldown[0] == gear) {
                if (cooldown[1] > 0) {
                  gearCooldown = cooldown[1];
                  cooldown[1]--;
                  onCooldown = true;
                } else {
                  player.cooldowns = player.cooldowns.filter(
                    (c) => c != cooldown
                  );
                }
              }
            }

            const gearButton = new ButtonBuilder()
              .setCustomId(`${index}:${interaction.id}`)
              .setEmoji(client.getEmoji(gear))
              .setDisabled(onCooldown)
              .setStyle(onCooldown ? ButtonStyle.Danger : ButtonStyle.Success);

            if (onCooldown) {
              gearButton.setLabel(`(${gearCooldown})`);
            }

            if (gear == "Shelldon" && allies.length >= 6) {
              gearButton.setDisabled(true);
              gearButton.setStyle(ButtonStyle.Danger);
            }

            buttons.push(gearButton);
          }
        });
      }

      const skipTurn = buttons.every((button) => button.data.disabled);

      const effectsButton = new ButtonBuilder()
        .setCustomId(`effects:${interaction.id}`)
        .setEmoji(client.getEmoji("effects"))
        .setStyle(ButtonStyle.Secondary);

      buttons.push(effectsButton);

      const components = [new ActionRowBuilder().addComponents(...buttons)];

      const turnReply = await thread.send({
        content: `${player.user || ""}`,
        embeds: [turnEmbed],
        components: components,
      });

      let active = "";

      // -=+=- Determine move -=+=-
      if (!player.user) {
        function ChangeChance(skillChances) {
          for (const skillChance of skillChances) {
            skills.find((skill) => skill[0] == skillChance[0])[1] =
              skillChance[1];
          }
        }

        const skills = player.skills.map((skill) => [...skill]);

        // Change skill chance if necessary
        switch (player.name) {
          case "Berserker":
            if (player.hitPoints <= FixedFloat(player.maxHitPoints * 0.25)) {
              ChangeChance([
                ["Axe Spin", 25],
                ["Punch", 50],
                ["Axe Throw", 25],
              ]);
            }
            break;
          case "Big Papa":
            if (
              player.activeEffects.filter((effect) => effect.from == "Dash")
                .length
            ) {
              ChangeChance([
                ["Dash", 0],
                ["Sharp Claw", 67],
                ["Flame Breath", 33],
              ]);
            }
            break;
          case "Bone Smasher":
            if (
              player.activeEffects.filter((effect) => effect.from == "Dash")
                .length
            ) {
              ChangeChance([
                ["Dash", 0],
                ["Strong Chop", 34],
                ["Body Slam", 33],
                ["Fire Vortex", 33],
              ]);
            }
            break;
          case "Charger":
            if (player.thresholds.chargeStacks == 0) {
              ChangeChance([
                ["Charge", 0],
                ["Charge Up", 100],
              ]);
            } else if (player.thresholds.chargeStacks == 5) {
              ChangeChance([
                ["Charge Up", 0],
                ["Charge", 100],
              ]);
            }
            break;
          case "Executioner":
            if (
              player.activeEffects.filter(
                (effect) => effect.from == "Jump Away"
              ).length
            ) {
              ChangeChance([
                ["Jump Away", 0],
                ["Axe Slash", 67],
                ["Energy Blast", 33],
              ]);
            }
            break;
          case "Heavy Spitter":
            if (player.hitPoints <= FixedFloat(player.maxHitPoints * 0.5)) {
              ChangeChance([
                ["Retreat", 33],
                ["Spit", 67],
              ]);
            }
            break;
          case "Juggler":
            if (
              player.activeEffects.filter((effect) => effect.from == "Teleport")
                .length
            ) {
              ChangeChance([
                ["Teleport", 0],
                ["Fire Breath", 67],
                ["Fireball Juggling", 33],
              ]);
            }
            break;
          case "Jumper":
            if (
              player.activeEffects.filter(
                (effect) => effect.from == "Jump Away"
              ).length
            ) {
              ChangeChance([
                ["Jump Away", 0],
                ["Triple Stab", 100],
              ]);
            }
            break;
          case "Knight":
            if (
              player.activeEffects.filter((effect) => effect.from == "Decoy")
                .length
            ) {
              ChangeChance([
                ["Decoy", 0],
                ["Slash", 100],
              ]);
            }
            break;
          case "Lil Beetle":
            if (
              player.activeEffects.filter(
                (effect) => effect.from == "Swordplay"
              ).length
            ) {
              ChangeChance([
                ["Swordplay", 0],
                ["Slash", 100],
              ]);
            }
            break;
          case "Lil Grenadier":
            if (player.hitPoints <= FixedFloat(player.maxHitPoints * 0.5)) {
              ChangeChance([
                ["Retreat", 33],
                ["Grenade Throw", 67],
              ]);
            }
            break;
          case "Lil Grunt":
            if (enemies.length >= 6 || player.thresholds.screamed) {
              ChangeChance([
                ["Scream", 0],
                ["Slash", 100],
              ]);
            }
            break;
          case "Lil Spitter":
            if (player.hitPoints <= FixedFloat(player.maxHitPoints * 0.5)) {
              ChangeChance([
                ["Retreat", 50],
                ["Spit", 50],
              ]);
            }
            break;
          case "Toxic Sapling":
            if (player.thresholds.growStacks == 5) {
              ChangeChance([
                ["Grow", 0],
                ["Life Steal", 100],
              ]);
            }
            break;
        }

        const rng = Math.ceil(Math.random() * 100);
        let total = 0;

        for (let i = 0; i < skills.length; i++) {
          total += skills[i][1];

          if (rng <= total) {
            active = skills[i][0];
            break;
          }
        }

        const collector = turnReply.createMessageComponentCollector({
          componentType: ComponentType.Button,
          filter: (i) => i.customId.endsWith(interaction.id),
          time: overtime ? 1.5 * 1000 : 3 * 1000,
        });

        collector.on("collect", async (i) => {
          if (i.customId == `effects:${interaction.id}`) {
            await i.reply({
              content: `${
                player.activeEffects.length
                  ? `**${player.name}**'s effects:\n${player.activeEffects
                      .map((effect) => MapEffect(effect))
                      .join("\n")}`
                  : `**${player.name}** currently has no effects.`
              }`,
              ephemeral: true,
            });
          }
        });

        await wait(overtime ? 1.5 * 1000 : 3 * 1000);
      } else {
        if (skipTurn) {
          active = "skip";
        } else {
          const collector = turnReply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) =>
              i.user.username == player.name &&
              i.customId.endsWith(interaction.id),
            time: overtime ? 7.5 * 1000 : 15 * 1000,
          });

          collector.on("collect", async (i) => {
            if (i.customId == `effects:${interaction.id}`) {
              await i.reply({
                content: `${
                  player.activeEffects.length
                    ? `**${player.name}**'s effects:\n${player.activeEffects
                        .map((effect) => MapEffect(effect))
                        .join("\n")}`
                    : `**${player.name}** currently has no effects.`
                }`,
                ephemeral: true,
              });
            } else {
              active = player.gear.active.equipped[i.customId.slice(0, 1)];
              collector.stop();
            }
          });

          // Wait or advance forward when collected
          await Promise.race([
            new Promise((resolve) => collector.on("end", resolve)),
            wait(overtime ? 7.5 * 1000 : 15 * 1000),
          ]);
        }
      }

      // -=+=- Turn variables -=+=-
      let victim;
      let victims = [];
      let affected = [];

      let staticDamage = 0;
      let realDamage = 0;
      let dealtDamage = 0;
      let activeDamage = 0;
      let passiveDamage = 0;
      let weaponDamage = 0;
      let totalDamage = 0;

      let staticDoT = 0;

      let staticHealing = 0;
      let doneHealing = 0;
      let activeHealing = 0;
      let passiveHealing = 0;
      let weaponHealing = 0;
      let totalHealing = 0;

      let speed = 0;
      let stun = 0;
      let damageReduction = 1;
      let damageIncrease = 1;

      let chance;
      let duration;

      let bunchOfDiceActivated = false; // Bunch of Dice
      let hitEnemies = []; // Techno Fists

      // -=+=- Effect system -=+=-
      function GetIncRed(player, target) {
        let Increase = 1;
        for (const effect of player.activeEffects) {
          if (effect.type == "DamageIncrease") Increase += effect.value - 1;
        }

        let Reduction = 1;
        for (const effect of target.activeEffects) {
          if (effect.type == "DamageReduction") Reduction -= 1 - effect.value;
        }

        return Increase * Reduction;
      }

      async function AddEffect(player, target, type, from, value, duration) {
        if (!target) return;

        // Remove old same effect
        target.activeEffects = target.activeEffects.filter(
          (e) => !(e.type == type && e.from == from && e.by == player.id)
        );

        // Add new effect
        const newEffect = {
          type: type,
          from: from,
          value: value,
          duration: duration,
          by: player.id,
          initial: true,
        };

        let handle = true;
        if (player != target) {
          newEffect.initial = false;

          if (duration > 1) {
            if (type == "Damage") {
              newEffect.value = Math.round(
                newEffect.value * GetIncRed(player, target)
              );
              realDamage = newEffect.value;
              handle = false;
            }
            if (type == "Healing") {
              handle = false;
            }
          }
        }

        target.activeEffects.push(newEffect);

        if (handle && type != "DamageIncrease") {
          await HandleEffect(
            player,
            target,
            target.activeEffects.find((effect) => effect == newEffect)
          );
        }
      }

      async function HandleEffect(player, target, effect) {
        let EffectValue = 0;

        // Medicine Ball
        if (target.activeEffects.find((effect) => effect.type == "Cleanse")) {
          target.activeEffects = target.activeEffects.filter(
            (effect) =>
              !(
                (effect.type === "Damage" && effect.duration > 1) ||
                (effect.type === "Speed" && effect.value < 0) ||
                effect.type === "Stun"
              )
          );

          if (
            (effect.type == "Damage" && effect.duration > 1) ||
            (effect.type == "Speed" && effect.value < 0) ||
            effect.type == "Stun"
          )
            return;
        }

        if (effect.type == "Speed") {
          target.activeEffects.forEach((effect) => {
            if (effect.type == "Speed") {
              EffectValue += effect.value;
            }
          });
        } else {
          EffectValue = effect.value;
        }

        // Handle effect
        switch (effect.type) {
          case "Damage":
            EffectValue = Math.round(EffectValue * GetIncRed(player, target));
            realDamage = EffectValue;
            EffectValue = Math.min(target.hitPoints, EffectValue);
            dealtDamage = EffectValue;

            if (gearArray.active.includes(effect.from))
              activeDamage += EffectValue;
            if (gearArray.passive.includes(effect.from))
              passiveDamage += EffectValue;
            if (gearArray.weapon.includes(effect.from))
              weaponDamage += EffectValue;

            totalDamage += EffectValue;

            player.stats["Damage Dealt"] += EffectValue;
            target.stats["Damage Taken"] += EffectValue;

            // Wolf Stick
            target.thresholds["Wolf Stick"] += EffectValue;

            // Chicken Stick
            if (EffectValue == target.hitPoints) {
              player.stats["Kills Made"] += 1;
              player.thresholds["Chicken Stick"] += 1;
              if (gearArray.active.includes(effect.from))
                player.thresholds["Explode-o-matic Trigger"] += 1;
            }

            // Spinsickle
            if (
              target.activeEffects.find((effect) => effect.from == "Spinsickle")
            ) {
              target.activeEffects = target.activeEffects.filter(
                (effect) => effect.from != "Spinsickle"
              );
            }

            if (player.user && gearArray.active.includes(effect.from)) {
              // Techno Fists
              if (!hitEnemies.includes(target.id)) hitEnemies.push(target.id);

              // Monster Slugger
              if (target.hitPoints >= Math.round(target.maxHitPoints * 0.33))
                player.thresholds["Monster Slugger"] += 1;

              // Spinsickle
              let found = false;
              if (player.thresholds["Spinsickle"].length) {
                for (const entry of player.thresholds["Spinsickle"]) {
                  if (entry[0] == target.id) {
                    if (player.stats["Turns Taken"] - 1 == entry[2]) {
                      entry[1] += 1;
                      entry[2] += 1;
                    } else {
                      player.thresholds["Spinsickle"] = player.thresholds[
                        "Spinsickle"
                      ].filter((item) => item != entry);
                    }

                    found = true;
                    break;
                  }
                }
              }

              if (!found) {
                player.thresholds["Spinsickle"].push([
                  target.id,
                  1,
                  player.stats["Turns Taken"],
                ]);
              }
            }

            // If alarm bell is hit
            if (target.name == "Alarm Bell") {
              target.thresholds.hit = true;
            }

            target.hitPoints -= EffectValue;
            break;
          case "Healing":
            EffectValue = Math.min(
              target.maxHitPoints - target.hitPoints,
              EffectValue
            );
            doneHealing = EffectValue;

            if (gearArray.active.includes(effect.from))
              activeHealing += EffectValue;
            if (gearArray.passive.includes(effect.from))
              passiveHealing += EffectValue;
            if (gearArray.weapon.includes(effect.from))
              weaponHealing += EffectValue;
            totalHealing += EffectValue;

            player.stats["Healing Done"] += EffectValue;

            // Medicine Ball
            player.thresholds["Medicine Ball"] += EffectValue;

            target.hitPoints += EffectValue;
            break;
          case "Speed":
            target.speed = Math.max(
              0.33,
              Math.min(FixedFloat(target.baseSpeed + EffectValue), 3.0)
            );

            const oldInterval = target.interval;
            target.interval = FixedFloat(1 / target.speed);
            const newInterval = target.interval;

            if (effect.duration == 1 || player != target) {
              target.next = target.next - oldInterval + newInterval;
            }
            break;
          case "Stun":
            target.next = FixedFloat(
              target.next + EffectValue * target.interval
            );
            break;
        }

        // Decrease duration
        effect.duration--;

        // Expired effect
        if (effect.duration == 0) {
          target.activeEffects = target.activeEffects.filter(
            (e) => e != effect
          );

          if (effect.type == "Speed") {
            target.speed = FixedFloat(target.speed - effect.value);
            target.interval = FixedFloat(1 / target.speed);
          }
        }
      }

      async function CalculateEffect(range, increase) {
        if (range.length == 2) {
          return Math.round(
            Math.ceil(Math.random() * (range[1] - range[0]) + range[0]) *
              increase
          );
        } else {
          return FixedFloat(range[0] * increase);
        }
      }

      // -=+=- Turn preparation -=+=-
      function DetermineSides(player) {
        if (allAllies.includes(player)) {
          teammates = allies;
          opponents = enemies;
        } else {
          teammates = enemies;
          opponents = allies;
        }
      }

      function FilterDeadPlayers() {
        players = players.filter((player) => player.hitPoints > 0);
        allies = allies.filter((ally) => ally.hitPoints > 0);
        enemies = enemies.filter((enemy) => enemy.hitPoints > 0);
      }

      // -=+=- Handle active gear -=+=-
      async function HandleActive(active, isFromActive) {
        DetermineSides(player);

        if (!opponents.length) return;

        let activeReply;

        affected = [];

        if (player.thresholds["Active Ace"]) {
          player.gear.active.list[active] += 2;
        }

        let minMax;

        switch (active) {
          case "Boombox":
            for (const victim of opponents) {
              staticDamage = await CalculateEffect(
                [14, 18],
                (overtime ? 2 : 1) *
                  ScaleByLevel(player.gear.active.list[active], 0.1)
              );
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              if (Math.random() <= 0.5) {
                stun = await CalculateEffect(
                  [0.4],
                  ScaleByLevel(player.gear.active.list[active], 0.05)
                );
                await AddEffect(player, victim, "Stun", active, stun, 1);
              } else {
                stun = 0;
              }

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
                stun
                  ? `, **${Math.round(stun * 100)}%** ${client.getEmoji(
                      "stun"
                    )} (1)`
                  : ``,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1] + a[2])
              .join("\n")}`;
            break;
          case "Life Jacket":
            damageReduction =
              1 -
              (await CalculateEffect(
                [0.2],
                ScaleByLevel(player.gear.active.list[active], 0.05)
              ));
            await AddEffect(
              player,
              player,
              "DamageReduction",
              active,
              damageReduction,
              2
            );

            affected.push([
              AffectedText(player),
              ` **${Math.round(
                (1 - damageReduction) * 100
              )}%** ${client.getEmoji("damage_reduction")} (2)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Monster Taser":
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            staticDamage = await CalculateEffect(
              [28, 32],
              (overtime ? 2 : 1) *
                ScaleByLevel(player.gear.active.list[active], 0.1)
            );
            await AddEffect(player, victim, "Damage", active, staticDamage, 1);

            affected.push([
              AffectedText(victim),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
            ]);

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Really Cool Sticker":
            damageIncrease =
              1 +
              (await CalculateEffect(
                [0.4],
                ScaleByLevel(player.gear.active.list[active], 0.05)
              ));
            await AddEffect(
              player,
              player,
              "DamageIncrease",
              active,
              damageIncrease,
              3
            );

            affected.push([
              AffectedText(player),
              ` **${Math.round(
                (damageIncrease - 1) * 100
              )}%** ${client.getEmoji("damage_increase")} (3)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Shelldon":
            await PushMonster("Shelldon", 1, currentTime, player);

            activeReply = `**${player.name}** used **${active}**! **1 Shelldon** has been spawned.`;
            break;
          case "Smart Fireworks":
            for (const victim of opponents) {
              staticDamage = await CalculateEffect(
                [8, 12],
                (overtime ? 2 : 1) *
                  ScaleByLevel(player.gear.active.list[active], 0.1)
              );
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1])
              .join("\n")}`;
            break;
          case "Snow Globe":
            for (const victim of opponents) {
              staticDoT = await CalculateEffect(
                [3, 7],
                (overtime ? 2 : 1) *
                  ScaleByLevel(player.gear.active.list[active], 0.1)
              );
              await AddEffect(player, victim, "Damage", active, staticDoT, 3);

              speed = await CalculateEffect(
                [-0.15],
                ScaleByLevel(player.gear.active.list[active], 0.05)
              );
              await AddEffect(player, victim, "Speed", active, speed, 3);

              affected.push([
                AffectedText(victim),
                ` **-${realDamage}** ${client.getEmoji("damage")} (3)`,
                `, **${speed.toFixed(2)}** ${client.getEmoji("speed")} (3)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1] + a[2])
              .join("\n")}`;
            break;
          case "Turbo Pills":
            staticHealing = await CalculateEffect(
              [14, 18],
              (overtime ? 0.5 : 1) *
                ScaleByLevel(player.gear.active.list[active], 0.1)
            );
            await AddEffect(
              player,
              player,
              "Healing",
              active,
              staticHealing,
              2
            );

            speed = await CalculateEffect(
              [0.18],
              ScaleByLevel(player.gear.active.list[active], 0.05)
            );
            await AddEffect(player, player, "Speed", active, speed, 2);

            affected.push([
              AffectedText(player),
              ` **+${staticHealing}** ${client.getEmoji("health")} (2)`,
              `, **+${speed.toFixed(2)}** ${client.getEmoji("speed")} (2)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**!\n${affected.map(
              (a) => a[0] + a[1] + a[2]
            )}`;
            break;
          case "Water Balloon":
            for (const victim of teammates) {
              staticHealing = await CalculateEffect(
                [14, 18],
                (overtime ? 0.5 : 1) *
                  ScaleByLevel(player.gear.active.list[active], 0.1)
              );
              await AddEffect(
                player,
                victim,
                "Healing",
                active,
                staticHealing,
                1
              );

              if (doneHealing) {
                affected.push([
                  AffectedText(victim),
                  ` **+${doneHealing}** ${client.getEmoji("health")} (1)`,
                ]);
              }
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all teammates**!\n${affected
              .map((a) => a[0] + a[1])
              .join("\n")}`;
            break;

          case "Axe Slash": // executioner, overlord
            if (player.name == "Executioner") minMax = [13, 17];
            if (player.name == "Overlord") minMax = [18, 22];

            staticDamage = await CalculateEffect(
              [...minMax],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );

            for (const victim of opponents) {
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1])
              .join("\n")}`;
            break;
          case "Axe Spin": // berserker
            for (let i = 0; i < 4; i++) {
              if (Math.random() <= 0.5) {
                staticDamage += await CalculateEffect(
                  [12, 12],
                  (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
                );
              }
            }

            if (Math.random() <= 0.25) {
              staticDamage += await CalculateEffect(
                [24, 24],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );
            }

            for (const victim of opponents) {
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              ]);
            }

            if (staticDamage) {
              activeReply = `**${
                player.name
              }** used **${active}** on **all opponents**!\n${affected
                .map((a) => a[0] + a[1])
                .join("\n")}`;
            } else {
              activeReply = `**${player.name}** used **${active}** on **all opponents**, but didn't hit anyone.`;
            }
            break;
          case "Axe Throw": // berserker
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            player.activeEffects.filter(
              (effect) => (effect.from = "Threshold:hp_1")
            ).length
              ? (chance = 0.5)
              : (chance = 0.25);

            if (Math.random() <= chance) {
              staticDamage = await CalculateEffect(
                [60, 60],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              ]);
            }

            if (staticDamage) {
              activeReply = `**${player.name}** used **${active}** on **${
                victim.name
              }**!\n${affected.map((a) => a[0] + a[1])}`;
            } else {
              activeReply = `**${player.name}** used **${active}** on **${victim.name}**, but missed.`;
            }
            break;
          case "Body Slam": // bone smasher, wolf
            switch (player.name) {
              case "Bone Smasher":
                staticDamage = await CalculateEffect(
                  [15, 19],
                  (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
                );
                stun = await CalculateEffect(
                  [0.16],
                  ScaleByLevel(player.level, 0.01)
                );
                break;
              case "Wolf":
                staticDamage = await CalculateEffect(
                  [8, 12],
                  (overtime ? 2 : 1) *
                    ScaleByLevel(
                      allPlayers.find((p) => p.id == player.thresholds.ownerId)
                        .gear.weapon.list["Wolf Stick"],
                      0.1
                    )
                );
                stun = await CalculateEffect(
                  [0.12],
                  ScaleByLevel(
                    allPlayers.find((p) => p.id == player.thresholds.ownerId)
                      .gear.weapon.list["Wolf Stick"],
                    0.05
                  )
                );
                break;
            }

            for (const victim of opponents) {
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );
              await AddEffect(player, victim, "Stun", active, stun, 1);

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
                `, **${Math.round(stun * 100)}%** ${client.getEmoji(
                  "stun"
                )} (1)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1] + a[2])
              .join("\n")}`;
            break;
          case "Charge": // charger
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            const chargeStacks = player.thresholds.chargeStacks;
            player.thresholds.chargeStacks = 0;

            for (let i = 0; i < chargeStacks; i++) {
              staticDamage += await CalculateEffect(
                [14, 18],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );
            }
            speed = FixedFloat(0.2 * chargeStacks);
            speed = await CalculateEffect(
              [speed],
              ScaleByLevel(player.level, 0.01)
            );

            await AddEffect(player, victim, "Damage", active, staticDamage, 1);
            await AddEffect(player, player, "Speed", active, speed, 1);

            affected.push(
              [
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              ],
              [
                AffectedText(player),
                ` **+${speed.toFixed(2)}** ${client.getEmoji("speed")} (1)`,
              ]
            );

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**! They consumed **${chargeStacks}** Charge stack${
              chargeStacks > 1 ? `s` : ``
            }.\n${affected.map((a) => a[0] + a[1]).join("\n")}`;
            break;
          case "Charge Up": // charger
            player.thresholds.chargeStacks += 1;

            activeReply = `**${player.name}** used **${active}**! They gained **1** Charge stack (**${player.thresholds.chargeStacks}** total).`;
            break;
          case "Chase": // scorcher, boomer
            const range = Math.floor(players.length / 2) - 1;
            victim = players[Math.floor(Math.random() * range + 1)];
            player.next = victim.next - player.interval;

            staticDamage = await CalculateEffect(
              [5, 10],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );
            await AddEffect(player, victim, "Damage", active, staticDamage, 1);

            affected.push([
              AffectedText(victim),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**! They advanced forward to **${
              victim.name
            }**'s action time.\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Dash": // big papa, bone smasher
            damageReduction =
              1 -
              (await CalculateEffect([0.1], ScaleByLevel(player.level, 0.01)));
            await AddEffect(
              player,
              player,
              "DamageReduction",
              active,
              damageReduction,
              2
            );

            speed = await CalculateEffect(
              [0.24],
              ScaleByLevel(player.level, 0.01)
            );
            await AddEffect(player, player, "Speed", active, speed, 3);

            affected.push([
              AffectedText(player),
              ` **${Math.round(
                (1 - damageReduction) * 100
              )}%** ${client.getEmoji("damage_reduction")} (2)`,
              `, **+${speed.toFixed(2)}** ${client.getEmoji("speed")} (3)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**!\n${affected.map(
              (a) => a[0] + a[1] + a[2]
            )}`;
            break;
          case "Decoy": // knight
            damageReduction =
              1 -
              (await CalculateEffect([0.26], ScaleByLevel(player.level, 0.01)));

            await AddEffect(
              player,
              player,
              "DamageReduction",
              active,
              damageReduction,
              2
            );

            affected.push([
              AffectedText(player),
              ` **${Math.round(
                (1 - damageReduction) * 100
              )}%** ${client.getEmoji("damage_reduction")} (2)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Energy Blast": // executioner, overlord
            if (player.name == "Executioner") minMax = [13, 17];
            if (player.name == "Overlord") minMax = [18, 22];

            for (const victim of opponents) {
              staticDamage = await CalculateEffect(
                [...minMax],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              if (Math.random() <= 0.5) {
                stun = await CalculateEffect(
                  [0.26],
                  ScaleByLevel(player.level, 0.01)
                );
                await AddEffect(player, victim, "Stun", active, stun, 1);
              } else {
                stun = 0;
              }

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
                stun
                  ? `, **${Math.round(stun * 100)}%** ${client.getEmoji(
                      "stun"
                    )} (1)`
                  : ``,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1] + a[2])
              .join("\n")}`;
            break;
          case "Fire Breath": // juggler
            for (const victim of opponents) {
              staticDamage = await CalculateEffect(
                [13, 17],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1])
              .join("\n")}`;
            break;
          case "Flame Breath": // big papa, scorcher
            switch (player.name) {
              case "Big Papa":
                chance = 0.33;
                minMax = [10, 14];
                break;
              case "Scorcher":
                chance = 0.5;
                minMax = [5, 9];
                break;
            }

            for (const victim of opponents) {
              if (Math.random() <= chance) {
                staticDoT = await CalculateEffect(
                  [...minMax],
                  (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
                );
                await AddEffect(player, victim, "Damage", active, staticDoT, 3);

                affected.push([
                  AffectedText(victim),
                  ` **-${realDamage}** ${client.getEmoji("damage")} (3)`,
                ]);
                victims.push(victim.name);
              }
            }

            if (victims.length) {
              activeReply = `**${
                player.name
              }** used **${active}** on **${victims
                .map((v) => v)
                .join(", ")}**!\n${affected
                .map((a) => a[0] + a[1])
                .join("\n")}`;
            } else {
              activeReply = `**${player.name}** used **${active}**, but didn't hit anyone.`;
            }
            break;
          case "Fire Vortex": // bone smasher
            staticDamage = await CalculateEffect(
              [13, 17],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );
            staticDoT = await CalculateEffect(
              [6, 10],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );

            for (const victim of opponents) {
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );
              const dmg = dealtDamage;

              await AddEffect(player, victim, "Damage", active, staticDoT, 2);
              const dot = realDamage;

              affected.push([
                AffectedText(victim),
                ` **-${dmg}** ${client.getEmoji("damage")} (1)`,
                `, **-${dot}** ${client.getEmoji("damage")} (2)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1] + a[2])
              .join("\n")}`;
            break;
          case "Fireball Juggling": // juggler
            for (let i = 0; i < 5; i++) {
              victim = opponents[Math.floor(Math.random() * opponents.length)];

              staticDamage = await CalculateEffect(
                [6, 6],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );

              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              let found = false;
              for (const v of victims) {
                if (v[0].id == victim.id && v[0].name == victim.name) {
                  v[1] += dealtDamage;
                  found = true;
                  break;
                }
              }

              if (!found) {
                victims.push([victim, dealtDamage]);
              }
            }

            victims.sort((a, b) => {
              return a[0] - b[0];
            });

            for (const victim of victims) {
              affected.push([
                AffectedText(victim[0]),
                ` **-${victim[1]}** ${client.getEmoji("damage")} (1)`,
              ]);
            }

            activeReply = `**${player.name}** used **${active}** on **${victims
              .map((v) => v[0].name)
              .join(", ")}**!\n${affected.map((a) => a[0] + a[1]).join("\n")}`;
            break;
          case "Grenade Throw": // lil grenadier
            for (const victim of opponents) {
              staticDamage = await CalculateEffect(
                [8, 12],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );
              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1])
              .join("\n")}`;
            break;
          case "Grow": // toxic sapling
            player.thresholds.growStacks += 1;

            damageIncrease = FixedFloat(0.16 * player.thresholds.growStacks);
            damageIncrease =
              1 +
              (await CalculateEffect(
                [damageIncrease],
                ScaleByLevel(player.level, 0.01)
              ));
            await AddEffect(
              player,
              player,
              "DamageIncrease",
              active,
              damageIncrease,
              100
            );

            speed = FixedFloat(-0.1 * player.thresholds.growStacks);
            speed = await CalculateEffect(
              [speed],
              ScaleByLevel(player.level, 0.01)
            );
            await AddEffect(player, player, "Speed", active, speed, 100);

            affected.push([
              AffectedText(player),
              ` **${speed.toFixed(2)}** ${client.getEmoji("speed")} (∞)`,
              `, **${Math.round(
                (damageIncrease - 1) * 100
              )}%** ${client.getEmoji("damage_increase")} (∞)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**! They gained **1** Grow stack (**${
              player.thresholds.growStacks
            }** total).\n${affected.map((a) => a[0] + a[1] + a[2])}`;
            break;
          case "Hatch": // scorcher egg
            player.thresholds.turns--;

            if (player.thresholds.turns > 0) {
              activeReply = `**${player.name}** used **${active}**! It needs **${player.thresholds.turns}** more turn to hatch.`;
            } else {
              players = players.filter((p) => p != player);
              enemies = enemies.filter((e) => e != player);
              allEnemies = allEnemies.filter((e) => e != player);

              await PushMonster("Scorcher", 2, currentTime, null);

              activeReply = `**${player.name}** used **${active}**! It has hatched into a Scorcher.`;
            }
            break;
          case "Headbutt": // boomer, shelldon
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            switch (player.name) {
              case "Boomer":
                staticDamage = await CalculateEffect(
                  [15, 19],
                  (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
                );
                stun = await CalculateEffect(
                  [0.12],
                  ScaleByLevel(player.level, 0.01)
                );
                break;
              case "Shelldon":
                staticDamage = await CalculateEffect(
                  [15, 19],
                  (overtime ? 2 : 1) *
                    ScaleByLevel(
                      allPlayers.find((p) => p.id == player.thresholds.ownerId)
                        .gear.active.list["Shelldon"],
                      0.1
                    )
                );
                stun = await CalculateEffect(
                  [0.12],
                  ScaleByLevel(
                    allPlayers.find((p) => p.id == player.thresholds.ownerId)
                      .gear.active.list["Shelldon"],
                    0.05
                  )
                );
                break;
            }

            await AddEffect(player, victim, "Damage", active, staticDamage, 1);
            await AddEffect(player, victim, "Stun", active, stun, 1);

            affected.push([
              AffectedText(victim),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              `, **${Math.round(stun * 100)}%** ${client.getEmoji("stun")} (1)`,
            ]);

            await AddEffect(
              player,
              player,
              "Damage",
              active,
              Math.round(dealtDamage / 2),
              1
            );

            affected.push([
              AffectedText(player),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
            ]);

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**!\n${affected
              .map((a) => a[0] + a[1] + (a[2] || ""))
              .join("\n")}`;
            break;
          case "Jump Away": // executioner, jumper
            speed = await CalculateEffect(
              [0.3],
              ScaleByLevel(player.level, 0.01)
            );
            await AddEffect(player, player, "Speed", active, speed, 2);

            affected.push([
              AffectedText(player),
              ` **+${speed.toFixed(2)}** ${client.getEmoji("speed")} (2)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Life Steal": // toxic sapling
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            staticDamage = await CalculateEffect(
              [7, 11],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );
            await AddEffect(player, victim, "Damage", active, staticDamage, 1);

            staticHealing = Math.round(dealtDamage * (overtime ? 0.25 : 1));
            await AddEffect(
              player,
              player,
              "Healing",
              active,
              staticHealing,
              1
            );

            affected.push(
              [
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              ],
              [
                AffectedText(player),
                ` **+${doneHealing}** ${client.getEmoji("health")} (1)`,
              ]
            );

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**!\n${affected.map((a) => a[0] + a[1]).join("\n")}`;
            break;
          case "Punch": // berserker
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            staticDamage = await CalculateEffect(
              [18, 22],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );
            await AddEffect(player, victim, "Damage", active, staticDamage, 1);

            affected.push([
              AffectedText(victim),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
            ]);

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Reinforcements": // alarm bell
            if (enemies.length < 6) {
              const standard =
                monsterArray.standard[
                  Math.floor(Math.random() * monsterArray.standard.length)
                ];
              await PushMonster(standard, 2, currentTime, player);

              activeReply = `**${player.name}** used **${active}**! It spawned **1 ${standard}**.`;
            } else {
              activeReply = `**${player.name}** used **${active}**, but there are no empty spots.`;
            }
            break;
          case "Retreat": // lil spitter, lil grenadier, heavy spitter, chicken
            activeReply = `**${player.name}** used **${active}**! (no effects)`;
            break;
          case "Scavenge": // scavenger
            const lootIncrease = 1.1;
            player.drop.amount = FixedFloat(player.drop.amount * lootIncrease);
            player.drop.mocoins[0] = FixedFloat(
              player.drop.mocoins[0] * lootIncrease
            );
            player.drop.mocoins[1] = FixedFloat(
              player.drop.mocoins[1] * lootIncrease
            );
            player.drop.experience[0] = FixedFloat(
              player.drop.experience[0] * lootIncrease
            );
            player.drop.experience[1] = FixedFloat(
              player.drop.experience[1] * lootIncrease
            );

            activeReply = `**${
              player.name
            }** used **${active}**! Their loot drops have increased by **${Math.round(
              (lootIncrease - 1) * 100
            )}%**.`;
            break;
          case "Scratch": // scorcher, wolf
          case "Slash": // lil beetle, slasher, knight, lil grunt
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            const scratchSlashDamageMap = {
              Knight: [3, 7],
              "Lil Beetle": [8, 12],
              "Lil Grunt": [5, 9],
              Scorcher: [18, 22],
              Slasher: [8, 12],
              Wolf: [8, 12],
            };

            minMax = scratchSlashDamageMap[player.name];

            staticDamage = await CalculateEffect(
              [...minMax],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );
            await AddEffect(player, victim, "Damage", active, staticDamage, 1);

            affected.push([
              AffectedText(victim),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
            ]);

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Scream": // lil grunt
            player.thresholds.screamed = true;

            await PushMonster("Lil Grunt", 2, currentTime, player);

            activeReply = `**${player.name}** used **${active}**! It spawned **1 Lil Grunt**.`;
            break;
          case "Sharp Claw": // big papa
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            for (let i = 0; i < 2; i++) {
              staticDamage += await CalculateEffect(
                [10, 14],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );
            }
            await AddEffect(player, victim, "Damage", active, staticDamage, 1);

            affected.push([
              AffectedText(victim),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
            ]);

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Spit": // lil spitter, heavy spitter
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            switch (player.name) {
              case "Lil Spitter":
                duration = 1;
                speed = -0.1;
                minMax = [10, 14];
                break;
              case "Heavy Spitter":
                duration = 2;
                speed = -0.2;
                minMax = [18, 22];
                break;
            }

            staticDamage = await CalculateEffect(
              [...minMax],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );
            await AddEffect(player, victim, "Damage", active, staticDamage, 1);

            speed = await CalculateEffect(
              [speed],
              ScaleByLevel(player.level, 0.01)
            );
            await AddEffect(player, victim, "Speed", active, speed, duration);

            affected.push([
              AffectedText(victim),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              `, **${speed.toFixed(2)}** ${client.getEmoji(
                "speed"
              )} (${duration})`,
            ]);

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**!\n${affected.map((a) => a[0] + a[1] + a[2])}`;
            break;
          case "Strong Chop": // bone smasher
            victim = opponents[Math.floor(Math.random() * opponents.length)];

            staticDamage = await CalculateEffect(
              [20, 20],
              (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
            );
            await AddEffect(player, victim, "Damage", active, staticDamage, 1);

            affected.push([
              AffectedText(victim),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
            ]);

            activeReply = `**${player.name}** used **${active}** on **${
              victim.name
            }**!\n${affected.map((a) => a[0] + a[1])}`;
            break;
          case "Stumble": // scavenger
            staticDamage = Math.round(
              Math.ceil(0.25 * player.maxHitPoints) * (overtime ? 2 : 1)
            );
            await AddEffect(player, player, "Damage", active, staticDamage, 1);

            stun = await CalculateEffect(
              [0.24],
              ScaleByLevel(player.level, 0.01)
            );
            await AddEffect(player, player, "Stun", active, stun, 1);

            affected.push([
              AffectedText(player),
              ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
              `, **${Math.round(stun * 100)}%** ${client.getEmoji("stun")} (1)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**!\n${affected.map(
              (a) => a[0] + a[1] + a[2]
            )}`;
            break;
          case "Swordplay": // lil beetle
            speed = await CalculateEffect(
              [0.16],
              ScaleByLevel(player.level, 0.01)
            );

            for (const victim of teammates) {
              await AddEffect(player, victim, "Speed", active, speed, 2);

              affected.push([
                AffectedText(victim),
                ` **+${speed.toFixed(2)}** ${client.getEmoji("speed")} (2)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all teammates**!\n${affected
              .map((a) => a[0] + a[1])
              .join("\n")}`;
            break;
          case "Tail Whip": // slasher
            stun = await CalculateEffect(
              [0.28],
              ScaleByLevel(player.level, 0.01)
            );

            for (const victim of opponents) {
              staticDamage = await CalculateEffect(
                [8, 12],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );

              await AddEffect(
                player,
                victim,
                "Damage",
                active,
                staticDamage,
                1
              );
              await AddEffect(player, victim, "Stun", active, stun, 1);

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
                `, **${Math.round(stun * 100)}%** ${client.getEmoji(
                  "stun"
                )} (1)`,
              ]);
            }

            activeReply = `**${
              player.name
            }** used **${active}** on **all opponents**!\n${affected
              .map((a) => a[0] + a[1] + a[2])
              .join("\n")}`;
            break;
          case "Teleport": // juggler
            damageIncrease =
              1 +
              (await CalculateEffect([0.52], ScaleByLevel(player.level, 0.01)));
            await AddEffect(
              player,
              player,
              "DamageIncrease",
              active,
              damageIncrease,
              2
            );

            speed = await CalculateEffect(
              [-0.24],
              ScaleByLevel(player.level, 0.01)
            );
            await AddEffect(player, player, "Speed", active, speed, 1);

            affected.push([
              AffectedText(player),
              ` **${Math.round(
                (damageIncrease - 1) * 100
              )}%** ${client.getEmoji("damage_increase")} (2)`,
              `, **${speed.toFixed(2)}** ${client.getEmoji("speed")} (1)`,
            ]);

            activeReply = `**${
              player.name
            }** used **${active}**!\n${affected.map(
              (a) => a[0] + a[1] + a[2]
            )}`;
            break;
          case "Triple Stab": // jumper
            for (let i = 0; i < 3; i++) {
              if (Math.random() <= 0.5) {
                victim =
                  opponents[Math.floor(Math.random() * opponents.length)];

                staticDamage = await CalculateEffect(
                  [10, 14],
                  (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
                );
                await AddEffect(
                  player,
                  victim,
                  "Damage",
                  active,
                  staticDamage,
                  1
                );

                let found = false;
                for (const v of victims) {
                  if (v[0].id == victim.id && v[0].name == victim.name) {
                    v[1] += dealtDamage;
                    found = true;
                    break;
                  }
                }

                if (!found) {
                  victims.push([victim, dealtDamage]);
                }
              }
            }

            if (victims.length > 0) {
              victims.sort((a, b) => {
                return a[0] - b[0];
              });

              for (const victim of victims) {
                affected.push([
                  AffectedText(victim[0]),
                  ` **-${victim[1]}** ${client.getEmoji("damage")} (1)`,
                ]);
              }

              speed = FixedFloat(victims.length * 0.28);
              speed = await CalculateEffect(
                [speed],
                ScaleByLevel(player.level, 0.01)
              );
              await AddEffect(player, player, "Speed", active, speed, 1);

              affected.push([
                AffectedText(player),
                ` **${speed.toFixed(2)}** ${client.getEmoji("speed")} (1)`,
              ]);
            }

            if (victims.length) {
              activeReply = `**${
                player.name
              }** used **${active}** on **${victims
                .map((v) => v[0].name)
                .join(", ")}**!\n${affected
                .map((a) => a[0] + a[1])
                .join("\n")}`;
            } else {
              activeReply = `**${player.name}** used **${active}**, but didn't hit anyone.`;
            }
            break;

          case "skip":
            activeReply = `**${player.name}** doesn't have any valid moves. Skipping turn...`;
            break;
          default:
            activeReply = `**${player.name}**'s time ran out.`;
            break;
        }

        await thread.send({
          content: activeReply,
        });

        if (player.user && isFromActive)
          player.cooldowns.push([active, GetCooldown(active)]);

        if (player.thresholds["Active Ace"]) {
          player.thresholds["Active Ace"] = false;
          player.gear.active.list[active] -= 2;
        }

        FilterDeadPlayers();
      }

      await HandleActive(active, true);

      // -=+=- Handle passive gear -=+=-
      async function HandlePassives(passives) {
        DetermineSides(player);

        if (!opponents.length) return;

        for (const passive of passives) {
          if (!passive) continue;

          let passiveReply;

          affected = [];

          switch (passive) {
            case "Active Ace":
              chance = await CalculateEffect(
                [0.1],
                ScaleByLevel(player.gear.passive.list[passive], 0.1)
              );

              if (Math.random() <= chance) {
                player.thresholds["Active Ace"] = true;

                passiveReply = `**${player.name}**'s **Active Ace** activated! Active gear effect will be increased by 2 levels next turn.`;
              }
              break;
            case "Bunch of Dice":
              chance = await CalculateEffect(
                [0.25],
                ScaleByLevel(player.gear.passive.list[passive], 0.1)
              );

              if (Math.random() <= chance) {
                bunchOfDiceActivated = true;

                passiveReply = `**${player.name}**'s **Bunch of Dice** activated! Weapon gear effect will be increased by 2 levels next turn.`;
              }
              break;
            case "Explode-o-matic Trigger":
              if (player.thresholds["Explode-o-matic Trigger"] < 1) break;

              staticDamage = 0;

              while (player.thresholds["Explode-o-matic Trigger"] > 0) {
                player.thresholds["Explode-o-matic Trigger"] -= 1;

                staticDamage += await CalculateEffect(
                  [15, 15],
                  (overtime ? 2 : 1) *
                    ScaleByLevel(player.gear.passive.list[passive], 0.1)
                );
              }

              for (const victim of opponents) {
                await AddEffect(
                  player,
                  victim,
                  "Damage",
                  passive,
                  staticDamage,
                  1
                );

                affected.push([
                  AffectedText(victim),
                  ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
                ]);
              }

              passiveReply = `**${
                player.name
              }**'s **Explode-o-matic Trigger** damages **all opponents**!\n${affected
                .map((a) => a[0] + a[1])
                .join("\n")}`;
              break;
            case "R&B Mixtape":
              staticHealing = await CalculateEffect(
                [4, 6],
                (overtime ? 0.5 : 1) *
                  ScaleByLevel(player.gear.passive.list[passive], 0.1)
              );

              for (const victim of teammates) {
                await AddEffect(
                  player,
                  victim,
                  "Healing",
                  "R&B Mixtape",
                  staticHealing,
                  1
                );

                if (doneHealing) {
                  affected.push([
                    AffectedText(victim),
                    ` **+${doneHealing}** ${client.getEmoji("health")} (1)`,
                  ]);
                }
              }

              if (affected.length) {
                passiveReply = `**${
                  player.name
                }**'s **R&B Mixtape** heals **all teammates**!\n${affected
                  .map((a) => a[0] + a[1])
                  .join("\n")}`;
              }
              break;
            case "Smelly Socks":
              staticDamage = await CalculateEffect(
                [4, 6],
                (overtime ? 2 : 1) *
                  ScaleByLevel(player.gear.passive.list[passive], 0.1)
              );

              for (const victim of opponents) {
                await AddEffect(
                  player,
                  victim,
                  "Damage",
                  "Smelly Socks",
                  staticDamage,
                  1
                );

                if (dealtDamage) {
                  affected.push([
                    AffectedText(victim),
                    ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
                  ]);
                }
              }

              if (affected.length) {
                passiveReply = `**${
                  player.name
                }**'s **Smelly Socks** damages **all opponents**!\n${affected
                  .map((a) => a[0] + a[1])
                  .join("\n")}`;
              }
              break;
            case "Vampire Teeth":
              let percentage = 0.06;
              staticHealing = await CalculateEffect(
                [activeDamage * percentage, activeDamage * percentage],
                (overtime ? 0.5 : 1) *
                  ScaleByLevel(player.gear.passive.list[passive], 0.1)
              );

              await AddEffect(
                player,
                player,
                "Healing",
                "Vampire Teeth",
                staticHealing,
                1
              );

              affected.push([
                AffectedText(player),
                ` **+${doneHealing}** ${client.getEmoji("health")} (1)`,
              ]);

              if (doneHealing) {
                passiveReply = `**${
                  player.name
                }**'s **Vampire Teeth** heals **themselves**!\n${affected
                  .map((a) => a[0] + a[1])
                  .join("\n")}`;
              }
              break;
            case "Zap in a Box":
              victim = opponents[Math.floor(Math.random() * opponents.length)];

              staticDamage = await CalculateEffect(
                [6, 10],
                (overtime ? 2 : 1) *
                  ScaleByLevel(player.gear.passive.list[passive], 0.1)
              );
              await AddEffect(
                player,
                victim,
                "Damage",
                "Zap in a Box",
                staticDamage,
                1
              );

              stun = await CalculateEffect(
                [0.12],
                ScaleByLevel(player.gear.passive.list[passive], 0.05)
              );
              await AddEffect(player, victim, "Stun", "Zap in a Box", stun, 1);

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji(
                  "damage"
                )} (1), **${Math.round(stun * 100)}%** ${client.getEmoji(
                  "stun"
                )} (1)`,
              ]);

              if (dealtDamage) {
                passiveReply = `**${player.name}**'s **Zap in a Box** hits **${
                  victim.name
                }**!\n${affected.map((a) => a[0] + a[1])}`;
              }
              break;
          }

          if (passiveReply) {
            await thread.send({
              content: passiveReply,
            });
          }

          FilterDeadPlayers();
        }
      }

      if (player.user && player.gear.passive.equipped.length > 0) {
        await HandlePassives(player.gear.passive.equipped);
      }

      player.stats["Turns Taken"] += 1;

      // Portable Portal
      player.thresholds["Portable Portal"] += 1;

      // Very Long Bow
      !activeDamage
        ? (player.thresholds["Very Long Bow"] += 1)
        : (player.thresholds["Very Long Bow"] = 0);

      // Techno Fists
      if (hitEnemies.length > 3) player.thresholds["Techno Fists"] += 1;

      // -=+=- Handle weapon gear -=+=-
      async function HandleWeapon(weapon) {
        DetermineSides(player);

        if (!opponents.length) return;

        let weaponReply;

        affected = [];

        if (player.thresholds["Bunch of Dice"]) {
          player.gear.weapon.list[weapon] += 2;
        }

        switch (weapon) {
          case "Chicken Stick":
            if (player.thresholds["Chicken Stick"] < 1 || allies.length >= 6)
              break;

            let chickens = 0;
            for (
              let i = 0;
              i < player.thresholds["Chicken Stick"] && allies.length < 6;
              i++
            ) {
              player.thresholds["Chicken Stick"] -= 1;
              chickens++;

              await PushMonster("Chicken", 1, currentTime, player);
            }

            weaponReply = `**${
              player.name
            }**'s **Chicken Stick** has reached its activation threshold! **${chickens} ${
              chickens > 1 ? "Chickens** have" : "Chicken** has"
            } been spawned.`;
            break;
          case "Medicine Ball":
            if (player.thresholds["Medicine Ball"] < 250) break;

            player.thresholds["Medicine Ball"] -= 250;

            for (const victim of teammates) {
              staticHealing = await CalculateEffect(
                [15, 15],
                (overtime ? 0.5 : 1) *
                  ScaleByLevel(player.gear.weapon.list[weapon], 0.1)
              );
              await AddEffect(
                player,
                victim,
                "Healing",
                weapon,
                staticHealing,
                1
              );

              await AddEffect(player, victim, "Cleanse", weapon, 1, 3);

              if (doneHealing) {
                affected.push([
                  AffectedText(victim),
                  ` **+${doneHealing}** ${client.getEmoji("health")} (1)`,
                  `, 🧹 (3)`,
                ]);
              } else {
                affected.push([AffectedText(victim), ` 🧹 (3)`]);
              }
            }

            weaponReply = `**${
              player.name
            }**'s **Medicine Ball** has reached its activation threshold!\n${affected
              .map((a) => a[0] + a[1] + a[2])
              .join("\n")}`;
            break;
          case "Monster Slugger":
            if (player.thresholds["Monster Slugger"] < 12) break;

            player.thresholds["Monster Slugger"] -= 12;

            for (const victim of opponents) {
              if (victim.hitPoints >= Math.round(victim.maxHitPoints * 0.33)) {
                stun = await CalculateEffect(
                  [1],
                  ScaleByLevel(player.gear.weapon.list[weapon], 0.05)
                );
                await AddEffect(player, victim, "Stun", weapon, stun, 1);

                speed = await CalculateEffect(
                  [-0.22],
                  ScaleByLevel(player.gear.weapon.list[weapon], 0.05)
                );
                await AddEffect(player, victim, "Speed", weapon, speed, 3);

                affected.push([
                  AffectedText(victim),
                  ` **${Math.round(stun * 100)}%** ${client.getEmoji(
                    "stun"
                  )} (1)`,
                  `, **${speed.toFixed(2)}** ${client.getEmoji("speed")} (3)`,
                ]);
              }
            }

            weaponReply = `**${
              player.name
            }**'s **Monster Slugger** has reached its activation threshold!\n${
              affected.length
                ? affected.map((a) => a[0] + a[1] + a[2]).join("\n")
                : ` Sadly, no opponents are above 33% HP.`
            }`;
            break;
          case "Portable Portal":
            const requiredTurns =
              GetCooldown(player.gear.active.equipped[0]) + 2;
            if (player.thresholds["Portable Portal"] < requiredTurns) break;

            player.thresholds["Portable Portal"] -= requiredTurns;

            weaponReply = `**${player.name}**'s **Portable Portal** has reached its activation threshold!`;

            const equippedOn1 = player.gear.active.equipped[0];
            const temp = player.gear.active.list[equippedOn1];
            player.gear.active.list[equippedOn1] =
              player.gear.weapon.list[weapon] - 2;

            setTimeout(async () => {
              await HandleActive(equippedOn1, false);

              player.gear.active.list[equippedOn1] = temp;
            }, 50);
            break;
          case "Spinsickle":
            const found = player.thresholds["Spinsickle"].find(
              (item) => item[1] == 3
            );

            if (!found) break;

            player.thresholds["Spinsickle"] = [];

            speed = await CalculateEffect(
              [0.8],
              ScaleByLevel(player.gear.weapon.list[weapon], 0.05)
            );
            await AddEffect(player, player, "Speed", weapon, speed, 100);

            affected.push([
              AffectedText(player),
              ` **+${speed.toFixed(2)}** ${client.getEmoji("speed")} (∞)`,
            ]);

            weaponReply = `**${
              player.name
            }**'s **Spinsickle** has reached its activation threshold!\n${affected.map(
              (a) => a[0] + a[1]
            )}`;
            break;
          case "Techno Fists":
            if (player.thresholds["Techno Fists"] < 6) break;

            player.thresholds["Techno Fists"] -= 6;

            victims = [];
            for (let i = 0; i < Math.min(opponents.length, 2); i++) {
              let victim;

              do {
                victim =
                  opponents[Math.floor(Math.random() * opponents.length)];
              } while (victims.includes(victim));

              victims.push(victim);

              staticDamage = await CalculateEffect(
                [30, 30],
                (overtime ? 2 : 1) *
                  ScaleByLevel(player.gear.weapon.list[weapon], 0.1)
              );
              await AddEffect(
                player,
                victim,
                "Damage",
                weapon,
                staticDamage,
                1
              );

              stun = await CalculateEffect(
                [1.2],
                ScaleByLevel(player.gear.weapon.list[weapon], 0.05)
              );
              await AddEffect(player, victim, "Stun", weapon, stun, 1);

              affected.push([
                AffectedText(victim),
                ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
                `, **${Math.round(stun * 100)}%** ${client.getEmoji(
                  "stun"
                )} (1)`,
              ]);
            }

            weaponReply = `**${
              player.name
            }**'s **Techno Fists** has reached its activation threshold!\n${affected
              .map((a) => a[0] + a[1] + a[2])
              .join("\n")}`;
            break;
          case "Very Long Bow":
            if (player.thresholds["Very Long Bow"] < 3) break;

            player.thresholds["Very Long Bow"] = 0;

            victims = [];
            for (let i = 0; i < Math.min(opponents.length, 3); i++) {
              let victim;

              do {
                victim =
                  opponents[Math.floor(Math.random() * opponents.length)];
              } while (victims.includes(victim));

              victims.push(victim);

              staticDoT = await CalculateEffect(
                [15, 15],
                (overtime ? 2 : 1) *
                  ScaleByLevel(player.gear.weapon.list[weapon], 0.1)
              );

              await AddEffect(player, victim, "Damage", weapon, staticDoT, 3);

              affected.push([
                AffectedText(victim),
                ` **-${realDamage}** ${client.getEmoji("damage")} (3)`,
              ]);
            }

            weaponReply = `**${
              player.name
            }**'s **Very Long Bow** has reached its activation threshold!\n${affected
              .map((a) => a[0] + a[1])
              .join("\n")}`;
            break;
          case "Wolf Stick":
            if (player.thresholds["Wolf Stick"] < 200 || allies.length >= 6)
              break;

            let wolves = 0;
            while (
              player.thresholds["Wolf Stick"] >= 200 &&
              allies.length < 6
            ) {
              player.thresholds["Wolf Stick"] -= 200;
              wolves++;

              await PushMonster("Wolf", 1, currentTime, player);
            }

            weaponReply = `**${
              player.name
            }**'s **Wolf Stick** has reached its activation threshold! **${wolves} ${
              wolves > 1 ? "Wolves** have" : "Wolf** has"
            } been spawned.`;
            break;
        }

        if (weaponReply) {
          await thread.send({
            content: weaponReply,
          });
        }

        if (player.thresholds["Bunch of Dice"]) {
          player.thresholds["Bunch of Dice"] = false;
          player.gear.weapon.list[weapon] -= 2;
        }

        FilterDeadPlayers();
      }

      // Weapon gear
      if (player.user) {
        await HandleWeapon(player.gear.weapon.equipped[0]);
      }

      if (bunchOfDiceActivated) player.thresholds["Bunch of Dice"] = true;

      // -=+=- Handle thresholds -=+=-
      async function HandleThresholds(player) {
        DetermineSides(player);

        affected = [];

        switch (player.name) {
          case "Alarm Bell":
            if (player.thresholds.hit) {
              player.thresholds.hit = false;

              if (teammates.length < 6) {
                const standard =
                  monsterArray.standard[
                    Math.floor(Math.random() * monsterArray.standard.length)
                  ];
                await PushMonster(standard, 2, currentTime, player);

                await thread.send({
                  content: `**${player.name}** got hit! It spawned **1 ${standard}**.`,
                });
              } else {
                await thread.send({
                  content: `**${player.name}** got hit, but there are no empty spots.`,
                });
              }
            }
            break;
          case "Big Papa":
            for (const hp_x of Object.keys(player.thresholds).filter((key) =>
              key.startsWith("hp")
            )) {
              const threshold = player.thresholds[hp_x];

              if (player.hitPoints < threshold * player.maxHitPoints) {
                player.thresholds[hp_x] = -1;

                let eggs = 0;
                for (let i = 0; i < 6 - teammates.length && i < 2; i++) {
                  eggs++;

                  await PushMonster("Scorcher Egg", 2, currentTime, player);
                }

                await thread.send({
                  content: `**${player.name}**'s HP is below **${Math.round(
                    threshold * 100
                  )}%**! **${eggs} Scorcher Egg${
                    eggs == 1 ? `** has` : `s** have`
                  } been spawned.`,
                });
              }
            }
            break;
          case "Berserker":
            const threshold = player.thresholds.hp_1;

            if (player.hitPoints < threshold * player.maxHitPoints) {
              player.thresholds.hp_1 = -1;

              damageIncrease =
                1 +
                (await CalculateEffect(
                  [0.5],
                  ScaleByLevel(player.level, 0.01)
                ));
              await AddEffect(
                player,
                player,
                "DamageIncrease",
                `Threshold:hp_1`,
                damageIncrease,
                100
              );

              speed = await CalculateEffect(
                [0.24],
                ScaleByLevel(player.level, 0.01)
              );
              await AddEffect(
                player,
                player,
                "Speed",
                `Threshold:hp_1`,
                speed,
                100
              );

              affected.push([
                AffectedText(player),
                ` **${Math.round(
                  (damageIncrease - 1) * 100
                )}%** ${client.getEmoji("damage_increase")} (∞)`,
                `, **+${speed.toFixed(2)}** ${client.getEmoji("speed")} (∞)`,
              ]);

              await thread.send({
                content: `**${player.name}**'s HP is below **${Math.round(
                  threshold * 100
                )}%**! They have become enraged.\n${affected.map(
                  (a) => a[0] + a[1] + a[2]
                )}`,
              });
            }
            break;
          case "Overlord":
            for (const hp_x of Object.keys(player.thresholds).filter((key) =>
              key.startsWith("hp")
            )) {
              const threshold = player.thresholds[hp_x];

              if (player.hitPoints < threshold * player.maxHitPoints) {
                player.thresholds[hp_x] = -1;

                let spawned = [];

                if (teammates.length < 6) {
                  if (hp_x == "hp_1") {
                    await PushMonster("Heavy Spitter", 2, currentTime, player);

                    spawned.push("Heavy Spitter");
                  }
                  if (hp_x == "hp_2") {
                    await PushMonster("Knight", 2, currentTime, player);

                    spawned.push("Knight");
                  }
                }

                let content = `**${player.name}**'s HP is below **${Math.round(
                  threshold * 100
                )}%**!`;

                if (spawned.length) {
                  content += ` **1 ${spawned[0]}** has been spawned.`;
                } else {
                  content += ` Monsters couldn't spawn, since there are no empty spots.`;
                }

                await thread.send({ content: content });
              }
            }
            break;
          case "Boomer":
            if (player.hitPoints == player.thresholds.hp_1) {
              player.thresholds.hp_1 = -1;

              staticDamage = await CalculateEffect(
                [20, 20],
                (overtime ? 2 : 1) * ScaleByLevel(player.level, 0.02)
              );

              for (const victim of opponents) {
                await AddEffect(
                  player,
                  victim,
                  "Damage",
                  `Threshold:dead`,
                  staticDamage,
                  1
                );

                affected.push([
                  AffectedText(victim),
                  ` **-${dealtDamage}** ${client.getEmoji("damage")} (1)`,
                ]);
              }

              await thread.send({
                content: `**${player.name}** exploded!\n${affected
                  .map((a) => a[0] + a[1])
                  .join("\n")}`,
              });
            }
            break;
        }

        FilterDeadPlayers();
      }

      for (const player of allEnemies) {
        await HandleThresholds(player);
      }

      await wait(overtime ? 1.5 * 1000 : 3 * 1000);

      // -=+=- Post-actions -=+=-
      player.next = FixedFloat(player.next + player.interval);

      // Handle effects that weren't already handled this turn
      for (const effect of player.activeEffects
        .filter((e) => !e.initial)
        .sort((a, b) => {
          return a.duration - b.duration;
        })) {
        await HandleEffect(
          allPlayers.find((p) => p.id == effect.by),
          player,
          effect
        );
      }

      for (const effect of player.activeEffects.filter((e) => e.initial)) {
        effect.initial = false;
      }

      // DoT
      FilterDeadPlayers();

      // Check if any team has won
      if (!enemies.length || !allies.length) {
        gameEnded = true;
        winners = !enemies.length
          ? allAllies.map((player) => player.name).join(", ")
          : allEnemies.map((player) => player.name).join(", ");
        await thread.send(`Battle ended! Winners: **${winners}**`);
      }
    }

    // -=+=- Turn preparation -=+=-
    while (!gameEnded) {
      // Sort queue
      players.sort((a, b) => {
        if (a.next == b.next) return a.index - b.index;
        return a.next - b.next;
      });

      // 'Move' queue
      players.forEach((player) => {
        if (player.index == 0) {
          player.index = players.length - 1;
        } else {
          player.index--;
        }
      });

      const currentPlayer = players[0];
      currentTime = currentPlayer.next;

      // Handle overtime
      if (!overtime && currentTime >= maxTime) {
        overtime = true;

        for (i = 0; i < 3; i++) {
          await thread.send({
            content: `⏰ **__OVERTIME! x2 damage & x0.5 healing__** ⏰`,
          });
        }
      }

      await HandleTurn(currentPlayer);
    }

    // -=+=- Loot drops -=+=-
    for (const ally of allAllies.filter((p) => p.user)) {
      let loot = [];
      let mocoins = 0;
      let experience = 0;
      let blueprint = "";

      if (enemies.length == 0) {
        let chance = 50;
        for (const enemy of allEnemies) {
          if (enemy.tier == "Standard") chance -= 1;
          if (enemy.tier == "Elite") chance -= 4;
          if (enemy.tier == "Boss") chance -= 10;
        }
        chance = Math.max(chance, 10);

        function FilterGear(list) {
          return Object.keys(list).filter((gear) => list[gear] > 0);
        }

        // Determine blueprint
        if (Math.ceil(Math.random() * chance) == 1) {
          const unlocked = [
            ...["active", "passive", "weapon"].flatMap((type) =>
              FilterGear(ally.gear[type].list)
            ),
            ...ally.profile.inventory.blueprints,
          ];

          const filteredGear = gearArray.all.filter(
            (item) => !unlocked.includes(item)
          );

          blueprint =
            filteredGear[Math.floor(Math.random() * filteredGear.length)];
        }
      }

      for (const enemy of allEnemies) {
        if (enemy.hitPoints == 0 && enemy.name != "Scorcher Egg") {
          const emoji = client.getEmoji(enemy.drop.name);
          const levelMultiplier = 0.98 + 0.02 * enemy.level;

          const dropAmount = enemy.drop.amount * levelMultiplier;
          const totalDrops =
            Math.floor(dropAmount) + (Math.random() < dropAmount % 1 ? 1 : 0);

          const [minMocoins, maxMocoins] = enemy.drop.mocoins;
          mocoins += Math.round(
            (Math.random() * (maxMocoins - minMocoins) + minMocoins) *
              levelMultiplier
          );

          const [minExperience, maxExperience] = enemy.drop.experience;
          experience += Math.round(
            (Math.random() * (maxExperience - minExperience) + minExperience) *
              levelMultiplier
          );

          if (totalDrops > 0) {
            const existingItem = loot.find(
              (item) => item.name === enemy.drop.name
            );

            if (existingItem) {
              existingItem.amount += totalDrops;
            } else {
              loot.push({
                name: enemy.drop.name,
                amount: totalDrops,
                emoji: emoji,
              });
            }
          }
        }
      }

      if (blueprint) ally.profile.inventory.blueprints.push(blueprint);
      if (loot.length > 0) {
        loot.forEach((item) => {
          ally.profile.inventory.monsterDrops[item.name] =
            (ally.profile.inventory.monsterDrops[item.name] || 0) + item.amount;
        });
      }
      if (mocoins) ally.profile.inventory["mocoins"] += mocoins;
      if (experience) ally.profile.experience += experience;

      if (blueprint || loot.length || mocoins || experience) {
        await ally.profile.save();
        await ally.profile.inventory.save();

        const embed = new EmbedBuilder()
          .setTitle(`**${ally.name}**'s loot`)
          .setColor("Yellow");

        const fields = [];
        if (blueprint) {
          fields.push({
            name: `Blueprint`,
            value: `${client.getEmoji("blueprint")} ${blueprint}`,
          });
        }
        if (loot.length > 0) {
          fields.push({
            name: `Monster drops`,
            value: loot
              .map((item) => `${item.emoji} ${item.name} **+${item.amount}**`)
              .join("\n"),
          });
        }
        if (mocoins) {
          fields.push({
            name: `mo.coins`,
            value: `${client.getEmoji("mocoin")} **+${mocoins}**`,
          });
        }
        if (experience) {
          fields.push({
            name: `Experience`,
            value: `${client.getEmoji("experience")} **+${experience}**`,
          });
        }

        embed.addFields(fields);
        await thread.send({ content: `${ally.user}`, embeds: [embed] });
      }
    }

    // -=+=- Post-battle -=+=-
    const winnerEmbed = new EmbedBuilder()
      .setTitle(`Battle over!`)
      .setDescription(`Winners: **${winners}**`)
      .addFields([
        {
          name: "-=+=- Hunters -=+=-",
          value: MapPlayers(
            allAllies
              .sort((a, b) => {
                return b.hitPoints - a.hitPoints;
              })
              .slice(0, 6)
          ),
        },
        {
          name: "-=+=- Monsters -=+=-",
          value: MapPlayers(
            allEnemies
              .sort((a, b) => {
                return b.hitPoints - a.hitPoints;
              })
              .slice(0, 6)
          ),
        },
      ])
      .setColor(overtime ? "Red" : "Green")
      .setTimestamp();

    await interaction.editReply({ content: "", embeds: [winnerEmbed] });

    // Reset allies
    if (true) {
      for (const ally of allAllies.filter((p) => p.user)) {
        ally.profile.isBusy = false;
        await ally.profile.save();

        if (authorProfile.party && !ally.profile.settings["Always Ready"]) {
          authorProfile.party.members.find(
            (member) =>
              member.profile._id.toString() == ally.profile._id.toString()
          ).ready = false;
          await authorProfile.party.save();
        }
      }
    }

    // Quests
    for (const player of allPlayers.filter((p) => p.user)) {
      await client.handleQuests(interaction, player.profile, {
        player: player,
        allies: allAllies,
        enemies: allEnemies,
      });
    }

    await wait(60 * 1000);
    try {
      await thread.delete();
    } catch (err) {}
  };
};
