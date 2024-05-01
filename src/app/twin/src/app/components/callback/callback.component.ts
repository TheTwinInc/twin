import { Component, OnInit } from '@angular/core';
import { AlarmService, SolidAccountService } from '@app/services'

@Component({
    selector: 'app-callback',
    standalone: true,
    imports: [],
    templateUrl: './callback.component.html',
    styleUrl: './callback.component.css'
})
export class CallbackComponent implements OnInit {
    constructor(
        private solidAuthService: SolidAccountService,
        private alarmService: AlarmService
    ) {
        // // redirect to home if already logged in
        // if (solidAuthService.) {
        //     this.router.navigate(['/']);
        // }
        // solidAuthService
    }

    ngOnInit() {
        this.alarmService.success('Connected to server', true);
        this.solidAuthService.handleRedirectAfterLogin();
    }
}
