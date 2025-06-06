import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { BookService } from './core/service/book.service';
import { BaseLayoutComponent } from "./layout/base-layout/base-layout.component";

@Component({
  selector: 'app-root',
  imports: [RouterModule, BaseLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'LibraryUI';
  constructor(private bookService: BookService) {}
}
