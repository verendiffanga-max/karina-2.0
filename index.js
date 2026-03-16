const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
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
    GatewayIntentBits.GuildMessages
  ]
});

// Setting DisTube yang lebih stabil
const distube = new DisTube(client, {
  emitNewSongOnly: true,
  leaveOnEmpty: false,
  plugins: [new SoundCloudPlugin()]
});

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu dari judul atau link')
    .addStringOption(o => o.setName('lagu').setDescription('Judul lagu atau link').setRequired(true)),
  new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu'),
  new SlashCommandBuilder().setName('stop').setDescription('Bot berhenti dan keluar')
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
    if (!vc) return interaction.editReply('❌ Masuk voice channel dulu bos!');
    const lagu = options.getString('lagu');
    
    try {
      await interaction.editReply(`🔍 **Mencari:** \`${lagu}\`...`);
      
      // Langsung pakai fungsi play dari distube (Anti Error client_id)
      await distube.play(vc, lagu, {
        textChannel: channel,
        member: member,
      });

      await interaction.deleteReply().catch(() => {});
    } catch (err) {
      console.log(err);
      await interaction.editReply('❌ **Gagal.** Cek izin bot atau coba judul lain.');
    }
  }

  if (commandName === 'skip') {
    const queue = distube.getQueue(guild.id);
    if (!queue) return interaction.editReply('❌ Gak ada lagu lagi diputar.');
    try {
      if (queue.songs.length <= 1) await distube.stop(guild.id);
      else await distube.skip(guild.id);
      await interaction.editReply('⏭️ Lagu diskip!');
    } catch (e) {
      await interaction.editReply('❌ Gagal skip.');
    }
  }

  if (commandName === 'stop') {
    distube.voices.get(guild.id)?.leave();
    await interaction.editReply('🛑 Bot keluar dari voice!');
  }
});

distube.on("playSong", (queue, song) => {
  const embed = new EmbedBuilder()
    .setColor('#ff5500')
    .setTitle('🎶 Sekarang Memutar')
    .setDescription(`**[${song.name}](${song.url})**`)
    .setThumbnail(song.thumbnail)
    .setFooter({ text: `Durasi: ${song.formattedDuration}` });
  queue.textChannel.send({ embeds: [embed] });
});

// Penanganan error agar bot tidak crash tiba-tiba
distube.on("error", (channel, e) => {
  console.error(e);
  channel.send(`❌ Error: ${e.message.slice(0, 100)}`);
});

client.login(TOKEN);
        
