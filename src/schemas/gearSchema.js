// -=+=- Dependencies -=+=-
const { Schema, model } = require("mongoose");

const gearSchema = new Schema({
  _id: Schema.Types.ObjectId,

  active: {
    type: Object,
    default: {
      Boombox: 0,
      "Life Jacket": 0,
      "Monster Taser": 1,
      "Really Cool Sticker": 0,
      Shelldon: 0,
      "Smart Fireworks": 1,
      "Snow Globe": 0,
      "Turbo Pills": 0,
      "Water Balloon": 1,
    },
  },
  passive: {
    type: Object,
    default: {
      "Active Ace": 0,
      "Bunch of Dice": 0,
      "Explode-o-matic Trigger": 0,
      "R&B Mixtape": 0,
      "Smelly Socks": 0,
      "Vampire Teeth": 0,
      "Zap in a Box": 0,
    },
  },
  weapon: {
    type: Object,
    default: {
      "Chicken Stick": 0,
      "Medicine Ball": 0,
      "Monster Slugger": 1,
      "Portable Portal": 0,
      Spinsickle: 0,
      "Techno Fists": 0,
      "Very Long Bow": 0,
      "Wolf Stick": 0,
    },
  },
});

module.exports = model("Gear", gearSchema, "gear");
