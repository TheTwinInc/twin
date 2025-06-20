import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoggerService, RdfService, SolidAuthService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';
import { ProfileKnowsEditorComponent } from "@app/components";
import { FriendProfile } from '@app/interfaces';

@Component({
    selector: 'app-profile-knows-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ProfileKnowsEditorComponent],
    templateUrl: './profile-knows-list.component.html',
    styleUrl: './profile-knows-list.component.css'
})
export class ProfileKnowsListComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();

    sessionInfo?: ISessionInfo | null;
    webId = ''; // User's WebID, could be injected or passed in
    peopleIKnow: FriendProfile[] = [];
    loading = false;

    constructor(
            private rdfService: RdfService,
            private solidAuthService: SolidAuthService,
            private logger: LoggerService
        ) {}

    // ngOnInit(): void {
    //     if (this.webId) this.loadFriends();
    // }

    async ngOnInit() {
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                this.onSessionChange(this.sessionInfo);
            });
        // this.loadContacts();
        
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            this.webId = sessionInfo.webId;
            this.loadContacts(this.webId);
        }
    }

    async loadContacts(webId: string) {
        if (webId) {
            this.loading = true;
            this.peopleIKnow = await this.rdfService.getContacts(this.webId);
            this.logger.info(`PKL: ${JSON.stringify(this.peopleIKnow)}`)
            this.loading = false;
        }
    }
}
