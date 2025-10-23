import { HostListener, Injectable } from '@angular/core';
import { SCREEN_SIZE } from '@app/config';
import { BehaviorSubject, distinctUntilChanged, Observable, Subject } from 'rxjs';
import { LoggerService } from './logger.service';


@Injectable({
    providedIn: 'root'
})
export class ScreenService {
    private screenSizeSubject: BehaviorSubject<any | null>;
    public screenSize: Observable<any | null>;

    private isMobileSubject: BehaviorSubject<boolean>;
    public isMobile: Observable<boolean>;

    private isMobileSizesid = [SCREEN_SIZE.XS, SCREEN_SIZE.SM];

    constructor(
        private logger: LoggerService,
    ) {
        this.screenSizeSubject = new BehaviorSubject(null);
        this.screenSize = this.screenSizeSubject.asObservable();

        this.isMobileSubject = new BehaviorSubject(false);
        this.isMobile = this.isMobileSubject.asObservable();
    }

    onResize(screenSizeId: number) {
        let width = window.innerWidth;
        this.screenSizeSubject.next(width);
        // this.logger.info(`SS: Change size: ${width}, ${screenSizeId}`);

        const isMobile = this.isMobileDetector(screenSizeId);
        this.isMobileSubject.next(isMobile);
        // this.logger.info(`SS: Is mobile: ${isMobile}`);
        // this.logger.info(`SS: Agent: ${window.navigator.userAgent}`);
    }

    isMobileDetector(screenSizeId: number): boolean {
        let isMobile = false;
        if (this.isMobileSizesid.includes(screenSizeId)) {
            isMobile = true;
        }
        return isMobile;
    }
}
