import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';
import { UserService } from '../../users/data-access/user.service';
import { JsonPipe } from '@angular/common';

@Component({
  imports: [JsonPipe],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export default class Home {
  protected readonly auth = inject(AuthService);
  protected readonly userService = inject(UserService);

  protected readonly me = signal<unknown>(undefined);
  protected readonly timesQueried = signal(0);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const intervalId = setInterval(() => this.updateMe(), 1000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  private async updateMe() {
    if (this.auth.isAuthenticated()) {
      this.me.set(await this.userService.showMe());
      this.timesQueried.update((times) => times + 1);
    }
  }
}
