export interface AgentAccess {
    webId: string;          // WebID of the agent (user or group)
    read: boolean;
    write: boolean;
    append: boolean;
    control: boolean;
}

export type AccessMode = 'Read' | 'Write' | 'Append' | 'Control';

// export enum AgentAccess {
//     Read = 'read',
//     Write = 'write',
//     Append = 'append',
//     Control = 'control'
// }

export interface WacAllow {
    user: string[];
    public: string[];
}

export interface AccessHeaders {
    wacAllow?: WacAllow;
    acpUrl?: string;
    aclUrl?: string;
    etag?: string;
    lastModified?: string;
}

export interface EffectiveAccess {
    read: boolean;
    write: boolean;
    control: boolean;
    append: boolean;
    source: 'WAC-Allow' | 'ACL' | 'ACP' | 'Unknown';
}

export interface AgentAuthorization {
    // subject: string;
    agentWebId: string | null;
    agentClass?: string | null;
    accessTo?: string;
    defaultFor?: string;
    modes?: string[];
}

export interface AddAgentAuthorizationOptions {
    aclUrl: string;
    agentWebId: string;
    accessTo?: string;      // resource
    defaultFor?: string;    // container
    modes: AccessMode[];
}