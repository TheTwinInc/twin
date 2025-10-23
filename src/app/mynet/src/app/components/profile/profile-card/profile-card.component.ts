import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { IProfileData, IProfile } from '@app/interfaces';
import { LoggerService, RdfService, SolidAuthService, SolidProfileService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';
import { QrcodeComponent } from "@app/components";

@Component({
    selector: 'app-profile-card',
    imports: [QrcodeComponent],
    templateUrl: './profile-card.component.html',
    styleUrl: './profile-card.component.css',
    standalone: true
})
export class ProfileCardComponent {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();

    sessionInfo?: ISessionInfo | null;
    webId = ''; // User's WebID, could be injected or passed in
    name = 'Loading...';
    img: string | null = null;
    org: string | null = null;
    role: string | null = null;
    vCardInfo: string | null = null;

    constructor(
        // private rdfService: RdfService,
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
            this.webId = sessionInfo.webId;
            try {
                // const profile: IProfile = await this.rdfService.getProfileData(this.webId);
                const profile: IProfile | null = await this.solidProfileService.getProfile();
                if (undefined != profile) {
                    this.name = profile.name ?? '';
                    this.img = profile.img ?? '';
                    this.org = profile.org ?? '';
                    this.role = profile.role ?? '';
                    this.vCardInfo = await this.solidProfileService.getVCardString(this.webId);
                }
            } catch (error) {
                this.logger.error(`Error loading profile: ${error}`, );
                this.name = 'Error loading profile';
            }
        }
    }

    getVCardInfo() {
        return this.vCardInfo;
    }
}
