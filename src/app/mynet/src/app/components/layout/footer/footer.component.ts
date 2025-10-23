import { Component } from '@angular/core';
import { AlarmComponent } from '@app/components';

@Component({
    selector: 'footer',
    imports: [AlarmComponent],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css',
    standalone: true
})
export class FooterComponent {

}
