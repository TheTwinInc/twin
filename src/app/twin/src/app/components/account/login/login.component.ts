import { Component, OnInit } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { filter, first } from 'rxjs/operators';
import { openIdentityProviderDialog } from '@app/components';

import { AccountService, AlarmService, LoggerService } from '@app/services'
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, NgClass, NgIf, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
    standalone: true
})
export class LoginComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alarmService: AlarmService,
        private dialog: MatDialog,
        private logger: LoggerService,
    ) {
        // redirect to home if already logged in
        if (this.accountService.userValue) {
            this.router.navigate(['/']);
        }
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        this.alarmService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        this.accountService.login(this.f.username.value, this.f.password.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    // get return url from query parameters or default to home page
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                    this.router.navigateByUrl(returnUrl);
                },
                error: error => {
                    this.alarmService.error(error);
                    this.loading = false;
                }
            });
    }

    chooseIdentityProvider() {
        openIdentityProviderDialog(this.dialog)
        .pipe(
            filter((val: any) => !!val)
        )
        .subscribe(
            (val: any) => {
                this.logger.info(`LC: Identity provider: ${JSON.stringify(val)}`);
            }
        );
    }
}
