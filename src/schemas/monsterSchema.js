// -=+=- Dependencies -=+=-
const { Schema, model } = require("mongoose");

const monsterSchema = new Schema(
  {
    name: String,
    tier: String,

    level: { type: Number, default: 1 },
    hitpoints: Number,
    speed: Number,

    thresholds: Object,

    skills: [Array],

    drop: String,
  },
  { versionKey: false }
);

module.exports = model("Monster", monsterSchema, "monsters");
