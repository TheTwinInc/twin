// import { NgFor } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProfile, IProfileImage } from '@app/interfaces';
import { LoggerService, RdfService, SolidAuthService, SolidProfileService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-profile-thumbnail-picker',
    // imports: [NgFor],
    templateUrl: './profile-thumbnail-picker.component.html',
    styleUrl: './profile-thumbnail-picker.component.css',
    standalone: true
})
export class ProfileThumbnailPickerComponent implements OnInit, OnDestroy {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();

    sessionInfo?: ISessionInfo | null;
    // images: string[] = [];
    images: IProfileImage[] = [];
    urlImages: string[] = [];
    selectedImage!: IProfileImage;
    // selectedImage: string | null = null;

    constructor(
        private rdfService: RdfService,
        private solidAuthService: SolidAuthService,
        private solidProfileService: SolidProfileService,
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
            const webId = sessionInfo.webId;
            const solidAccount = this.rdfService.getSolidAccount(webId);
            const folderUrl = `${solidAccount}home/images/`;
            // this.images = await this.rdfService.listImagesInFolder(folderUrl);
            const imagesInFolder = await this.rdfService.listImagesInFolder(folderUrl);
            for (let index = 0; index < imagesInFolder.length; index++) {
                const imageUrl = imagesInFolder[index];
                const blob = await this.rdfService.getBlobWithCredentials(imageUrl);
                const blobUrl = URL.createObjectURL(blob);
                this.images.push({
                    imageUrl: imageUrl,
                    blobUrl: blobUrl
                })
                // imagesInFolder
            }
            
            
            // for (let index = 0; index < this.urlImages.length; index++) {
            //     const image = this.urlImages[index];
            //     const blob = await this.rdfService.getImageWithCredentials(image);
            //     const imageUrl = URL.createObjectURL(blob);
            //     this.images.push(imageUrl);
            // }
            // const blob = await this.rdfService.getImageWithCredentials(url);
            // this.imageUrl = URL.createObjectURL(blob);
            
            this.logger.info(`PTP: Images: ${JSON.stringify(this.images)}`);
        }
    }

    selectImage(image: IProfileImage) {
        this.selectedImage = image;
    }
    // selectImage(imageUrl: string) {
    //     this.selectedImage = imageUrl;
    // }

    async setProfilePicture() {
        if (this.selectedImage) {
            if (undefined != this.sessionInfo?.webId) {
                const webId = this.sessionInfo.webId;
                const profile: IProfile = {
                    webId: webId,
                    img: this.selectedImage.imageUrl
                }
                await this.solidProfileService.upsertProfileImage(profile);
                // await this.rdfService.setProfileImage(webId, this.selected);
                // await this.rdfService.updateTriple(webId, this.selected);
                alert('Profile picture updated!');
            }
            
        }
    }
}
