import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, Guild, IntentsBitField, InteractionType, ModalBuilder, REST, Routes, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import dotenv from "dotenv";
import { checkAndGetRoles, getLinkStatus, getRolesForServer, getServerByConnection, getWalletsForDiscord, makeServerLink, work } from "./utils";
import { displayWallets, displayRoles, displayStatus, displayUserRoles } from "./display";
import cron from "node-cron";
dotenv.config();
const client = new Client({ intents: [IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.Guilds] });
client.once("ready", () => {
    console.log(`logged in as ${client.user?.tag}`);
});

// add function to loop over all guilds that bot is member of and create channel if it doesn't exist
client.on("guildCreate", async (guild: Guild) => {
    try {
        const channel = await guild.channels.create({
            name: 'Lens Verification',
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: ['ViewChannel', 'SendMessages'],
                },
            ],
        });
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('check_status') // this is where users go to get their roles
                    .setLabel('Check Status')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('manage_wallets') // users can go here to manage their data
                    .setLabel('Manage Wallets')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('server_roles') // users can view all available server roles
                    .setLabel('Server Roles')
                    .setStyle(ButtonStyle.Danger),
                // new ButtonBuilder()
                //     .setCustomId('support_ticket')
                //     .setLabel('Open a Support Ticket')
                //     .setStyle(ButtonStyle.Success)
            );

        await channel.send({
            content: 'Verify Holder Status\n\nThis community uses Matrica Labs Holder Verification!\n\nTo get access to the server, you must verify that you are a holder.\n\nClick here to make your Matrica profile and get started. If you already have a profile, you are all set!\n\nAdding a wallet to your Matrica Profile will not give anyone access to your wallet and will only be used to verify your holder status.',
            // @ts-ignore
            components: [row]
        });
        const channel2 = await guild.channels.create({
            name: 'Lens Admin',
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: ['ViewChannel', 'SendMessages'],
                },
            ],
        });
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('server_link') // this is where users go to get their roles
                    .setLabel('Link to Server')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('check_link_status')
                    .setLabel("Check Link Status")
                    .setStyle(ButtonStyle.Secondary)
            );
        await channel2.send({
            content: 'Admin Page. Make sure to link your server to Lens.',
            // @ts-ignore
            components: [row2]
        });
        console.log('Channel created successfully.');
    } catch (error) {
        console.error('Error creating channel:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'check_status') {
            const roles = await checkAndGetRoles(interaction.user.username, interaction.guild!.id);
            if (roles) {
                for (const role of roles) {
                    const guildRole = interaction.guild!.roles.cache.find(r => r.name === role);
                    if (guildRole) {
                        await (interaction.member!.roles as any).add(guildRole);
                    }
                }
                const rolesText = displayUserRoles(roles);
                await interaction.reply({ content: rolesText, ephemeral: true });
            } else {
                await interaction.reply({ content: "You dont have an account. Visit the website to create your account", ephemeral: true });
            }
        } else if (interaction.customId === 'manage_wallets') {
            const wallets = await getWalletsForDiscord(interaction.user.username);
            if (wallets && wallets.length >= 0) {
                const walletText = displayWallets(wallets);
                await interaction.reply({ content: 'Your connected wallets\n' + walletText, ephemeral: true });
            } else {
                await interaction.reply({ content: 'You dont have an account. Visit the website to create your account', ephemeral: true });
            }
        } else if (interaction.customId === 'server_roles') {
            const roles = await getRolesForServer(interaction.guild!.id);
            const rolesText = displayRoles(roles);
            await interaction.reply({ content: 'Server Roles\n' + rolesText, ephemeral: true });
        } else if (interaction.customId === 'support_ticket') {
            await interaction.reply({ content: 'Opening a support ticket...', ephemeral: true });
        } else if (interaction.customId === 'check_link_status') {
            const status = await getLinkStatus(interaction.guild!.id);
            const statusText = displayStatus(status);
            await interaction.reply({ content: statusText, ephemeral: true });
        } else if (interaction.customId === 'server_link') {
            const modal = new ModalBuilder()
                .setCustomId('server_link_form')
                .setTitle('Verification Form')
                .addComponents(
                    // @ts-ignore
                    [new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('server_link_text_input')
                            .setLabel('Enter your Lens project ID')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )]
                );
            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit() && interaction.customId === "server_link_form") {
        const input = interaction.fields.getTextInputValue("server_link_text_input");
        const result = await makeServerLink(interaction.guild!.id, input, interaction.user.username);
        const serverData = await getServerByConnection(interaction.guild!.id);
        for (const role of serverData.roles) {
            let r = interaction.guild!.roles.cache.find(r => r.name === role.name);
            if (!r) {
                await interaction.guild!.roles.create({
                    name: role.name,
                    color: 'Blue', // Customize as needed
                });
            }
        }
        await interaction.reply({ content: result ? "Link Success!" : "Link Failure...", ephemeral: true });
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// iterate over every member in every guild and fix roles. Do this every 15 minutes


cron.schedule('*/15 * * * *', () => {
    console.log('Evaluating roles...');
    work(client);
});
