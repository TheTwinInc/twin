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
    photo?: string;
    // role?: string;
    [key: string]: string | undefined;
}