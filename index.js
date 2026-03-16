import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from "@discordjs/voice";
import play from "play-dl";

const client = new Client({
 intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
 console.log("Bot music online");
});

client.on("interactionCreate", async interaction => {
 if (!interaction.isChatInputCommand()) return;

 if (interaction.commandName === "play") {

   const url = interaction.options.getString("url");
   const voice = interaction.member.voice.channel;

   if (!voice) {
     interaction.reply("Masuk voice channel dulu");
     return;
   }

   const connection = joinVoiceChannel({
     channelId: voice.id,
     guildId: interaction.guild.id,
     adapterCreator: interaction.guild.voiceAdapterCreator
   });

   const stream = await play.stream(url);

   const resource = createAudioResource(stream.stream, {
     inputType: stream.type
   });

   const player = createAudioPlayer();

   connection.subscribe(player);
   player.play(resource);

   interaction.reply("Memutar musik 🎵");
 }
});

client.login(process.env.TOKEN);
