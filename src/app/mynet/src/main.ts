import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from '@app/app.component';
import { APP_ROUTES } from '@app/routes/app.routes';

bootstrapApplication(AppComponent, {
    providers: [
        provideRouter(APP_ROUTES),
        provideHttpClient(
            withInterceptors([ ])
        ),
        provideAnimations(),
        // provideForms()
    ]
});
// import { enableProdMode } from '@angular/core';
// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// import { bootstrapApplication } from '@angular/platform-browser';
// // import { appConfig } from './app/app.config';
// import { AppComponent } from './app/app.component';

// import { AppModule } from './app/app.module';
// import { environment } from './environments/environment';

// // bootstrapApplication(AppComponent, appConfig)
// //   .catch((err) => console.error(err));

// if (environment.production) {
//     enableProdMode();
// }

// platformBrowserDynamic().bootstrapModule(AppModule)
//     .catch(err => console.error(err));