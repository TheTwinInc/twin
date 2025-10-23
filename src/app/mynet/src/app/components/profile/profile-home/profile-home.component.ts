import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccessControlListService, LoggerService, RdfService, SolidAuthService, SolidDataService, SolidProfileService } from '@app/services';
import { ISessionInfo, Session } from '@inrupt/solid-client-authn-browser';
import { FOAF } from '@inrupt/vocab-common-rdf';
import { Subject, takeUntil } from 'rxjs';
import { ProfileThumbnailPickerComponent, ProfileKnowsEditorComponent, ProfileKnowsListComponent, ProfileCardComponent } from "@app/components";
// import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';
import { AccessHeaders, AgentAccess, IProfile } from '@app/interfaces';

@Component({
    selector: 'app-profile',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatInputModule,
        ProfileThumbnailPickerComponent
    ],
    // imports: [CommonModule, ReactiveFormsModule, ProfileThumbnailPickerComponent, ProfileKnowsEditorComponent, ProfileKnowsListComponent, ProfileCardComponent],
    templateUrl: './profile-home.component.html',
    styleUrl: './profile-home.component.css',
    standalone: true
})
export class ProfileHomeComponent implements OnInit, OnDestroy {
    @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    
    form!: FormGroup;
    initialValue: any;
    changedValues: any = {};
    changedKeys: string[] = [];
    message = '';

    isReadOnlyUser: boolean = false;
    isAdminUser: boolean = true;
    loading: boolean = false;
    editing: boolean = false;
    saved: boolean = false;
    editingPicture: boolean = false;
    
    session!: Session;
    sessionInfo?: ISessionInfo | null;

    constructor(
        // private fb: FormBuilder,
        private formBuilder: FormBuilder,
        private solidDataService: SolidDataService,
        private solidProfileService: SolidProfileService,
        private solidAuthService: SolidAuthService,
        private aclService: AccessControlListService,
        private rdfService: RdfService,
        private logger: LoggerService
    ) {
        this.getSessionInfo();
        this.form = this.formBuilder.group({
            webId: [''],
            name: [''],
            email: [''],
            role: [''],
            org: [''],
            img: [''],
            phone: [''],
        });
    }

    ngOnInit():void {
        // Subscribe to value changes
        this.form.valueChanges.subscribe(values => {
            this.changedValues = this.getChangedValues(this.initialValue, values);
            this.changedKeys = this.getChangedKeys(this.initialValue, values);
        });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

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

    // onSessionChange (sessionInfo: any) {
    //     if (sessionInfo?.isLoggedIn) {
    //         this.webId = sessionInfo.webId;
    //     }
    // }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            await this.reloadProfile();
            this.exitEditing();
        }
    }

    async reloadProfile() {
        if (this.solidAuthService.isLoggedIn()) {
            const profile = await this.solidProfileService.getProfile();
            await this.getAccessControl(profile);
            
            if (profile) {
                this.form.setValue(profile);
                // Store initial values
                this.initialValue = this.form.getRawValue();
            }
        }
    }

    /** Get Acces Control */
    async getAccessControl(profile: IProfile | null): Promise<AccessHeaders | null> {
        let accessHeaders = null;
        if (undefined != profile?.webId) {
            const profileUrl = this.solidProfileService.getProfileUrl(profile?.webId);
            if (undefined != profileUrl) {
                
                accessHeaders = await this.rdfService.getAccessHeaders(profileUrl);
                this.logger.info(`PHC: Access Headers: ${JSON.stringify(accessHeaders)}`);
                // if (undefined != accessHeaders.aclUrl) {
                //     const accessControl = await this.aclService.getAccess(accessHeaders.aclUrl, profile?.webId);
                //     this.logger.info(`PHC: Access Control: ${JSON.stringify(accessControl)}`);    
                // }
            }
        }
        return accessHeaders;
    }
    // async getAccess(profile: IProfile | null) {
    //     if (undefined != profile?.webId) {
    //         const profileUrl = this.solidProfileService.getProfileUrl(profile?.webId);
    //         if (undefined != profileUrl) {
    //             const access = await this.aclService.getAccess(profileUrl, profile?.webId);
    //             this.logger.info(`PHC: Access: ${access}`);
    //         }
    //     }
    // }

    /** Compare current values with the initial ones */
    private getChangedValues(initial: any, current: any): any {
        const changed: any = {};
        if (undefined != initial) {
            Object.keys(current).forEach(key => {
            if (current[key] !== initial[key]) {
                changed[key] = {
                    from: initial[key],
                    to: current[key]
                };
            }
        });
        }
        return changed;
    }

    private getChangedKeys(initial: any, current: any): string[] {
        let changed: string[] = [];
        if (undefined != initial) {
            Object.keys(current).forEach(key => {
                if (current[key] !== initial[key]) {
                    changed.push(key)
                }
            });
        }
        return changed;
    }

    async deleteProfileImage() {
        await this.solidProfileService.deleteProfileImage();
    }

    async save() {
        const profile = this.form.value;
        // const selected: string[] = [];
        const selected = this.changedKeys;
        // await this.solidProfileService.updateProfile(profile);
        await this.solidProfileService.updateProfileSelected(profile, selected);
        // this.logger.info(`PHC: Changed values: ${JSON.stringify(this.changedValues)}`);
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
            
            if (null != profileUrl) {
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
            }
                
            this.editing = false;
            // const uploadUrl = profileUrl.replace('/profile/card', `/home/images/oppstartshorn.JPG`);
            // profile.photo = uploadUrl;
            // await this.solidProfileService.updateProfilePicture(profile);
        }
        
        const data = await this.solidProfileService.getProfile();
        if (data) {
            this.form.setValue(data);
        }
        this.exitEditing();
    }

    exitEditing() {
        this.editing = false;
    }

    toggleEditProfile() {
        this.editing = !this.editing;
    }
}
