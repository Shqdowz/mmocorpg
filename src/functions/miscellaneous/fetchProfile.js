// -=+=- Dependencies -=+=-
const mongoose = require("mongoose");

// -=+=- Schemas -=+=-
const Achievement = require("../../schemas/achievementSchema");
const Gear = require("../../schemas/gearSchema");
const Inventory = require("../../schemas/inventorySchema");
const Loadout = require("../../schemas/loadoutSchema");
const User = require("../../schemas/userSchema");

module.exports = (client) => {
  client.fetchProfile = async (id) => {
    let userProfile = await User.findOne({ userId: id });

    if (!userProfile) {
      const achievement = new Achievement({
        _id: new mongoose.Types.ObjectId(),
      });
      await achievement.save();

      const gear = new Gear({
        _id: new mongoose.Types.ObjectId(),
      });
      await gear.save();

      const inventory = new Inventory({
        _id: new mongoose.Types.ObjectId(),
      });
      await inventory.save();

      const loadout = new Loadout({
        _id: new mongoose.Types.ObjectId(),
      });
      await loadout.save();

      userProfile = new User({
        _id: new mongoose.Types.ObjectId(),
        userId: id,
        username: await client.users.fetch(id).username,

        achievement: achievement._id,
        gear: gear._id,
        inventory: inventory._id,
        loadout: loadout._id,
      });
      await userProfile.save();
    }

    await userProfile.populate("achievement");
    await userProfile.populate("gear");
    await userProfile.populate("inventory");
    await userProfile.populate("loadout");

    if (userProfile.cat) {
      await userProfile.populate("cat");
    }
    if (userProfile.guild) {
      await userProfile.populate("guild");
      await userProfile.guild.populate("leader");
      await userProfile.guild.populate("members");
    }
    if (userProfile.party) {
      await userProfile.populate("party");
      await userProfile.party.populate("leader");
      await userProfile.party.populate("members.profile");
    }

    return userProfile;
  };
};
