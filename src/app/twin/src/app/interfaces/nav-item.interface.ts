export interface NavItem {
    label: string;
    route?: string;
    children?: NavItem[];
}

export interface FlatNavItem {
    expandable: boolean;
    label: string;
    level: number;
    route?: string;
}