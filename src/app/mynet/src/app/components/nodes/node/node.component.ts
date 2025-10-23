import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatGridListModule } from '@angular/material/grid-list';
import { AccessHeaders, AgentAuthorization, ITriple, WacAllow } from '@app/interfaces';
import { AccessControlListService, LoggerService, RdfService, SolidAuthService, SolidProfileService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AgentAccess } from '@app/interfaces';

@Component({
    selector: 'app-node',
    imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTableModule,
    MatGridListModule,
    MatSortModule,
    MatCheckboxModule,
],
    templateUrl: './node.component.html',
    styleUrl: './node.component.css',
    standalone: true
})
export class NodeComponent {

    @ViewChild('triplesPaginator') triplesPaginator!: MatPaginator;
    @ViewChild('authorizationsPaginator') authorizationsPaginator!: MatPaginator;
    @ViewChild('triplesTableSort') triplesSort = new MatSort;
    @ViewChild('authorizationsTableSort') authorizationsSort = new MatSort;
    
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    
    form!: FormGroup;
    toppings!: FormGroup;
    wacAllowUserForm!: FormGroup;
    wacAllowPublicForm!: FormGroup;

    sessionInfo?: ISessionInfo | null;
    nodeInfo?: string | null;

    loading: boolean = false;

    triples: { subject: string; predicate: string; object: string }[] = [];
    authorizations: { subject: string; predicate: string; object: string }[] = [];
    
    displayedColumns: string[] = ['subject', 'predicate', 'object'];
    
    dataSourceTriples!: MatTableDataSource<ITriple>;
    dataSourceAuthorizations!: MatTableDataSource<ITriple>;

    numberOfTriples = 0;
    pageSizeTriples = 10;
    pageIndexTriples = 0;
    pageSizeOptionsTriples = [5, 10, 15, 20, 25];
    pageEventTriples: PageEvent | undefined;
    
    numberOfAuthorizations = 0;
    pageSizeAuthorizations = 10;
    pageIndexAuthorizations = 0;
    pageSizeOptionsAuthorizations = [5, 10, 15, 20, 25];
    pageEventAuthorizations: PageEvent | undefined;

    // hidePageSize = false;
    // showPageSizeOptions = true;
    // showFirstLastButtons = true;
    // disabled = false;

    
    aclContents!: { subject: string; predicate: string; object: string; }[];

    // wacAllowUser!: WacAllow;
    // wacAllowPublic!: WacAllow;

    constructor(
        private formBuilder: FormBuilder,
        private rdfService: RdfService,
        private solidAuthService: SolidAuthService,
        private solidProfileService: SolidProfileService,
        private aclService: AccessControlListService,
        private logger: LoggerService
    ) {
        this.getSessionInfo();
        this.form = this.formBuilder.group({
            node: ['', Validators.required]
        });
        this.wacAllowUserForm = this.formBuilder.group({
            write: false,
            read: false,
            control: false,
            append: false,
        });
        this.wacAllowPublicForm = this.formBuilder.group({
            write: false,
            read: false,
            control: false,
            append: false,
        });
    }

    ngInit() {
    }

    ngAfterViewInit() {
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    get f() { return this.form.controls; }
    get fUser() { return this.wacAllowUserForm.controls; }
    get fPublic() { return this.wacAllowPublicForm.controls; }

    getSessionInfo(): void {
        this.solidAuthService.sessionInfo
        .pipe(
            takeUntil(this.ngUnsubscribe)
        )
        .subscribe(x => {
            this.sessionInfo = x;
            // this.onSessionChange(this.sessionInfo);
        });
    }

    async deleteNode() {
        const form = this.form.value;
        const webId = this.sessionInfo?.webId;
        const solidAccount = await this.solidProfileService.getSolidAccount();
        // this.logger.info(`NC: Unable to delete node: ${solidAccount}`);
        const node = form.node;
        if (undefined != webId) {
            const nodeUri = `${solidAccount}node/${form.node}`;
            this.logger.info(`NC: Delete node: ${nodeUri}`);
            await this.rdfService.deleteNode(nodeUri);
        } else {
            this.logger.info(`NC: Unable to delete node: ${node}`);
        }
        
    }

    async readNode() {
        this.triples = [];
        const form = this.form.value;
        const webId = this.sessionInfo?.webId;
        const solidAccount = await this.solidProfileService.getSolidAccount();
        // this.logger.info(`NC: Unable to delete node: ${solidAccount}`);
        const node = form.node;
        if (undefined != solidAccount && undefined != webId && undefined != node) {

            const nodeUri = this.getNodeUri(solidAccount, node);
            const turtle = await this.rdfService.readNode(nodeUri);
            if (turtle) {
                this.triples = await this.rdfService.parseTurtle(turtle, nodeUri, true);
                this.dataSourceTriples = new MatTableDataSource(this.triples);
                this.dataSourceTriples.sort = this.triplesSort;
            }
            const accessHeaders = await this.rdfService.getAccessHeaders(nodeUri);
            this.logger.info(`PHC: Access Headers: ${JSON.stringify(accessHeaders)}`);
            
            // Read acl url contents
            const aclUrl = accessHeaders?.aclUrl;
            if (undefined != aclUrl) {
                // await this.rdfService.loadResource(aclUrl);
                const aclAuthorizations = await this.rdfService.parseAclFromUrl(aclUrl);
                this.logger.info(`NC: acl authorizations: ${JSON.stringify(aclAuthorizations)}`);
                const aclAuthorizationTurtle = await this.rdfService.readNode(aclUrl);
                if (aclAuthorizationTurtle) {
                    
                    this.authorizations = await this.rdfService.parseTurtle(aclAuthorizationTurtle, aclUrl, true);
                    this.dataSourceAuthorizations = new MatTableDataSource(this.authorizations);
                    this.dataSourceAuthorizations.sort = this.authorizationsSort;
                }
                // this.logger.info(`PHC: Access Headers acl: ${JSON.stringify(aclAuthorizationTurtle)}`);
            }
            // await this.getAccessControlList(aclUrl, nodeUri);
            
            this.updateAccessControlList(accessHeaders);
        } else {
            this.logger.info(`NC: Unable to read node: ${node}`);
        }
        
    }
    
    private getNodeUri(solidAccount: string, node: string) {
        this.triples = [];
        this.authorizations = [];
        const re = new RegExp("^(?:https?:\/\/)", "igm");
        var isUri = re.test(node);
        let nodeUri = node;
        if (!isUri) {
            nodeUri = `${solidAccount}node/${node}`;
        }
        this.logger.info(`NC: Reading node: ${nodeUri}`);
        return nodeUri;
    }

    private async getAccessControlList(aclUrl: string | undefined, baseUri: string) {
        if (undefined != aclUrl) {
            const aclContents = await this.rdfService.readNode(aclUrl);
            // const turtle = await this.getResourceBody(this.url);
            if (aclContents) {
                this.aclContents = await this.rdfService.parseTurtle(aclContents, baseUri, true);
                // this.dataSource = new MatTableDataSource(this.triples);
                // this.dataSource.sort = this.sort;
            }
        }
    }

    updateAccessControlList(accessHeaders: AccessHeaders) {
        const userAcl = accessHeaders?.wacAllow?.user;
        this.fillAcl(this.wacAllowUserForm, userAcl);
        const publicAcl = accessHeaders?.wacAllow?.public;
        this.fillAcl(this.wacAllowPublicForm, publicAcl);
    }

    private fillAcl(form: FormGroup, acl: string[] | undefined) {
        form.setValue({
            write: acl?.includes('write'),
            read: acl?.includes('read'),
            append: acl?.includes('append'),
            control: acl?.includes('control'),
        });
    }

    async updateAcl() {
        // Get WAC
        const aclPublic = this.wacAllowPublicForm.value;
        const aclUser = this.wacAllowUserForm.value;
        const wacAllow: WacAllow = {
            user: this.fillWac(aclUser),
            public: this.fillWac(aclPublic),
        };
        this.logger.info(`NC: WAC allow: ${JSON.stringify(wacAllow)}`);

        // Get Node
        const form = this.form.value;
        const webId = this.sessionInfo?.webId;
        const solidAccount = await this.solidProfileService.getSolidAccount();
        // this.logger.info(`NC: Unable to delete node: ${solidAccount}`);
        const node = form.node;
        if (undefined != solidAccount && undefined != webId && undefined != node) {

            const nodeUri = this.getNodeUri(solidAccount, node);

            const agentAccess: AgentAccess = {
                webId: webId,
                read: true,
                write: true,
                append: true,
                control: true
            }

            const modes = this.fillModes(agentAccess);

            // const resourceUrl = 'https://tw01.stage.graphmetrix.net/node/t_iu';
            const aclAuthorization: AgentAuthorization = {
                accessTo: nodeUri,
                // subject: nodeUri,
                agentWebId: webId,
                // webId: 'https://tw02.stage.graphmetrix.net/i',
                modes: modes
            };
            
            await this.aclService.setAccess(aclAuthorization);
        }
        
    }

    async deleteAcl() {
        // Get Node
        const form = this.form.value;
        const webId = this.sessionInfo?.webId;
        const solidAccount = await this.solidProfileService.getSolidAccount();
        // this.logger.info(`NC: Unable to delete node: ${solidAccount}`);
        const node = form.node;
        if (undefined != solidAccount && undefined != webId && undefined != node) {

            const nodeUri = this.getNodeUri(solidAccount, node);

            const aclAuthorization: AgentAuthorization = {
                accessTo: nodeUri,
                // subject: nodeUri,
                agentWebId: webId,
                // webId: 'https://tw02.stage.graphmetrix.net/i',
            };
            
            await this.aclService.deleteAccess(aclAuthorization);
        }
        
    }

    fillModes(acl: any): string [] {
        let wac = [];
        if (acl.write) {
            wac.push('write');
        }
        if (acl.read) {
            wac.push('read');
        }
        if (acl.append) {
            wac.push('append');
        }
        if (acl.control) {
            wac.push('control');
        }
        return wac;
    }

    fillWac(acl: any): string [] {
        let wac = [];
        if (acl.write) {
            wac.push('write');
        }
        if (acl.read) {
            wac.push('read');
        }
        if (acl.append) {
            wac.push('append');
        }
        if (acl.control) {
            wac.push('control');
        }
        return wac;
    }


    applyFilterTriples(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.dataSourceTriples.filter = filterValue;
    }

    applyFilterAuthorizations(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.dataSourceAuthorizations.filter = filterValue;
    }

    handlePageEventTriples(e: PageEvent) {
        this.pageEventTriples = e;
        this.numberOfTriples = e.length;
        this.pageSizeTriples = e.pageSize;
        this.pageIndexTriples = e.pageIndex;
    }
    
    handlePageEventAuthorizations(e: PageEvent) {
        this.pageEventAuthorizations = e;
        this.numberOfAuthorizations = e.length;
        this.pageSizeAuthorizations = e.pageSize;
        this.pageIndexAuthorizations = e.pageIndex;
    }

    
}
