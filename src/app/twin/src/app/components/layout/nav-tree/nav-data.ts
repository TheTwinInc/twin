import { NavItem } from '@app/interfaces';
export const TREE_DATA: NavItem[] = [
    {
        label: 'Dashboard',
        route: '/dashboard',
    },
    {
        label: 'Products',
        children: [
        { label: 'Add Product', route: '/products/add' },
        { label: 'List Products', route: '/products/list' },
        ],
    },
    {
        label: 'Settings',
        children: [
        {
            label: 'Profile',
            route: '/settings/profile',
        },
        {
            label: 'Account',
            children: [
            { label: 'Security', route: '/settings/account/security' },
            { label: 'Notifications', route: '/settings/account/notifications' },
            ],
        },
        ],
    },
];