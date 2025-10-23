import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    constructor(
        
    ) { }

    /*
        *  Set item in local storage
        */
    setItem(itemName:string, item:any) {
        localStorage.setItem(itemName, JSON.stringify(item));
    }

    /*
    *  Remove item from local storage
    */
    removeItem(itemName:string) {
        localStorage.removeItem(itemName);
    }

    
}
