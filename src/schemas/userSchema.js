// -=+=- Dependencies -=+=-
const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  // Unique data
  _id: Schema.Types.ObjectId,
  userId: String,
  username: String,

  // Limitations
  ban: Date,
  blacklist: { type: Boolean, default: false },

  // Stats
  level: { type: Number, default: 1, max: 100 },
  experience: { type: Number, default: 0 },
  requiredExperience: { type: Number, default: 20 },
  statPoints: { type: Number, default: 0 },

  hitpoints: { type: Number, default: 100, min: 0, max: 500 },
  speed: { type: Number, default: 1.0, min: 0.33, max: 5.0 },

  isBusy: { type: Boolean, default: false },
  dailyStreak: { type: Number, default: 0 },

  // Schemas
  achievement: { type: Schema.Types.ObjectId, ref: "Achievement" },
  cat: {
    type: Schema.Types.ObjectId,
    ref: "Cat",
  },
  gear: { type: Schema.Types.ObjectId, ref: "Gear" },
  guild: { type: Schema.Types.ObjectId, ref: "Guild" },
  inventory: {
    type: Schema.Types.ObjectId,
    ref: "Inventory",
  },
  loadout: {
    type: Schema.Types.ObjectId,
    ref: "Loadout",
  },
  party: { type: Schema.Types.ObjectId, ref: "Party" },

  // Misc
  cooldowns: {
    global: Date,
    daily: Date,
    quests: Date,
    pet: Date,
  },

  settings: {
    "Always Ready": { type: Boolean, default: false },
  },

  quests: { type: Array, default: [] },

  pendingJoinRequest: { type: Schema.Types.ObjectId, ref: "Guild" }, // remove?
});

module.exports = model("User", userSchema, "users");
