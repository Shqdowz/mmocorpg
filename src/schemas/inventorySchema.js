// -=+=- Dependencies -=+=-
const { Schema, model } = require("mongoose");

const inventorySchema = new Schema({
  _id: Schema.Types.ObjectId,

  mocoins: { type: Number, default: 0 },
  "Chaos Cubes": { type: Number, default: 0 },

  monsterDrops: {
    "Berserker Fist": { type: Number, default: 0 },
    "Bone Smasher Codpiece": { type: Number, default: 0 },
    "Boomer Tail": { type: Number, default: 0 },
    "Bronze Bell": { type: Number, default: 0 },
    "Charger Horn": { type: Number, default: 0 },
    "Executioner Axe": { type: Number, default: 0 },
    "Heavy Spitter Helmet": { type: Number, default: 0 },
    "Juggler Jewel": { type: Number, default: 0 },
    "Jumper Wing": { type: Number, default: 0 },
    "Knight Shoulderplate": { type: Number, default: 0 },
    "Lil Beetle Wing": { type: Number, default: 0 },
    "Lil Monster Scale": { type: Number, default: 0 },
    "Overlord Hood": { type: Number, default: 0 },
    "Papa Tooth": { type: Number, default: 0 },
    "Scorcher Fang": { type: Number, default: 0 },
    "Scrappy Scrap": { type: Number, default: 0 },
    "Slasher Blade": { type: Number, default: 0 },
    "Toxic Seed": { type: Number, default: 0 },

    "Champion Essence": { type: Number, default: 0 },
  },

  blueprints: {
    type: Array,
    default: [],
  },

  crates: {
    small: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    large: { type: Number, default: 0 },
  },

  medicine: { type: Number, default: 0 },
  treat: { type: Number, default: 0 },
  toy: { type: Number, default: 0 },
});

module.exports = model("Inventory", inventorySchema, "inventories");
