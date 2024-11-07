module.exports = (client) => {
  client.getEmoji = (name) => {
    const emojiMap = {
      // Stats
      level: "<:level:1302976265287893105>",
      health: "<:health:1299666808462245991>",
      experience: "<:experience:1299667414715465798>",
      speed: "<:speed:1302976184128241666>",

      // Battle emoji
      damage: "<:damage:1299738719838015498>",
      damage_increase: "<:damage_increase:1302751023617675294>",
      damage_reduction: "<:damage_reduction:1302751039845564479>",
      stun: "<:stun:1302751065455726704>",
      player_dead: "<:player_dead:1302735448334008361>",
      monster_dead: "<:monster_dead:1302987515514454066>",
      effects: "<:effects:1302740547689250847>",

      easy: "<:easy:1303330477633179648>",
      medium: "<:medium:1303327319255158866>",
      hard: "<:hard:1303327334539202581>",

      // Currencies
      mocoin: "<:mocoin:1299670470815387700>",
      chaos_cube: "<:chaos_cube:1299670504939978763>",

      small_crate: "<:small_crate:1303328963376189441>",
      medium_crate: "<:medium_crate:1303328990731436032>",
      large_crate: "<:large_crate:1303329009882628137>",

      // Guilds
      guild: "<:guild:1299670550666547251>",
      leader: "<:leader:1299744451807416410>",
      member: "<:member:1299744502482993304>",

      // Quests
      objective: "<:objective:1302970671688847361>",
      reward: "<:reward:1302976053853159516>",

      // Active gear
      boombox: "<:boombox:1299658498719748096>",
      life_jacket: "<:life_jacket:1299658524565045270>",
      monster_taser: "<:monster_taser:1299658547172478976>",
      really_cool_sticker: "<:really_cool_sticker:1299658591804063744>",
      shelldon: "<:shelldon:1299658612729188362>",
      smart_fireworks: "<:smart_fireworks:1299658640923562004>",
      snow_globe: "<:snow_globe:1299658678210658416>",
      turbo_pills: "<:turbo_pills:1299658707369463828>",
      water_balloon: "<:water_balloon:1299658723836301333>",

      // Passive gear
      active_ace: "<:active_ace:1300029874714443786>",
      bunch_of_dice: "<:bunch_of_dice:1300029899595186176>",
      explode_o_matic_trigger: "<:explode_o_matic_trigger:1300029921401503786>",
      r_b_mixtape: "<:r_b_mixtape:1300029968851537970>",
      smelly_socks: "<:smelly_socks:1300030131749785632>",
      vampire_teeth: "<:vampire_teeth:1300030199483863050>",
      zap_in_a_box: "<:zap_in_a_box:1300030219159076885>",

      // Weapon gear
      chicken_stick: "<:chicken_stick:1300026263360241674>",
      medicine_ball: "<:medicine_ball:1300026309916889109>",
      monster_slugger: "<:monster_slugger:1300026330401865799>",
      portable_portal: "<:portable_portal:1300026360827215927>",
      spinsickle: "<:spinsickle:1300026394591629322>",
      techno_fists: "<:techno_fists:1300026425994252299>",
      very_long_bow: "<:very_long_bow:1300026484802715679>",
      wolf_stick: "<:wolf_stick:1300026503358316596>",

      // Upgrade materials
      blueprint: "<:blueprint:1299660067402158090>",

      berserker_fist: "<:berserker_fist:1274652176232349696>",
      bone_smasher_codpiece: "<:bone_smasher_codpiece:1274652216149544983>",
      boomer_tail: "<:boomer_tail:1274653882072694814>",
      bronze_bell: "<:bronze_bell:1274652235795660820>",
      charger_horn: "<:charger_horn:1274652268821741568>",
      executioner_axe: "<:executioner_axe:1274652282948161579>",
      heavy_spitter_helmet: "<:heavy_spitter_helmet:1274652300639604758>",
      juggler_jewel: "<:juggler_jewel:1274652644983570477>",
      jumper_wing: "<:jumper_wing:1274652318738022509>",
      knight_shoulderplate: "<:knight_shoulderplate:1274652342716993596>",
      lil_beetle_wing: "<:lil_beetle_wing:1274652367534686239>",
      lil_monster_scale: "<:lil_monster_scale:1274652392654110754>",
      overlord_hood: "<:overlord_hood:1274652432126840894>",
      papa_tooth: "<:papa_tooth:1274652456013533255>",
      scorcher_fang: "<:scorcher_fang:1274654463247777802>",
      scrappy_scrap: "<:scrappy_scrap:1274654820590030890>",
      slasher_blade: "<:slasher_blade:1274652493279662141>",
      toxic_seed: "<:toxic_seed:1274652529271111776>",

      // Quests
      quest: "<:quest:1299669088020463657>",
    };

    if (!name) return "⚠️";
    return emojiMap[name.replace(/[ &-]/g, "_").toLowerCase()] || "⚠️";
  };
};
