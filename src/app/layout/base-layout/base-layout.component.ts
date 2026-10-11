import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeaderComponent } from '../../shared/component/header/header.component';

@Component({
  selector: 'app-base-layout',
  imports: [RouterModule, HeaderComponent],
  templateUrl: './base-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './base-layout.component.css'
})
export class BaseLayoutComponent {
  private readonly router = inject(Router);
  readonly showHeader = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.hasStaffHeader(event.urlAfterRedirects)),
    ),
    { initialValue: this.hasStaffHeader(this.router.url) },
  );

  private hasStaffHeader(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0];
    return ['/dashboard', '/book', '/person', '/loan', '/reservation'].some(
      route => path === route || path.startsWith(`${route}/`),
    );
  }
}
