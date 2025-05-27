import { Component } from '@angular/core';
import { NavTreeComponent } from "../nav-tree/nav-tree.component";
// import { AlarmComponent } from '../../components/alarm/alarm.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NavTreeComponent],
  // imports: [AlarmComponent],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css'
})
export class AppSidebarComponent {

}
