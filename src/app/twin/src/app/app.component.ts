import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent, FooterComponent, AppSidebarComponent, NavComponent, NavTreeComponent } from '@app/components';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        HeaderComponent,
        FooterComponent,
        AppSidebarComponent,
        NavComponent,
        NavTreeComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'twin-app';
}
