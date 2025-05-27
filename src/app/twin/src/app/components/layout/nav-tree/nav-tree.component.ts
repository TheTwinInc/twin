import { Component } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
    MatTreeFlatDataSource,
    MatTreeFlattener,
    MatTreeModule,
} from '@angular/material/tree';
import { NavItem, FlatNavItem } from '@app/interfaces';
import { TREE_DATA } from './nav-data';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'app-nav-tree',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        MatSidenavModule,
        MatListModule
    ],
    templateUrl: './nav-tree.component.html',
    styleUrl: './nav-tree.component.css'
})
export class NavTreeComponent {
    treeControl: FlatTreeControl<FlatNavItem>;
    treeFlattener: MatTreeFlattener<NavItem, FlatNavItem>;
    dataSource: MatTreeFlatDataSource<NavItem, FlatNavItem>;


    constructor() {
        this.treeFlattener = new MatTreeFlattener(
            this.transformer,
            node => node.level,
            node => node.expandable,
            node => node.children
        );

        this.treeControl = new FlatTreeControl<FlatNavItem>(
            node => node.level,
            node => node.expandable
        );

        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        // Example nav data
        this.dataSource.data = [
        {
            label: 'Dashboard',
            route: '/dashboard',
        },
        {
            label: 'Products',
            children: [
                { label: 'Add Product', route: '/products/add' },
                { label: 'Product List', route: '/products/list' },
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
    }

    transformer = (node: NavItem, level: number): FlatNavItem => {
        return {
            label: node.label,
            level,
            route: node.route,
            expandable: !!node.children && node.children.length > 0,
        };
    };

    hasChild = (_: number, node: FlatNavItem) => node.expandable;
}
