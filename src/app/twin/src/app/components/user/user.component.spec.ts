import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';

import { UserComponent } from './user.component';

describe('UserComponent', () => {
    let component: UserComponent;
    let fixture: ComponentFixture<UserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                UserComponent,
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
        
        fixture = TestBed.createComponent(UserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
