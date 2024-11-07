const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");

module.exports = (client) => {
  client.handleCommands = async () => {
    const commandFolders = fs.readdirSync("./src/commands");
    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`./src/commands/${folder}`)
        .filter((file) => file.endsWith(".js"));

      const { commands, commandArray } = client;

      for (const file of commandFiles) {
        const command = require(`../../commands/${folder}/${file}`);
        commands.set(command.data.name, command);
        commandArray.push(command.data.toJSON());
      }
    }

    const clientId = "1250356753514889267";
    const guildId = "1250387871517638708";
    const rest = new REST({ version: "9" }).setToken(process.env.token);

    try {
      console.log("[CLIENT] Started refreshing application commands.");

      const registeredCommands = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        {
          body: client.commandArray,
        }
      );

      registeredCommands.forEach((registeredCommand) => {
        const command = client.commands.get(registeredCommand.name);
        if (command) {
          command.id = registeredCommand.id;
        }
      });

      console.log("[CLIENT] Successfully reloaded application commands.");
    } catch (error) {
      console.log(error);
    }
  };
};
