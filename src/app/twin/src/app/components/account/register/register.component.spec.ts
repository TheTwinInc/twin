import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                RegisterComponent,
                HttpClientTestingModule
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: {
                                id: 1,
                            },
                        },
                    },
                },
            ]
        })
        .compileComponents();
        
        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
