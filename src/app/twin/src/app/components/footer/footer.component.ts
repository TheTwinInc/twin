import { Component } from '@angular/core';
import { AlarmComponent } from '../../components/alarm/alarm.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [AlarmComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

}
