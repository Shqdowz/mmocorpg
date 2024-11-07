const { Schema, model } = require("mongoose");

const partySchema = new Schema({
  _id: Schema.Types.ObjectId,

  leader: { type: Schema.Types.ObjectId, ref: "User" },
  members: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      ready: { type: Boolean, default: false },
    },
  ],
});

module.exports = model("Party", partySchema, "parties");
