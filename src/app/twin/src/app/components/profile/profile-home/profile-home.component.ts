import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LoggerService, SolidAuthService, SolidDataService, SolidProfileService } from '@app/services';
import { ISessionInfo, Session } from '@inrupt/solid-client-authn-browser';
import { FOAF } from '@inrupt/vocab-common-rdf';
import { Subject, takeUntil } from 'rxjs';
import { ProfileThumbnailPickerComponent, ProfileKnowsEditorComponent, ProfileKnowsListComponent, ProfileCardComponent } from "@app/components";

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ProfileThumbnailPickerComponent, ProfileKnowsEditorComponent, ProfileKnowsListComponent, ProfileCardComponent],
    templateUrl: './profile-home.component.html',
    styleUrl: './profile-home.component.css'
})
export class ProfileHomeComponent implements OnInit, OnDestroy {
    @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    
    form: FormGroup;
    message = '';
    editing = false;
    editingPicture = false;
    session!: Session;
    sessionInfo?: ISessionInfo | null;

    constructor(
        private fb: FormBuilder,
        private solidDataService: SolidDataService,
        private solidProfileService: SolidProfileService,
        private solidAuthService: SolidAuthService,
        private logger: LoggerService
    ) {
        this.form = this.fb.group({
            webId: [''],
            name: [''],
            email: [''],
            role: [''],
            org: [''],
            img: [''],
        });
    }

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
            await this.reloadProfile();
            this.exitEditing();
        }
    }

    async reloadProfile() {
        if (this.solidAuthService.isLoggedIn()) {
            const data = await this.solidProfileService.readProfile();
            if (data) {
                this.form.setValue(data);
            }
        }
    }

    async deleteProfileImage() {
        await this.solidProfileService.deleteProfileImage();
    }

    async save() {
        const profile = this.form.value;
        await this.solidProfileService.updateProfile(profile);
        this.exitEditing();
    }

    async onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const profile = this.form.value;
        // if (!input.files?.length) {
        if (undefined != input.files ) {
            const file = input.files[0];
            // const folder = prompt('Folder name?', 'images');
            // const filename = prompt('File name?', 'profile-photo.jpg');
            // const imagePath = `/public/${folder}/${filename}`;
            

            let profileUrl = this.solidProfileService.getProfileUrl(profile.webId);
            // const uploadUrl = profileUrl.replace('/profile/card', `/public/${filename}`);
            const fileName = file.name;
            const extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
            const filename = `profile-picture.${extension}`;
            const uploadUrl = profileUrl.replace('/profile/card', `/public/images/${filename}`);
            // const uploadUrl = profile.webId.concat(`${imagePath}`);
            
            const uploadResult = await this.solidProfileService.uploadImage(uploadUrl, file);

            if (uploadResult) {
                // profile.photo = uploadUrl;
                // await this.solid.updateProfile(this.profileDoc, this.webId, [
                // await this.solidProfileService.updateProfileImage(profile);
            }
            this.editing = false;
            // const uploadUrl = profileUrl.replace('/profile/card', `/home/images/oppstartshorn.JPG`);
            // profile.photo = uploadUrl;
            // await this.solidProfileService.updateProfilePicture(profile);
        }
        
        const data = await this.solidProfileService.readProfile();
        if (data) {
            this.form.setValue(data);
        }
        this.exitEditing();
    }

    exitEditing() {
        this.editing = false;
    }
}
