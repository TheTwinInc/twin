import { Component } from '@angular/core';
import { AlarmComponent } from '@app/components';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [AlarmComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

}
