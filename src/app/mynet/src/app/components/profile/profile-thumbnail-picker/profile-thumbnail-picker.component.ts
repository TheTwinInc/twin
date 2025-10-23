import { NgFor } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProfile } from '@app/interfaces';
import { RdfService, SolidAuthService, SolidProfileService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-profile-thumbnail-picker',
    imports: [NgFor],
    templateUrl: './profile-thumbnail-picker.component.html',
    styleUrl: './profile-thumbnail-picker.component.css',
    standalone: true
})
export class ProfileThumbnailPickerComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    
    sessionInfo?: ISessionInfo | null;
    images: string[] = [];
    selectedImage: string | null = null;

    constructor(
        private rdfService: RdfService,
        private solidAuthService: SolidAuthService,
        private solidProfileService: SolidProfileService,
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
            const solidAccount = this.rdfService.getSolidAccount(webId);
            // const folderUrl = `${solidAccount}public/images/`;
            // this.images = await this.rdfService.listImagesInFolder(folderUrl);
        }
    }

    selectImage(imageUrl: string) {
        this.selectedImage = imageUrl;
    }

    async confirmSelection() {
        if (this.selectedImage) {
            if (undefined != this.sessionInfo?.webId) {
                const webId = this.sessionInfo.webId;
                const profile: IProfile = {
                    webId: webId,
                    img: this.selectedImage
                }
                await this.solidProfileService.upsertProfileImage(profile);
                // await this.rdfService.setProfileImage(webId, this.selected);
                // await this.rdfService.updateTriple(webId, this.selected);
                alert('Profile picture updated!');
            }
            
        }
    }
}
