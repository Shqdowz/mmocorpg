// -=+=- Dependencies -=+=-
const { Schema, model } = require("mongoose");

const achievementSchema = new Schema({
  _id: Schema.Types.ObjectId,

  total: { type: Number, default: 0 },

  "Battle Master": {
    description: { type: String, default: "Win battles" },
    tier: { type: Number, default: 1 },
    progress: { type: Number, default: 0 },
    goal: { type: Number, default: 100 },
    commands: ["battle"],
  },
});

module.exports = model("Achievement", achievementSchema, "achievements");
