

export function displayWallets(wallets: { address: string, chain: string; }[]): string {
    const data: { [key: string]: string[]; } = {};
    for (const wallet of wallets) {
        if (data[wallet.chain]) {
            data[wallet.chain].push(wallet.address);
        } else {
            data[wallet.chain] = [wallet.address];
        }
    }
    let str = "";
    for (const key in data) {
        str += key.toUpperCase() + ":\n";
        for (const address of data[key]) {
            str += address + "\n";
        }
        str += "\n\n";
    }
    return str;
}

export function displayRoles(roles: any): string {
    let str = "";
    for (const role of roles) {
        str += role.name + "\n" + "     NFTs needed: " + role.num + "\n";
        for (const key in role.criteria) {
            str += "        " + key + ": " + role.criteria[key] + "\n";
        }
    }
    return str;
}


export function displayStatus(status: any): string {
    if (Object.keys(status).length > 0) {
        return `This guild (id: ${status.connectionId}) is connected to ${status.id}`;
    } else {
        return "No connection found...";
    }
}

export function displayUserRoles(roles: any[]) {
    if (roles.length === 0) {
        return "You are not eligible for any roles";
    }
    let str = "Your roles: \n";
    for (const role of roles) {
        str += role + "\n";
    }
    return str;
}