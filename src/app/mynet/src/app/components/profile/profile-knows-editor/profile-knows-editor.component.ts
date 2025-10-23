import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ContactService, LoggerService, RdfService, SolidAuthService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
    selector: 'app-profile-knows-editor',
    imports: [
        CommonModule,
        FormsModule,
    ],
    templateUrl: './profile-knows-editor.component.html',
    styleUrl: './profile-knows-editor.component.css',
    standalone: true
})
export class ProfileKnowsEditorComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    
    sessionInfo?: ISessionInfo | null;
    myWebId = '';
    contactWebId = '';

    isReadOnlyUser: boolean = false;
    isAdminUser: boolean = true;

    constructor(
        private contactService: ContactService,
        private solidAuthService: SolidAuthService,
        private logger: LoggerService
    ) {}

    async ngOnInit() {
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
        
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            this.myWebId = sessionInfo.webId;
        }
    }

    async addContact() {
        try {
            if (this.myWebId && this.contactWebId) {
                await this.contactService.addContact(this.myWebId, this.contactWebId);
                this.contactWebId = '';
            }
        } catch (error: any) {
            this.logger.error(`Failed to add contact: ${error.message}`);
        }
    }
}
