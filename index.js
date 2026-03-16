const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { DisTube } = require('distube');
const playdl = require('play-dl');
const express = require('express');

// Setup server buat Railway agar tetap hidup
const app = express();
app.get('/', (req, res) => res.send('Bot Veren Aktif!'));
app.listen(process.env.PORT || 3000);

// PENTING: TOKEN diambil dari Environment Variable agar tidak terbaca publik di GitHub
const TOKEN = process.env.TOKEN; 
const CLIENT_ID = "1245887261686632468";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildVoiceStates, 
    GatewayIntentBits.GuildMessages
  ]
});

const distube = new DisTube(client, { 
  emitNewSongOnly: true,
  leaveOnEmpty: false
});

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu (Judul/Link)')
    .addStringOption(o => o.setName('lagu').setDescription('Ketik judul atau link').setRequired(true)),
  new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu'),
  new SlashCommandBuilder().setName('stop').setDescription('Bot keluar dari Voice')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ BOT FINAL ONLINE DI RAILWAY!');
  } catch (err) {
    console.error('Gagal register slash commands:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  // Mengatasi error "did not respond"
  await interaction.deferReply().catch(() => {});

  const { commandName, options, member, guild, channel } = interaction;
  const vc = member?.voice?.channel;

  if (commandName === 'play') {
    if (!vc) return interaction.editReply('❌ Masuk voice dulu bos!');
    const input = options.getString('lagu');
    
    try {
      await interaction.editReply(`🔍 **Mencari:** \`${input}\`...`);
      
      // Mesin pencari anti-blokir SoundCloud
      let search = await playdl.search(input, { limit: 1, source: { soundcloud: 'tracks' } });
      if (search.length === 0) return interaction.editReply('❌ Lagu tidak ketemu!');

      await distube.play(vc, search[0].url, { textChannel: channel, member: member });
      await interaction.deleteReply().catch(() => {});
    } catch (err) {
      console.log(err);
      await interaction.editReply('❌ **Gagal.** Pastikan bot punya izin di Voice Channel.');
    }
  }

  if (commandName === 'skip') {
    const queue = distube.getQueue(guild.id);
    if (!queue) return interaction.editReply('❌ Tidak ada lagu yang diputar.');
    try {
      if (queue.songs.length <= 1) await distube.stop(guild.id);
      else await distube.skip(guild.id);
      await interaction.editReply('⏭️ Lagu dilewati!');
    } catch (e) {
      await interaction.editReply('❌ Gagal skip.');
    }
  }

  if (commandName === 'stop') {
    distube.voices.get(guild.id)?.leave();
    await interaction.editReply('🛑 Bot keluar!');
  }
});

distube.on("playSong", (queue, song) => {
  const embed = new EmbedBuilder()
    .setColor('#ff5500')
    .setTitle('🎶 Sekarang Memutar')
    .setDescription(`**[${song.name}](${song.url})**`)
    .setThumbnail(song.thumbnail);
  queue.textChannel.send({ embeds: [embed] });
});

// Login menggunakan token dari Railway Variables
client.login(TOKEN).catch(err => {
  console.error('❌ LOGIN GAGAL: Pastikan TOKEN di tab Variables Railway sudah benar!');
});
