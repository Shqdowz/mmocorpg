// -=+=- Dependencies -=+=-
const { Schema, model } = require("mongoose");

const questSchema = new Schema(
  {
    name: String,
    description: String,
    level: Number,
    difficulty: String,
    progress: { type: Number, default: 0 },
    goal: Number,
    completed: { type: Boolean, default: false },
    scale: Number,

    commands: [String],
  },
  { versionKey: false }
);

module.exports = model("Quest", questSchema, "quests");
