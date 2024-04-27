import { APP_INITIALIZER } from '@angular/core';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS  } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { NgMaterialModule } from './modules/ng-material.module';
import { AppRoutingModule } from './modules/app-routing.module.DELETE';
import { AppComponent } from './app.component';
import { AppHomeComponent } from './components/app-home/app-home.component';
import { AppSidebarComponent } from './components/app-sidebar/app-sidebar.component';
// import { AppConfigService } from './services/app-config.service';
import { AppConfigService } from './services';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AlarmComponent } from './components/alarm/alarm.component';
// import { UserComponent } from './components/user/user.component';
// import { UsersListComponent } from './components/users-list/users-list.component';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';



import { JwtInterceptor, ErrorInterceptor } from './helpers';
import { fakeBackendProvider } from './helpers';

export function initializeApp(appConfig: AppConfigService) {
    return () => appConfig.load();
}


@NgModule({
    declarations: [
        AppComponent,
        AppHomeComponent,
        FooterComponent,
        HeaderComponent,
        AppSidebarComponent,
        LoginComponent,
        RegisterComponent,
        AlarmComponent,
        // UserComponent,
        // UsersListComponenSt,
    ],
    imports: [
        BrowserModule,
        CommonModule,
        HttpClientModule,
        AppRoutingModule,
        NgMaterialModule,
        ReactiveFormsModule,
    ],
    providers: [
        AppConfigService,
        { 
            provide: APP_INITIALIZER,
            useFactory: initializeApp,
            deps: [AppConfigService],
            multi: true
        },
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        fakeBackendProvider
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
