export interface RdfUpdate {
    predicate: string;
    value: string;
    isLiteral?: boolean;
    lang?: string;
}

export interface RdfProfile {
    webId: string;
    name?: string;
    email?: string;
    img?: string;
    role?: string;
    org?: string;
    phone?: string;
    [key: string]: string | undefined;
}

export interface FriendProfile {
    webId: string;
    name: string;
    email?: string;
    img?: string;
    role?: string;
    org?: string;
    // img: string | null;
}

export interface ProfileData {
    name: string;
    img: string | null;
    org: string | null;
    role: string | null;
}

export interface VCardData {
    fullName: string;
    org?: string;
    title?: string;
    email?: string;
    phone?: string;
}