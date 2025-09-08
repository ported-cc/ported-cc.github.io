export interface AHost {
    name: string;
    hostname: string;
    acode: string;
}


export interface Server { 
    name: string;
    hostname: string;
    path: string;
    priority: number;
}



export const AHosts: AHost[] = [{
    name: "github",
    hostname: "ccported.github.io",
    acode: "e/4/500442-526a-41af-9981-22db9286cd37.js"
}, {
    name: "click",
    hostname: "ccported.click",
    acode: "5/2/0ff0b7-11f3-4bd8-b154-cfeed8597df1.js"
}];

export const Servers: Server[] = [{
    name: "Charlie",
    hostname: "ccgstatic.com",
    path: "games/",
    priority: 0
}, {
    name: "Bell",
    hostname: "ccportedgames.s3.us-west-2.amazonaws.com",
    path: "",
    priority: 3
},
{
    name: "Olympic",
    hostname: "d1yh00vn2fvto7.cloudfront.net",
    path: "games/",
    priority: 2
}, {
    name: "Shafiyoon",
    hostname: "d1cp3xh9gda0oe.cloudfront.net",
    path: "games/",
    priority: 2
}, {
    name: "Racecar",
    hostname: "d1vqjbyryjpk97.cloudfront.net",
    path: "games/",
    priority: 2
}, {
    name: "Ellay",
    hostname: "ccported.click",
    path: "games/",
    priority: 1
}]


export const findServers = async (): Promise<Server[]> => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/servers.txt` : "https://ccgstatic.com/servers.txt";
    const response = await fetch(url);
    if (!response.ok) {
        return Servers;
    }
    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    /* 
    ccgstatic.com,Charlie,games/
ccportedgames.s3.us-west-2.amazonaws.com,Bell,
d1yh00vn2fvto7.cloudfront.net,Olympic,games/
d1cp3xh9gda0oe.cloudfront.net,Shafiyoon,games/
d1vqjbyryjpk97.cloudfront.net,Racecar,games/
ccported.click,Ellay,games/*/
    const servers: Server[] = lines.map((line, index) => {
        const parts = line.split(',').map(p => p.trim());
        return {
            hostname: parts[0],
            name: parts[1],
            path: parts[2] || '',
            priority: index
        };
    });
    return servers;
}