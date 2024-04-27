import { Component, OnInit } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlarmService } from '@app/services'

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass, NgIf, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitted = false;
    // error?: string;
    // success?: string;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alarmService: AlarmService
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

        // show success message after registration
        // if (this.route.snapshot.queryParams.registered) {
        //     this.success = 'Registration successful';
        // }
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alert on submit
        // this.error = '';
        // this.success = '';
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
                    // this.error = error;
                    this.loading = false;
                }
            });
    }
}
