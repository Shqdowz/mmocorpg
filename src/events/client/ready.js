// -=+=- Schemas -=+=-
const User = require("../../schemas/userSchema");

module.exports = {
  name: "ready",
  once: true,

  async execute(client) {
    console.log(`[CLIENT] ${client.user.tag} is online.`);

    setInterval(client.pickPresence, 60 * 1000);

    // Reset busy users
    const busyUsers = await User.find({ isBusy: true });
    for (const user of busyUsers) {
      user.isBusy = false;
      user.hitPoints = user.maxHitPoints;
      await user.save();
    }

    // Delete all threads
    const guild = await client.guilds.fetch("1250387871517638708");
    const channel = await guild.channels.fetch("1254351385324032111");
    const threads = await channel.threads.fetchActive();

    for (const thread of threads.threads.values()) {
      await thread.delete();
    }
  },
};
