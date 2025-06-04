import { Component } from '@angular/core';
import { AppHomeComponent } from "@app/components";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [AppHomeComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'twin-app';
}
