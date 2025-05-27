import { Component, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormsModule, FormBuilder, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select'; 
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { SolidAuthService } from '@app/services';

@Component({
    selector: 'app-identity-provider-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule
    ],
    templateUrl: './identity-provider-dialog.component.html',
    styleUrl: './identity-provider-dialog.component.css'
})
export class IdentityProviderDialogComponent {
    form!: FormGroup;
    oidcIssuer!:string;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<IdentityProviderDialogComponent>
    )
    { }

    ngOnInit(): void {
        this.form = this.fb.group({
            oidcIssuer: ['', Validators.required]
        });
    }

    get f() { return this.form.controls; }

    getFieldControl(field: string): UntypedFormControl {
        return this.form.get(field) as UntypedFormControl;
    }

    save() {
        this.dialogRef.close(this.form.value);
    }

    close() {
        this.dialogRef.close();
    }
}

export function openIdentityProviderDialog(dialog: MatDialog) {

    const config = new MatDialogConfig();

    config.disableClose = true;
    config.autoFocus = true;
    config.panelClass = "modal-panel";
    config.backdropClass = "backdrop-modal-panel";

    const dialogRef = dialog.open(IdentityProviderDialogComponent, config);

    return dialogRef.afterClosed();
}
