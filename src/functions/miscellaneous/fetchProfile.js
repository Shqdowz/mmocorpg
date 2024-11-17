// -=+=- Schemas -=+=-
const User = require("../../schemas/userSchema");

module.exports = (client) => {
  client.fetchProfile = async (id) => {
    const userProfile = await User.findOne({ userId: id });

    await userProfile.populate("achievement");
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
