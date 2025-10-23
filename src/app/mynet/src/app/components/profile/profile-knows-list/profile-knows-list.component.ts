import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoggerService, RdfService, ScreenService, SolidAuthService, SolidProfileService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';
import { ProfileKnowsEditorComponent } from "@app/components";
import { IContactProfile, IProfile } from '@app/interfaces';
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { ContactService } from '@app/services';
import { MatInputModule } from "@angular/material/input";
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-profile-knows-list',
    imports: [
        CommonModule,
        FormsModule,
        ProfileKnowsEditorComponent,
        MatIconModule,
        MatDividerModule,
        MatInputModule,
        MatSortModule,
        MatTableModule,
        MatCheckboxModule,
        MatPaginator
    ],
    templateUrl: './profile-knows-list.component.html',
    styleUrl: './profile-knows-list.component.css',
    standalone: true
})
export class ProfileKnowsListComponent implements OnInit, OnDestroy {
    @ViewChild('paginator') paginator!: MatPaginator;
    @ViewChild('contactTableSort') sort = new MatSort;

    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();

    sessionInfo?: ISessionInfo | null;
    isMobile?: boolean | null;
    hideMobile: boolean = false;
    webId = ''; // User's WebID, could be injected or passed in
    peopleIKnow: IContactProfile[] = [];
    loading = false;

    // user!: IUser | null;
    isReadOnlyUser: boolean = false;
    isAdminUser: boolean = true;
    enableAddContact: boolean = false;
    enableEditContacts: boolean = false;

    displayColumns: string[] = ['select', 'name', 'webId', 'actions'];
    // displayColumns: string[] = ['name', 'webId', 'actions'];
    displayColumnsMobile: string[] = ['name', 'actions'];
    dataSource!: MatTableDataSource<IContactProfile>;
    selection = new SelectionModel<IContactProfile>(true, []);

    numberOfContacts = 0;
    pageSize = 10;
    pageIndex = 0;
    pageSizeOptions = [5, 10, 15, 20, 25];

    hidePageSize = false;
    showPageSizeOptions = true;
    showFirstLastButtons = true;
    disabled = false;

    pageEvent: PageEvent | undefined;

    table = true;

    constructor(
        private rdfService: RdfService,
        private solidAuthService: SolidAuthService,
        private solidProfileService: SolidProfileService,
        private logger: LoggerService,
        private contactService: ContactService,
        private screenService: ScreenService
    ) {
        this.getSessionInfo();
        this.getContacts();
        this.getScreenSize();
    }

    ngOnInit(): void {
    }

    ngAfterViewInit() {
        this.dataSource.sort = this.sort;
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    getSessionInfo(): void {
        this.solidAuthService.sessionInfo
        .pipe(
            takeUntil(this.ngUnsubscribe)
        )
        .subscribe(x => {
            this.sessionInfo = x;
            this.onSessionChange(this.sessionInfo);
        });
    }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            this.webId = sessionInfo.webId;
            try {
                await this.reloadProfile();
                if(undefined != this.webId && '' != this.webId) {
                    this.contactService.getContacts(this.webId);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
                
        }
    }

    async reloadProfile(): Promise<void> {
        if (this.solidAuthService.isLoggedIn()) {
            const profile = await this.solidProfileService.getProfile();
            if (profile) {
                this.webId = profile.webId;
            }
        }
    }

    getContacts(): void {
        this.contactService.contacts
        .pipe(
            takeUntil(this.ngUnsubscribe),
        )
        .subscribe((contacts: IContactProfile[]) => {
            this.updateContacts(contacts);
        });
    }

    updateContacts(contacts: IContactProfile[]): void {
        this.numberOfContacts = contacts.length;
        this.dataSource = new MatTableDataSource(contacts);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
    }

    getScreenSize(): void {
        this.screenService.isMobile
        .pipe(
            takeUntil(this.ngUnsubscribe)
        )
        .subscribe(x => {
            // this.logger.info(`PKL: Is mobile: ${x}`);
            this.isMobile = x;
            this.logger.info(`PKL: Is mobile: ${this.isMobile}`);
            this.onScreenSizeUpdate();
        });
    }

    onScreenSizeUpdate() {
        if (this.isMobile) {
            this.hideMobile = true;
        } else {
            this.hideMobile = false;
        }
    }

    async removeContact(contact: IContactProfile) {
        if(contact) {
            this.logger.info(`PKL: Delete contact: ${JSON.stringify(contact)}`);
            await this.contactService.removeContact(this.webId, contact);
        }
    }
    
    toggleEditContacts() {
        this.enableEditContacts = !this.enableEditContacts;
    }

    async editContact(knownWebIdebId: string) {
        if(knownWebIdebId) {
            this.logger.info(`PKL: Edit contact: ${knownWebIdebId}`);
            // await this.rdfService.removeKnowsRelation(this.webId, knownWebIdebId);
        }
    }

    async sendMessageContact(knownWebIdebId: string) {
        if(knownWebIdebId) {
            this.logger.info(`PKL: Message contact: ${knownWebIdebId}`);
            // await this.rdfService.removeKnowsRelation(this.webId, knownWebIdebId);
        }
    }

    async callContact(knownWebIdebId: string) {
        if(knownWebIdebId) {
            this.logger.info(`PKL: Call contact: ${knownWebIdebId}`);
            // await this.rdfService.removeKnowsRelation(this.webId, knownWebIdebId);
        }
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.dataSource.filter = filterValue;
    }

    handlePageEvent(e: PageEvent) {
        this.pageEvent = e;
        this.numberOfContacts = e.length;
        this.pageSize = e.pageSize;
        this.pageIndex = e.pageIndex;
    }

    setPageSizeOptions(setPageSizeOptionsInput: string) {
        if (setPageSizeOptionsInput) {
            this.pageSizeOptions = setPageSizeOptionsInput.split(',').map(str => +str);
        }
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected == numRows;
    }
    
    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.dataSource.data.forEach(row => this.selection.select(row));
    }

    addContact() {
        // const newAirline: IContactProfile = {"code": "", "name": "", "location": ""};
        // this.editAirline(newAirline);
    }

    // removeAirline(airline: IContactProfile) {
    //     this.airlineService.removeAirline(airline);
    // }

    // removeSelectedAirlines() {
    //     this.logger.info(`AL: Selected airlines: ${JSON.stringify(this.selection.selected)}`);
    //     this.airlineService.removeAirlines(this.selection.selected);
    // }

    reloadContacts() {
        this.contactService.reloadContacts(this.webId);
    }
}
