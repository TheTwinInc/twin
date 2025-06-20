import { NgFor } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RdfService, SolidAuthService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
    selector: 'app-profile-knows-editor',
    imports: [
        NgFor,
        FormsModule,
        // ReactiveFormsModule,
    ],
    // imports: [NgFor],
    templateUrl: './profile-knows-editor.component.html',
    styleUrl: './profile-knows-editor.component.css',
    standalone: true
})
export class ProfileKnowsEditorComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    
    sessionInfo?: ISessionInfo | null;
    myWebId = ''; // User's WebID, could be injected or passed in
    newFriendWebId = '';
    knownPeople: string[] = [];

    constructor(
        private rdfService: RdfService,
        private solidAuthService: SolidAuthService,
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

    async addFriend() {
        try {
            if (this.myWebId && this.newFriendWebId) {
                await this.rdfService.addKnowsRelation(this.myWebId, this.newFriendWebId);
                this.knownPeople.push(this.newFriendWebId);
                this.newFriendWebId = '';
            }
        } catch (error: any) {
            alert(`Failed to add friend: ${error.message}`);
        }
    }
}
