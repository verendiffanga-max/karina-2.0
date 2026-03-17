const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const express = require('express');

// Supaya Railway tidak mati (Health Check)
const app = express();
app.get('/', (req, res) => res.send('Bot Veren Aktif!'));
app.listen(process.env.PORT || 3000);

const TOKEN = process.env.TOKEN; 
const CLIENT_ID = "1483141408075419748";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildVoiceStates, // WAJIB: Supaya bot bisa masuk Voice
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent   // Supaya bot bisa baca perintah
  ]
});

const distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [new SoundCloudPlugin(), new YtDlpPlugin()]
});

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu')
    .addStringOption(o => o.setName('lagu').setDescription('Judul/Link').setRequired(true)),
  new SlashCommandBuilder().setName('skip').setDescription('Skip lagu'),
  new SlashCommandBuilder().setName('stop').setDescription('Bot keluar')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ BOT FINAL ONLINE DI RAILWAY!');
  } catch (err) {
    console.error('Gagal daftar command:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply().catch(() => {});
  const { commandName, options, member, guild, channel } = interaction;
  const vc = member?.voice?.channel;

  if (commandName === 'play') {
    if (!vc) return interaction.editReply('❌ Masuk voice dulu bos!');
    try {
      await distube.play(vc, options.getString('lagu'), { textChannel: channel, member: member });
      await interaction.deleteReply().catch(() => {});
    } catch (err) {
      console.log(err);
      await interaction.editReply('❌ Gagal muter lagu. Cek izin bot.');
    }
  }
  if (commandName === 'skip') {
    distube.skip(guild.id).then(() => interaction.editReply('⏭️ Skip!')).catch(() => interaction.editReply('❌ Gak ada lagu.'));
  }
  if (commandName === 'stop') {
    distube.voices.get(guild.id)?.leave();
    interaction.editReply('🛑 Bye!');
  }
});

distube.on("playSong", (queue, song) => {
  queue.textChannel.send({ 
    embeds: [new EmbedBuilder().setColor('#ff5500').setTitle('🎶 Memutar').setDescription(`**${song.name}**`)] 
  });
});

client.login(TOKEN);
  
