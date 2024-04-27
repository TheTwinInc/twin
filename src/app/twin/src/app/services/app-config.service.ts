import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { IAppSettings } from '../interfaces/app-settings';

const SETTINGS_LOCATION = `assets/config/config.${environment.name}.json`;
const SETTINGS_KEY = "configuration";

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {

    static settings: IAppSettings;
    constructor(private http: HttpClient) {}

    load() {
        return new Promise<void>((resolve, reject) => {
            firstValueFrom(this.http.get<IAppSettings>(SETTINGS_LOCATION))
            .then( (response : IAppSettings) => {
                AppConfigService.settings = <IAppSettings>response;
                resolve();
            }).catch(this.handleErrors);
            
        });
    }
  
    getSettings(): Observable<any> {
        return this.http.get(SETTINGS_LOCATION)
    }

    // saveSettings(settings: IAppSettings) {
    //   localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // }

    // deleteSettings(): void {
    //   localStorage.removeItem(SETTINGS_KEY);
    // }

    private handleErrors(error: any): void {
        // Log the error to the console
        switch (error.status) {
        case 404:
            console.error("Can't find file: " + SETTINGS_LOCATION);
            break;
        default:
            console.error(error);
            break;
        }
    }
}
