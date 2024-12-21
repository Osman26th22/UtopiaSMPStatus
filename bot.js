import { Client, GatewayIntentBits, ChannelType, PermissionsBitField, REST, Routes } from 'discord.js';
import { status } from 'minecraft-server-util';
import 'dotenv/config';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const SERVER_IP = process.env.SERVER_IP;
const SERVER_PORT = parseInt(process.env.SERVER_PORT, 10);
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);

    // Register the /status command
    const commands = [
        {
            name: 'status',
            description: 'Get the current Minecraft server status and MOTD',
        },
    ];

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    try {
        await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
        console.log('Successfully registered /status command.');
    } catch (error) {
        console.error('Error registering /status command:', error);
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error('Guild not found! Check your GUILD_ID in the .env file.');
        return;
    }

    await updateChannels(guild);
    setInterval(() => updateChannels(guild), 60 * 1000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'status') {
        try {
            const serverStatus = await status(SERVER_IP, SERVER_PORT);
            const motd = serverStatus.motd.clean;
            const onlinePlayers = serverStatus.players.online;
            const maxPlayers = serverStatus.players.max;

            await interaction.reply({
                content: `**Minecraft Server Status**\nMOTD: ${motd}\nOnline Players: ${onlinePlayers}/${maxPlayers}`,
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error fetching server status:', error);
            await interaction.reply({ content: 'Failed to retrieve server status.', ephemeral: true });
        }
    }
});

async function ensureCategory(guild, categoryName) {
    let category = guild.channels.cache.find(
        (channel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.error('Bot lacks the "Manage Channels" permission to create categories.');
            return null;
        }
        category = await guild.channels.create({
            name: categoryName,
            type: ChannelType.GuildCategory,
        });
    }
    return category;
}

async function ensureChannel(guild, channelName, channelType, parentCategory, permissionOverwrites) {
    let channel = guild.channels.cache.find(
        (ch) => ch.name.toLowerCase() === channelName.toLowerCase() && ch.type === channelType && ch.parentId === parentCategory.id
    );

    if (!channel) {
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.error('Bot lacks the "Manage Channels" permission to create channels.');
            return null;
        }
        channel = await guild.channels.create({
            name: channelName,
            type: channelType,
            parent: parentCategory.id,
            permissionOverwrites,
        });
    }
    return channel;
}

async function updateChannels(guild) {
    try {
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.error('Bot lacks the "Manage Channels" permission.');
            return;
        }

        const category = await ensureCategory(guild, 'status');
        if (!category) return;

        const serverStatus = await status(SERVER_IP);

        const statusChannel = await ensureChannel(
            guild,
            `🟢 Server: Online`,
            ChannelType.GuildVoice,
            category,
            [{ id: guild.id, deny: ['Connect'] }]
        );

        const playerCountChannel = await ensureChannel(
            guild,
            `👥 Players: ${serverStatus.players.online}/${serverStatus.players.max}`,
            ChannelType.GuildVoice,
            category,
            [{ id: guild.id, deny: ['Connect'] }]
        );

        if (statusChannel) await statusChannel.setName(`🟢 Server: Online`);
        if (playerCountChannel) await playerCountChannel.setName(`👥 Players: ${serverStatus.players.online}/${serverStatus.players.max}`);

    } catch (error) {
        console.error('Error updating channels:', error);

        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.error('Bot lacks the "Manage Channels" permission.');
            return;
        }

        const category = await ensureCategory(guild, 'status');
        if (!category) return;

        const statusChannel = await ensureChannel(
            guild,
            `🔴 Server: Offline`,
            ChannelType.GuildVoice,
            category,
            [{ id: guild.id, deny: ['Connect'] }]
        );

        if (statusChannel) await statusChannel.setName(`🔴 Server: Offline`);

        const playerCountChannel = guild.channels.cache.find(
            (ch) => ch.name.toLowerCase().startsWith('👥 players:') && ch.parentId === category.id
        );

        if (playerCountChannel) {
            await playerCountChannel.setName(`👥 Players: 0/0`);
        }
    }
}

client.login(DISCORD_TOKEN);
