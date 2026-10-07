import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseLayoutComponent } from './layout/base-layout/base-layout.component';

@Component({
  selector: 'app-root',
  imports: [RouterModule, BaseLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // The previous constructor logged the whole `environment` object on every load,
  // which needlessly leaked build/runtime configuration to the browser console.
}
