// -=+=- Dependencies -=+=-
const { Schema, model } = require("mongoose");

const catSchema = new Schema({
  _id: Schema.Types.ObjectId,
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  previousDecay: Date,

  name: {
    type: String,
    default: "the cat",
    required: true,
  },

  health: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  hunger: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  happiness: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },

  friendshipLevel: { type: Number, default: 1, max: 50 },
  friendshipExperience: { type: Number, default: 0 },
  friendshipRequiredExperience: { type: Number, default: 10 },
  growthStage: { type: String, default: "kitten" },
});

module.exports = model("Cat", catSchema, "cats");
