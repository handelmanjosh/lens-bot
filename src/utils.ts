import axios from "axios";
import { Client } from "discord.js";


export async function getWalletsForDiscord(discord: string) {
    try {
        const response = await axios.get(`${process.env.SERVER_URL}/bot/discord/wallets/${discord}?key=${process.env.DISCORD_BOT_TOKEN}`);
        if (response.status === 200) {
            return response.data;
        } else {
            return null;
        }
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function getRolesForServer(server: string) {
    try {
        const response = await axios.get(`${process.env.SERVER_URL}/bot/discord/roles/${server}?key=${process.env.DISCORD_BOT_TOKEN}`);
        if (response.status === 200) {
            return response.data;
        } else {
            return [];
        }
    } catch (e) {
        console.error(e);
        return [];
    }
}
export async function getServerByConnection(connectionId: string) {
    try {
        const response = await axios.get(`${process.env.SERVER_URL}/bot/discord/server?key=${process.env.DISCORD_BOT_TOKEN}&connectionId=${connectionId}`);
        if (response.status === 200) {
            return response.data;
        } else {
            return undefined;
        }
    } catch (e) {
        console.error(e);
        return undefined;
    }
}
export async function getLinkStatus(server: string) {
    try {
        const response = await axios.get(`${process.env.SERVER_URL}/bot/discord/server/${server}/status?key=${process.env.DISCORD_BOT_TOKEN}`);
        if (response.status === 200) {
            return response.data;
        } else {
            return {};
        }
    } catch (e) {
        console.error(e);
        return {};
    }
}

export async function makeServerLink(server: string, lensServerKey: string, user: string) {
    // add user
    try {
        const response = await axios.post(`${process.env.SERVER_URL}/bot/discord/server/${server}/link?key=${process.env.DISCORD_BOT_TOKEN}&lensKey=${lensServerKey}&user=${user}`);
        return response.status === 200;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function checkAndGetRoles(user: string, connectionId: string) {
    try {
        const response = await axios.get(`${process.env.SERVER_URL}/bot/discord/nfts?key=${process.env.DISCORD_BOT_TOKEN}&user=${user}&connectionId=${connectionId}`);
        const { nfts, server } = response.data;
        const roles = getMatchedRoles(nfts, server);
        return roles;
    } catch (e) {
        console.log(`Errored with user ${user} and connection ${connectionId}`);
        return null;
    }
}

function findValue(key: string, nft: any): any {
    if (nft !== null && typeof nft === 'object') {
        if (key in nft) {
            return nft[key];
        }
        for (const prop in nft) {
            if (nft.hasOwnProperty(prop)) {
                // Recursively call findKey for nested objects
                const result = findValue(key, nft[prop]);
                if (result !== undefined) {
                    return result;
                }
            }
        }
    }
    return undefined;
}
function getMatchedRoles(nfts: any, server: any) {
    const roles: any[] = [];
    for (const role of server.roles) {
        if (nfts.length < role.num) continue;
        let failed = false;
        for (const key in role.criteria) {
            let found = false;
            for (const nft of nfts) {
                const value = findValue(key, nft);
                if (value === role.criteria[key]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                failed = true;
                break;
            }
        }
        if (failed) continue;
        roles.push(role.name);
    }
    return roles;
}
export async function work(client: Client) {
    for (const [_, guild] of client.guilds.cache) {
        const members = await guild.members.fetch();
        for (const [_, member] of members) {
            const roles = await checkAndGetRoles(member.user.username, guild.id);
            if (!roles) continue;
            for (const role of roles) {
                const guildRole = guild.roles.cache.find(r => r.name === role);
                if (guildRole) {
                    await member.roles.add(guildRole);
                }
            }
        }
    }
}