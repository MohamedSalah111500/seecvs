import { Routes } from '@angular/router';
import { UploadCvsComponent } from './components/upload-cvs/upload-cvs.component';
import { TermsComponent } from './components/terms/terms.component';
import { PrivacyComponent } from './components/privacy/privacy.component';

export const routes: Routes = [
  { path: '', component: UploadCvsComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent },
];
