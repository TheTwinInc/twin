import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';

describe('LogInComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
        imports: [LoginComponent, HttpClientTestingModule],
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
        
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
