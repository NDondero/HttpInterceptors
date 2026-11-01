import { Component, inject, input, signal } from '@angular/core';
import { AuthService } from '../../data-access/auth.service';
import { LoginCredentials } from '../../data-access/auth.model';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

@Component({
  imports: [FormField, FormRoot],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export default class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly reason = input<string>('');
  protected readonly erroMsg = signal('');

  private readonly emptyCredentials: LoginCredentials = {
    username: '',
    password: '',
  };

  private readonly credentialFormModel = signal({ ...this.emptyCredentials });

  protected readonly credentialForm = form(
    this.credentialFormModel,
    (path) => {
      required(path.username);
      required(path.password);
    },
    {
      submission: {
        action: async (field) => {
          try {
            this.erroMsg.set('');
            const credentials = field().value();
            await firstValueFrom(this.auth.login(credentials));
            this.router.navigate(['/home']);
          } catch (error) {
            if (
              error instanceof HttpErrorResponse &&
              error.status === HttpStatusCode.Unauthorized
            ) {
              this.erroMsg.set('Credenciales inválidas');
            }
            throw error;
          }
        },
        onInvalid: (field) => {
          field().errorSummary()[0].fieldTree().focusBoundControl();
        },
      },
    },
  );
}
