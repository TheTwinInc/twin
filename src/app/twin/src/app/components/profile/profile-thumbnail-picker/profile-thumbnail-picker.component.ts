import { NgFor } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RdfService, SolidAuthService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-profile-thumbnail-picker',
    imports: [NgFor],
    templateUrl: './profile-thumbnail-picker.component.html',
    styleUrl: './profile-thumbnail-picker.component.css',
    standalone: true,
})
export class ProfileThumbnailPickerComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    
    sessionInfo?: ISessionInfo | null;
    images: string[] = [];
    selected: string | null = null;

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
            const webId = sessionInfo.webId;
            const folderUrl = 'https://uriser.stage.graphmetrix.net/public/images/';
            this.images = await this.rdfService.listImagesInFolder(folderUrl);
        }
    }

    selectImage(imageUrl: string) {
        this.selected = imageUrl;
    }

    async confirmSelection() {
        if (this.selected) {
            if (undefined != this.sessionInfo?.webId) {
                const webId = this.sessionInfo.webId;
                await this.rdfService.setProfileImage(webId, this.selected);
                alert('Profile picture updated!');
            }
            
        }
    }
}
