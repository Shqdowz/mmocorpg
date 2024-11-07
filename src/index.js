require("dotenv").config();
const { token, databaseToken } = process.env;

const { connect } = require("mongoose");
const { Client, Collection, IntentsBitField } = require("discord.js");
const fs = require("fs");

const client = new Client({ intents: IntentsBitField.Flags.Guilds });

client.commands = new Collection();
client.commandArray = [];

const functionFolders = fs.readdirSync("./src/functions");
for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(`./src/functions/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of functionFiles) {
    require(`./functions/${folder}/${file}`)(client);
  }
}

client.handleCommands();
client.handleEvents();

client.login(token);
connect(databaseToken);
