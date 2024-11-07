const { Schema, model } = require("mongoose");

const guildSchema = new Schema({
  _id: Schema.Types.ObjectId,
  name: { type: String, required: true, unique: true },
  description: String,

  lowerCaseName: { type: String, required: true, unique: true },

  leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],

  settings: {
    isOpen: { type: Boolean, default: true },
    joinRequestApproval: { type: Boolean, default: false },
  },
  joinRequests: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      username: String,
    },
  ],
});

module.exports = model("Guild", guildSchema, "guilds");
