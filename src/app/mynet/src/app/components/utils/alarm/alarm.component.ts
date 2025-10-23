import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';

import { AlarmService } from '@app/services';

@Component({
    selector: 'app-alarm',
    imports: [NgIf, NgClass],
    templateUrl: './alarm.component.html',
    styleUrl: './alarm.component.css',
    standalone: true
})
export class AlarmComponent implements OnInit, OnDestroy {
    private subscription!: Subscription;
    alarm: any;

    constructor(private alarmService: AlarmService) { }

    ngOnInit() {
        this.subscription = this.alarmService.onAlert()
            .subscribe(alarm => {
                switch (alarm?.type) {
                    case 'success':
                        alarm.cssClass = 'alarm alarm-success';
                        break;
                    case 'error':
                        alarm.cssClass = 'alarm alarm-danger';
                        break;
                }

                this.alarm = alarm;
            });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
