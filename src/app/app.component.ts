import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { BaseLayoutComponent } from "./layout/base-layout/base-layout.component";

@Component({
  selector: 'app-root',
  imports: [RouterModule, BaseLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor() {
    console.log('ENV:', environment);
  }
}
