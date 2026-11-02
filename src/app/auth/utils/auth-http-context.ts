import { HttpContextToken } from '@angular/common/http';

export const RETRY_WITH_REFRESH = new HttpContextToken<boolean>(() => false);
