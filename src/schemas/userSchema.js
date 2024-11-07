const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  username: String,

  ban: Date,
  blacklist: { type: Boolean, default: false },

  level: { type: Number, default: 1, max: 100 },
  experience: { type: Number, default: 0 },
  requiredExperience: { type: Number, default: 20 },

  hitPoints: { type: Number, default: 100, min: 0, max: 500 },
  maxHitPoints: { type: Number, default: 100 },
  speed: { type: Number, default: 1.0, min: 0.33, max: 5.0 },

  statPoints: { type: Number, default: 0 },

  loadouts: {
    type: [Object],
    default: [
      {
        equipped: true,
        gear: [
          "Monster Slugger",
          "Water Balloon",
          "Smart Fireworks",
          "Monster Taser",
          null,
          null,
          null,
        ],
      },
      {
        equipped: false,
        gear: [
          "Monster Slugger",
          "Water Balloon",
          "Smart Fireworks",
          "Monster Taser",
          null,
          null,
          null,
        ],
      },
      {
        equipped: false,
        gear: [
          "Monster Slugger",
          "Water Balloon",
          "Smart Fireworks",
          "Monster Taser",
          null,
          null,
          null,
        ],
      },
    ],
  },

  gear: {
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
  },

  inventory: {
    type: Schema.Types.ObjectId,
    ref: "Inventory",
  },

  party: { type: Schema.Types.ObjectId, ref: "Party" },

  quests: { type: Array, default: [] },

  cat: {
    type: Schema.Types.ObjectId,
    ref: "Cat",
  },

  guild: { type: Schema.Types.ObjectId, ref: "Guild" },
  pendingJoinRequest: { type: Schema.Types.ObjectId, ref: "Guild" },

  cooldowns: {
    global: Date,

    daily: Date,
    quests: Date,

    pet: Date,
  },

  isBusy: { type: Boolean, default: false },

  dailyStreak: { type: Number, default: 0 },

  settings: {
    alwaysReady: { type: Boolean, default: false },
  },
});

module.exports = model("User", userSchema, "users");
