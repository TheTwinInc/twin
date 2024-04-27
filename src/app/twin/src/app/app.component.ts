import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
// import { AlarmComponent, HeaderComponent, FooterComponent, AppSidebarComponent } from './components';
import { HeaderComponent, FooterComponent, AppSidebarComponent } from './components';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        NgIf,
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        // AlarmComponent,
        HeaderComponent,
        FooterComponent,
        AppSidebarComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'twin-app';
}
