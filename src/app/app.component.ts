import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseLayoutComponent } from './layout/base-layout/base-layout.component';

@Component({
  selector: 'app-root',
  imports: [RouterModule, BaseLayoutComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class AppComponent {}
