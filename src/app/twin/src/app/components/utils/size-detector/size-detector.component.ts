import { NgFor } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener } from '@angular/core';
import { SCREEN_SIZE } from '@app/config';
import { LoggerService, ScreenService } from '@app/services';
import { Platform } from '@angular/cdk/platform';

@Component({
    selector: 'app-size-detector',
    // imports: [],
    imports: [NgFor],
    templateUrl: './size-detector.component.html',
    styleUrl: './size-detector.component.css'
})
export class SizeDetectorComponent implements AfterViewInit {
    windowWidth!: number;
    windowHeight!: number;
    isMobile!: boolean;
    prefix = 'is-';
    sizes = [
        {
            id: SCREEN_SIZE.XS, name: 'xs',
            css: `d-block d-sm-none`
        },
        {
            id: SCREEN_SIZE.SM, name: 'sm',
            css: `d-none d-sm-block d-md-none`
        },
        {
            id: SCREEN_SIZE.MD, name: 'md',
            css: `d-none d-md-block d-lg-none`
        },
        {
            id: SCREEN_SIZE.LG, name: 'lg',
            css: `d-none d-lg-block d-xl-none`
        },
        {
            id: SCREEN_SIZE.XL, name: 'xl',
            css: `d-none d-xl-block`
        },
    ];

    constructor(
        private elementRef: ElementRef,
        private screenService: ScreenService,
        private logger: LoggerService,
        private platform: Platform
    ) {
        // this.updateWindowSize(); // Get initial size
    }
    
    @HostListener("window:resize", [])
    private onResize() {
        this.updateWindowSize();
        // this.detectScreenSize();
    }

    // @HostListener('window:resize', ['$event'])
    // onResize(event: any) {
    //     this.updateWindowSize();
    //     this.detectScreenSize();
    // }

    ngAfterViewInit() {
        this.detectScreenSize();
        this.updateWindowSize();
    }

    updateWindowSize() {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;

        // Example: Set isMobile based on width
        this.isMobile = this.windowWidth < 768; // Adjust breakpoint as needed
        this.logger.info(`SDC: ${JSON.stringify(this.isMobile)}`);
        this.logger.info(`SDC: ${JSON.stringify(this.platform)}`);
    }

    private detectScreenSize() {
        const currentSize = this.sizes.find(x => {
            const el = this.elementRef.nativeElement.querySelector(`.${this.prefix}${x.id}`);
            const isVisible = window.getComputedStyle(el).display != 'none';

            return isVisible;
        });

        if (undefined != currentSize) {
            this.screenService.onResize(currentSize.id);
        }
    }

}
