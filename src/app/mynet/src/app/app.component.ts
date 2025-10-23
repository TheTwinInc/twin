import { Component } from '@angular/core';
import { AppHomeComponent } from "@app/components";

@Component({
    selector: 'app-root',
    imports: [AppHomeComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    standalone: true
})
export class AppComponent {
    title = 'twin-app';
}
