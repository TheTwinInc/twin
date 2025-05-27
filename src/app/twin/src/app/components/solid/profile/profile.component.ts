import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SolidAuthService, SolidDataService, SolidProfileService } from '@app/services';
import { Session } from '@inrupt/solid-client-authn-browser';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent {
    form: FormGroup;
    message = '';
    editing = false;
    session!: Session;

    constructor(
        private fb: FormBuilder,
        private solidDataService: SolidDataService,
        private solidProfileService: SolidProfileService,
        private solidAuthService: SolidAuthService
    ) {
        this.form = this.fb.group({
        name: [''],
        email: [''],
        });
    }

    async ngOnInit() {
        this.session = this.solidAuthService.getDefaultSession();
        if (this.solidAuthService.isLoggedIn()) {
            const data = await this.solidProfileService.readProfile();
            if (data) {
                this.form.setValue(data);
            }
        }
    }

    async save() {
        const { name, email } = this.form.value;
        await this.solidProfileService.updateProfile(name, email);
        this.editing = false;
    }
}
