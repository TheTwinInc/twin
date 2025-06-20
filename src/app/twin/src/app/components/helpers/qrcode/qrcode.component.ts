import { Component, Input, inject, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import * as QRCode from 'qrcode';
import { LoggerService } from '@app/services';

@Component({
    selector: 'app-qrcode',
    standalone: true,
    imports: [NgIf],
    templateUrl: './qrcode.component.html',
    styleUrl: './qrcode.component.css'
})
export class QrcodeComponent {
    @Input({ required: true }) webId!: string;

    qrData = signal<string | null>(null);

    constructor(
        private logger: LoggerService,
    ) { }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes['webId'] && this.webId) {
            try {
                const dataUrl = await QRCode.toDataURL(this.webId);
                this.qrData.set(dataUrl);
            } catch (err) {
                this.logger.error(`Failed to generate QR code: ${err}`);
                this.qrData.set(null);
            }
        }
    }

}

