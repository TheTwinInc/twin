import { Injectable } from '@angular/core';
import { LogLevel } from '@app/models';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    logLevel: LogLevel = new LogLevel();
    
    constructor() {}
    
    info(msg: string): void {
        this.logWith(this.logLevel.Info, msg);
    }

    debug(msg: string): void {
        this.logWith(this.logLevel.Debug, msg);
    }
    
    warn(msg: string): void {
        this.logWith(this.logLevel.Warn, msg);
    }
    
    error(msg: string): void {
        this.logWith(this.logLevel.Error, msg);
    }
    
    private logWith(level: any, msg: string): void {
        if (level <= this.logLevel.Error) {
            switch (level) {
                case this.logLevel.None:
                    return console.log(msg);
                case this.logLevel.Info:
                    return console.info(msg);
                case this.logLevel.Debug:
                    return console.debug(msg);
                case this.logLevel.Warn:
                    return console.warn(msg);
                case this.logLevel.Error:
                    return console.error(msg);
                
            }
        }
    }
}
