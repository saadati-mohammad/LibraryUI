import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/component/header/header.component';

@Component({
  selector: 'app-base-layout',
  imports: [RouterModule, HeaderComponent],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.css'
})
export class BaseLayoutComponent {

}
