import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../data-access/auth.service';
import { LoginCredentials } from '../../data-access/auth.model';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';

@Component({
  imports: [FormField, FormRoot],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);

  protected readonly errorMsg = signal('');

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
            this.errorMsg.set('');
            const credentials = field().value();
            await this.auth.login(credentials);
          } catch (error) {
            this.errorMsg.set(`${error}`);
          }
        },
        onInvalid: (field) => {
          field().errorSummary()[0].fieldTree().focusBoundControl();
        },
      },
    },
  );
}
