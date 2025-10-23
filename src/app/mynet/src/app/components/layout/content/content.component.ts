import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
    selector: 'app-content',
    imports: [
        RouterOutlet,
        MatSidenavModule, 
        MatFormFieldModule,
        MatSelectModule, 
        MatButtonModule,
    ],
    templateUrl: './content.component.html',
    styleUrl: './content.component.css',
    standalone: true
})
export class ContentComponent {
    mode = 'side';

}
