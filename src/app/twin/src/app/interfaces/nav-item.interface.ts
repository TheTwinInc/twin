export interface NavItem {
    id: string;
    name: string;
    url?: string;
    children?: NavItem[];
}

export interface FlatNavItem {
    id: string;
    expandable: boolean;
    name: string;
    level: number;
    url?: string;
}
