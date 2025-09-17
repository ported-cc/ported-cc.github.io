export interface AHost {
    hostname: string;
    acode: string;
}


export interface Server { 
    name: string;
    hostname: string;
    path: string;
    priority: number;
}



export let AHosts: AHost[] = [{
    hostname: "ccported.github.io",
    acode: "e/4/500442-526a-41af-9981-22db9286cd37.js"
}, {
    hostname: "ccported.click",
    acode: "5/2/0ff0b7-11f3-4bd8-b154-cfeed8597df1.js"
}];
export function setAHosts(ahosts: AHost[]) {
    AHosts = ahosts;
}

export const Servers: Server[] = [{
    name: "Charlie",
    hostname: "ccgstatic.com",
    path: "games/",
    priority: 1
}, {
    name: "Bell",
    hostname: "ccportedgames.s3.us-west-2.amazonaws.com",
    path: "",
    priority: 6
},
{
    name: "Olympic",
    hostname: "d1yh00vn2fvto7.cloudfront.net",
    path: "games/",
    priority: 3
}, {
    name: "Shafiyoon",
    hostname: "d1cp3xh9gda0oe.cloudfront.net",
    path: "games/",
    priority: 4
}, {
    name: "Racecar",
    hostname: "d1vqjbyryjpk97.cloudfront.net",
    path: "games/",
    priority: 5
}, {
    name: "Ellay",
    hostname: "ccported.click",
    path: "games/",
    priority: 2
}]


export const findSingleServer = async (): Promise<Server | null> => {
    try {
        const response = await fetch("http://ccproxy-lb-n-1192779656.us-west-2.elb.amazonaws.com/server/games");
        if (!response.ok) {
            return null;
        }
        const text = await response.text();
        // Example response: "<GAMES> 44.243.124.75 proxy-1758086342367 /games/"
        // "<TYPE> HOST NAME PATh"
        const parts = text.trim().split(/\s+/);
        if (parts.length < 4) {
            return null;
        }
        return {
            name: parts[2],
            hostname: parts[1],
            path: parts[3],
            priority: 1
        };
    } catch {
        return null;
    }
};

export const findServers = async (): Promise<Server[] | null> => {
    try {
        const response = await fetch("http://ccproxy-lb-n-1192779656.us-west-2.elb.amazonaws.com/servers.txt");
        if (!response.ok) {
            return null;
        }
        const text = await response.text();
        // Example response: "<GAMES> 44.243.124.75 proxy-1758086342367 /games/"
        // "<TYPE> HOST NAME PATh"
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) {
            return null;
        }
        const servers: Server[] = lines.map((line, i) => {
            if (line.startsWith("#")) {
                return null;
            }
            const parts = line.split(/\s+/);
            return {
                name: parts[2],
                hostname: parts[1],
                path: parts[3],
                priority: i + 1
            };
        }).filter(s => s !== null) as Server[];
        return servers;
    } catch {
        return null;
    }
};


export const findAHosts = async (): Promise<AHost[]> => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/ahosts.txt` : "https://ccgstatic.com/ahosts.txt";
    const response = await fetch(url);
    if (!response.ok) {
        return AHosts;
    }
    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const ahosts: AHost[] = lines.map((line) => {
        const parts = line.split(',').map(p => p.trim());
        return {
            hostname: parts[0],
            acode: parts[1]
        };
    });
    return ahosts;
}