import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LogLevel } from '@app/models';
import { AppConfigService } from '@app/services';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    logLevel: LogLevel = new LogLevel();

    serverLogUri!: string;

    httpOptions = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };

    httpPayloadOptions = {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
    };
    
    constructor(
        private http: HttpClient,
    ) {}
    
    info(msg: any): void {
        this.logWith(this.logLevel.Info, msg);
    }

    debug(msg: any): void {
        this.logWith(this.logLevel.Debug, msg);
    }
    
    warn(msg: any): void {
        this.logWith(this.logLevel.Warn, msg);
    }
    
    error(msg: any): void {
        this.logWith(this.logLevel.Error, msg);
    }
    
    private logWith(level: any, msg: any): void {
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

    private sendToServer(level: string, message: string) {
        const uri = `${AppConfigService.settings.apiUrl}/api/logs`;

        let payload = new URLSearchParams();
        payload.set('logEntry', message);

        this.http.post<any>(uri, payload, this.httpPayloadOptions)
        .pipe(
            catchError(this.handleError<void>())
        );
        // .subscribe();
    }
    
    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            error(`${operation} failed: ${error.message}`);
        
            // Let the app keep running by returning an empty result.
            return of(result as T);
        };
    }
}
