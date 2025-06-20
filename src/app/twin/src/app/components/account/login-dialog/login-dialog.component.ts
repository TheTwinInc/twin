import { Component } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialogModule, MatDialogRef, MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormBuilder, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { AccountService, AlarmService, SolidAuthService } from '@app/services';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-login-dialog',
    imports: [
        ReactiveFormsModule,
        // NgClass,
        // NgIf,
        // RouterLink,
        MatDialogModule,
        MatFormFieldModule,
    ],
    templateUrl: './login-dialog.component.html',
    styleUrl: './login-dialog.component.css',
    standalone: true
})
export class LoginDialogComponent {
    form!: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private solidService: SolidAuthService,
        private alarmService: AlarmService,
        private dialogRef: MatDialogRef<LoginDialogComponent>
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
        // this.solidAuthService.solidLogin();
        
        // this.solidAuthService.solidLoginPopup();
        
    }

    // login() {
    //     this.solidService.solidLogin();
    // }

    save() {
        this.dialogRef.close();
    }

    close() {
        this.dialogRef.close();
    }
}

// export function openEditFlightDialog(dialog: MatDialog, flight:IDepartureFlight) {
export function openLoginDialog(dialog: MatDialog) {

    const config = new MatDialogConfig();

    config.disableClose = true;
    config.autoFocus = true;
    config.panelClass = "modal-panel";
    config.backdropClass = "backdrop-modal-panel";

    // config.data = {
    //     ...flight
    // };

    const dialogRef = dialog.open(LoginDialogComponent, config);

    return dialogRef.afterClosed();
}
