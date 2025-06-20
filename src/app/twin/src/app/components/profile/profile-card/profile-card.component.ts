import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ProfileData, RdfProfile } from '@app/interfaces';
import { RdfService, SolidAuthService } from '@app/services';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';
import { QrcodeComponent } from "../../helpers/qrcode/qrcode.component";

@Component({
    selector: 'app-profile-card',
    imports: [NgIf, QrcodeComponent],
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
            this.webId = sessionInfo.webId;
            try {
                const profile: RdfProfile = await this.rdfService.getProfileData(this.webId);
                this.name = profile.name ?? '';
                this.img = profile.img ?? '';
                this.org = profile.org ?? '';
                this.role = profile.role ?? '';
                this.vCardInfo = await this.rdfService.getVCardString(this.webId);
            } catch (err) {
                console.error('Error loading profile:', err);
                this.name = 'Error loading profile';
            }
        }
    }

    getVCardInfo() {
        return this.vCardInfo;
    }
}
