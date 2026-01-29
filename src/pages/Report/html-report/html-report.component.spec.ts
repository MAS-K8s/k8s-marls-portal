import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlReportComponent } from './html-report.component';

describe('HtmlReportComponent', () => {
  let component: HtmlReportComponent;
  let fixture: ComponentFixture<HtmlReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HtmlReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HtmlReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
