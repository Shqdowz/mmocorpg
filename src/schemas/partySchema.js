// -=+=- Dependencies -=+=-
const { Schema, model } = require("mongoose");

const partySchema = new Schema({
  _id: Schema.Types.ObjectId,

  leader: { type: Schema.Types.ObjectId, ref: "User" },
  members: [
    {
      _id: false,
      profile: { type: Schema.Types.ObjectId, ref: "User" },
      ready: { type: Boolean, default: false },
    },
  ],
});

module.exports = model("Party", partySchema, "parties");
