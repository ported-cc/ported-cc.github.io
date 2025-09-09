export interface Game {
    gameID: string;
    thumbPath: string;
    fName: string;
    description: string;
    tags: Tag[];
    clicks: number;
    uploadedTimestamp: number;
    updatedTimestamp: number;

}

export interface ROM {
    console: "atari2600" | "dos" | "dreamcast" | "gb" | "gba" | "gbc" | "n64" | "nds" | "nes" | "psx" | "sega" | "segaMD" | "snes" | "vb" | string; // Allow custom consoles as strings
    name: string;
    filename: string

}

export interface Tag extends String {};