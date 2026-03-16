const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { DisTube } = require('distube');
const playdl = require('play-dl');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot Veren Aktif di Railway!'));
app.listen(process.env.PORT || 3000);

const TOKEN = "MTQ4MzE0MTQwODA3NTQxOTc0OA.G3EhQh.m8ZgoR6yKRhQcRYe_7yzGrT7DTQsn1Q3-a4z90";
const CLIENT_ID = "1483141408075419748";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
});

const distube = new DisTube(client, { emitNewSongOnly: true });

const commands = [
  new SlashCommandBuilder().setName('play').setDescription('Putar lagu (Judul/Link)').addStringOption(o => o.setName('lagu').setDescription('Ketik judul atau link').setRequired(true)),
  new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu'),
  new SlashCommandBuilder().setName('stop').setDescription('Bot keluar dari Voice')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('✅ BOT FINAL ONLINE DI RAILWAY!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply().catch(() => {});

  const { commandName, options, member, guild, channel } = interaction;
  const vc = member?.voice?.channel;

  if (commandName === 'play') {
    if (!vc) return interaction.editReply('❌ Masuk voice dulu bos!');
    const input = options.getString('lagu');
    
    try {
      await interaction.editReply(`🔍 **Mencari:** \`${input}\`...`);
      
      // Mesin pencari anti-blokir
      let search = await playdl.search(input, { limit: 1, source: { soundcloud: 'tracks' } });
      if (search.length === 0) return interaction.editReply('❌ Lagu tidak ketemu!');

      await distube.play(vc, search[0].url, { textChannel: channel, member: member });
      await interaction.deleteReply().catch(() => {});
    } catch (err) {
      console.log(err);
      await interaction.editReply('❌ **Gagal.** Link bermasalah.');
    }
  }

  if (commandName === 'skip') {
    const queue = distube.getQueue(guild.id);
    if (!queue) return interaction.editReply('❌ Tidak ada lagu.');
    if (queue.songs.length <= 1) await distube.stop(guild.id);
    else await distube.skip(guild.id);
    await interaction.editReply('⏭️ Lagu dilewati!');
  }

  if (commandName === 'stop') {
    distube.voices.get(guild.id)?.leave();
    await interaction.editReply('🛑 Bot keluar!');
  }
});

distube.on("playSong", (queue, song) => {
  const embed = new EmbedBuilder().setColor('#ff5500').setTitle('🎶 Sekarang Memutar').setDescription(`**[${song.name}](${song.url})**`).setThumbnail(song.thumbnail);
  queue.textChannel.send({ embeds: [embed] });
});

client.login(TOKEN);
