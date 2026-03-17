import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
 new SlashCommandBuilder()
   .setName("play")
   .setDescription("Play music")
   .addStringOption(option =>
     option.setName("url")
       .setDescription("Link lagu")
       .setRequired(true)
   )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

await rest.put(
 Routes.applicationCommands(process.env.CLIENT_ID),
 { body: commands }
);

console.log("Command berhasil dibuat");
