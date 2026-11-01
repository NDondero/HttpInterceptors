import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Service()
export class UserService {
  private readonly http = inject(HttpClient);
  private apiUrl = '/api/usuarios';
  async showMe() {
    const me = await firstValueFrom(this.http.get(this.apiUrl + '/me'));
    return me;
  }
}
