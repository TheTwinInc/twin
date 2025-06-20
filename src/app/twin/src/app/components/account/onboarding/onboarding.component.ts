import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AccountService, LoggerService, SolidAuthService, SolidDataService } from '@app/services';
import { User } from '@app/models';
import { ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { Subject, takeUntil } from 'rxjs';
// import { SolidAuthService } from '@services/solid-auth.service';

@Component({
    selector: 'app-onboarding',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './onboarding.component.html',
    styleUrl: './onboarding.component.css',
    standalone: true
})
export class OnboardingComponent implements OnInit {
    private readonly ngUnsubscribe: Subject<any> = new Subject<any>();
    sessionInfo?: ISessionInfo | null;
    form: FormGroup;
    profile: { name: string; email: string } | null = null;
    message = '';
    loggedIn = false;
    webId: string;
    

    constructor(
        private fb: FormBuilder,
        private solidAuthService: SolidAuthService,
        private solidDataService: SolidDataService,
        private logger: LoggerService,
    ) {
        this.form = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
        });
        this.loggedIn = this.solidAuthService.isLoggedIn();
        this.webId = this.solidAuthService.getWebId();
    }

    async ngOnInit() {
        this.solidAuthService.sessionInfo
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(x => {
                this.sessionInfo = x;
                // this.onSessionChange(this.sessionInfo);
            });
        if (this.solidAuthService.isLoggedIn()) {
            // this.profile = await this.solidAuthService.loadProfileData();
        }
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.unsubscribe();
    }

    async onSessionChange (sessionInfo: any) {
        if (sessionInfo?.isLoggedIn) {
            // let pods = await this.solidDataService.getAllPods(sessionInfo.webId);
            // this.logger.info(`PODS: ${JSON.stringify(pods)}`);
            // let dataSet = await this.solidDataService.getDataset("https://thetwin.stage.graphmetrix.net/");
            // this.logger.info(`DATASET: ${JSON.stringify(dataSet)}`);
        }
        //  else {
        //     // this.router.navigate(['account/callback']);
        // }
    }

    async login() {
        // const issuer = 'https://broker.pod.inrupt.com';
        // await this.solidAuth.login(issuer, window.location.href);
        const issuer = "https://stage.graphmetrix.net";
        await this.solidAuthService.solidLogin(issuer);
    }

    async onSubmit() {
        if (this.form.valid) {
            const { name, email } = this.form.value;
            try {
                // await this.solidAuthService.saveProfile(name, email);
                this.logger.info('Profile saved to your Solid Pod!');
                this.profile = { name, email };
            } catch (err) {
                this.logger.error(`Failed to save profile: ${err}`);
            }
        }
    }
}
