const { Schema, model } = require("mongoose");

const loadoutSchema = new Schema({
  _id: Schema.Types.ObjectId,

  list: {
    type: [Object],
    default: [
      {
        equipped: true,
        gear: {
          weapon: ["Monster Slugger"],
          active: ["Water Balloon", "Smart Fireworks", "Monster Taser", null],
          passive: [null, null],
        },
      },
      {
        equipped: false,
        gear: {
          weapon: ["Monster Slugger"],
          active: ["Water Balloon", "Smart Fireworks", "Monster Taser", null],
          passive: [null, null],
        },
      },
      {
        equipped: false,
        gear: {
          weapon: ["Monster Slugger"],
          active: ["Water Balloon", "Smart Fireworks", "Monster Taser", null],
          passive: [null, null],
        },
      },
    ],
  },
});

module.exports = model("Loadout", loadoutSchema, "loadouts");
