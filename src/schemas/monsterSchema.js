const { Schema, model } = require("mongoose");

const monsterSchema = new Schema({
  name: String,
  tier: String,

  level: { type: Number, default: 1 },
  hitPoints: Number,
  maxHitPoints: Number,
  speed: Number,

  thresholds: Object,

  skills: [Array],

  drop: {
    name: String,
    amount: Number,

    mocoins: [Number],
    experience: [Number],
  },
});

module.exports = model("Monster", monsterSchema, "monsters");
