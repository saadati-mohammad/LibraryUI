import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BookService } from './core/service/book.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'LibraryUI';
  constructor(private bookService: BookService) {}
  getBooks(){
    this.bookService.getBookList().subscribe((res: any)=>{console.log(res)})
  }
}
