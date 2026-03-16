import { Client, GatewayIntentBits } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from "@discordjs/voice";
import play from "play-dl";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log("Bot music online");
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  if (message.content.startsWith("!play")) {

    const args = message.content.split(" ");
    const url = args[1];

    if (!url) {
      return message.reply("Masukkan link lagu!");
    }

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.reply("Masuk voice channel dulu!");
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    const stream = await play.stream(url);

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    const player = createAudioPlayer();

    connection.subscribe(player);
    player.play(resource);

    message.reply("🎵 Memutar lagu...");
  }

  if (message.content === "!leave") {
    message.guild.members.me.voice.disconnect();
  }

});

client.login(process.env.TOKEN);
   const player = createAudioPlayer();

   connection.subscribe(player);
   player.play(resource);

   interaction.reply("Memutar musik 🎵");
 }
});

client.login(process.env.TOKEN);
