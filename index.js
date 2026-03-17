const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const express = require('express');

// Biar Railway gak mati
const app = express();
app.get('/', (req, res) => res.send('Bot Veren Online!'));
app.listen(process.env.PORT || 3000);

const TOKEN = process.env.TOKEN; 
const CLIENT_ID = "1483141408075419748";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildVoiceStates, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [new SoundCloudPlugin(), new YtDlpPlugin()]
});

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu dari YouTube/SoundCloud')
    .addStringOption(o => o.setName('lagu').setDescription('Judul lagu atau link').setRequired(true)),
  new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu'),
  new SlashCommandBuilder().setName('stop').setDescription('Bot berhenti dan keluar')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ BOT SUDAH AKTIF DAN PERINTAH TERDAFTAR!');
  } catch (err) {
    console.error('Gagal daftar slash commands:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  // Beri respon awal agar tidak "Interaction Failed"
  await interaction.deferReply().catch(() => {});

  const { commandName, options, member, guild, channel } = interaction;
  const vc = member?.voice?.channel;

  if (commandName === 'play') {
    if (!vc) return interaction.editReply('❌ Kamu harus masuk Voice Channel dulu bos!');
    const query = options.getString('lagu');
    
    try {
      await interaction.editReply(`🔍 Sedang mencari: **${query}**...`);
      await distube.play(vc, query, { textChannel: channel, member: member });
      await interaction.deleteReply().catch(() => {});
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Gagal memutar. Coba judul lain atau cek izin bot.');
    }
  }

  if (commandName === 'skip') {
    try {
      await distube.skip(guild.id);
      await interaction.editReply('⏭️ Lagu diskip!');
    } catch (e) {
      await interaction.editReply('❌ Gak ada lagu selanjutnya.');
    }
  }

  if (commandName === 'stop') {
    distube.voices.get(guild.id)?.leave();
    await interaction.editReply('🛑 Bot keluar!');
  }
});

distube.on("playSong", (queue, song) => {
  queue.textChannel.send({ 
    embeds: [new EmbedBuilder().setColor('#ff5500').setTitle('🎶 Memutar').setDescription(`**[${song.name}](${song.url})**`)] 
  });
});

// Penanganan error biar bot gak mati total
distube.on("error", (channel, e) => {
  console.error(e);
  if (channel) channel.send(`❌ Error Sistem: ${e.message.slice(0, 100)}`);
});

client.login(TOKEN).catch(err => console.error('Gagal Login! Cek TOKEN kamu di Railway Variables.'));
