import { Component, OnDestroy, OnInit } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavItem, FlatNavItem, IContainedResource } from '@app/interfaces';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { Subject, takeUntil } from 'rxjs';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { LoggerService, SolidAuthService, SolidDataService } from '@app/services';
import { DirectedGraph } from 'graphology';
// import Graph from 'graphology';

@Component({
    selector: 'app-nav-tree',
    standalone: true,
    imports: [
        RouterModule,
        MatTreeModule, 
        MatButtonModule, 
        MatIconModule,
        MatProgressBarModule,
        MatSidenavModule
    ],
    templateUrl: './nav-tree.component.html',
    styleUrl: './nav-tree.component.css'
})
export class NavTreeComponent implements OnInit, OnDestroy{
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    containedResources?: IContainedResource[] | null;
    assetsGraph?: DirectedGraph | null;
    sessionInfo?: ISessionInfo | null;
    emptyContainedResources: IContainedResource[] = [];

    treeControl: FlatTreeControl<FlatNavItem>;
    treeFlattener: MatTreeFlattener<NavItem, FlatNavItem>;
    dataSource: MatTreeFlatDataSource<NavItem, FlatNavItem>;

    emptyNavItem: NavItem[] = [];

    constructor(
        private solidAuthService: SolidAuthService,
        private solidDataService: SolidDataService,
        private logger: LoggerService,
    ) {
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
    }

    ngOnInit() {
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
        this.solidDataService.containedResources
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.containedResources = x;
                this.logger.debug(`NAV: Update contained resources`);
            });
        this.solidDataService.assetsGraph
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.assetsGraph = x;
                this.logger.debug(`NAV: Update assets: ${JSON.stringify(x)}`);
                let navTree: NavItem[] | undefined = this.graphToNavForest(x);
                this.logger.debug(`NAV: Nav tree: ${JSON.stringify(navTree)}`);
                this.updateNodeTree(navTree);
            });
        
    }

    updateNodeTree(navTree: NavItem[] | undefined) {
        if (undefined != navTree) {
            const expandedIds = new Set(
                (this.treeControl.dataNodes || [])
                    .filter(node => this.treeControl.isExpanded(node))
                    .map(node => node.id)
            );
            this.dataSource.data = navTree ? navTree : this.emptyNavItem;
            this.logger.info(`NAVT: Node tree: ${JSON.stringify(navTree)}`);

            setTimeout(() => {
                this.treeControl.dataNodes.forEach(node => {
                    if (expandedIds.has(node.id)) {
                    this.treeControl.expand(node);
                    }
                });
            });
        }
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    async onSessionChange (sessionInfo: any) {
        if (!sessionInfo?.isLoggedIn) {
            this.containedResources = this.emptyContainedResources;
        }
    }

    transformer = (node: NavItem, level: number): FlatNavItem => {
        return {
            id: node.id,
            name: node.name,
            level,
            url: node.url,
            expandable: !!node.children && node.children.length > 0,
        };
    };

    hasChild = (_: number, node: FlatNavItem) => node.expandable;

    // async navigateResource(url: string) {
    async navigateResource(node: any) {

    // async navigateResource(resource: IContainedResource) {
        this.logger.info(`Navigate node: ${JSON.stringify(node)}`);
        let dataset = await this.solidDataService.getDataset(node.id);
        this.solidDataService.getThingAll(dataset);
        const containedResources = this.solidDataService.getContainedResources(dataset);
        this.solidDataService.setAssetsGraph(node, containedResources);
    }

    // graphToNavForest(graph: Graph): NavItem[] {
    graphToNavForest(graph: DirectedGraph | null): NavItem[] | undefined {
        const visited = new Set<string>();

        // 1. Find all root nodes (no inbound edges)
        const roots = graph?.nodes().filter((nodeId) => graph.inDegree(nodeId) === 0);

        // 2. Recursively build tree from a given node
        function buildTree(nodeId: string): NavItem {
            if (visited.has(nodeId)) {
                throw new Error(`Cycle detected at node ${nodeId}`);
            }

            visited.add(nodeId);

            const attributes = graph?.getNodeAttributes(nodeId);
            const children: NavItem[] = [];

            graph?.outboundNeighbors(nodeId).forEach((childId) => {
                children.push(buildTree(childId));
            });

            return {
                id: nodeId,
                name: attributes?.name,
                ...(attributes?.url && { url: attributes.url }),
                ...(children.length > 0 && { children })
            };
        }

        // 3. Build trees from all roots
        return roots?.map(buildTree);
    }
}
