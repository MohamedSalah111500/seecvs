import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { UploadCvsComponent } from './components/upload-cvs/upload-cvs.component';

@Component({
  selector: 'app-root',
  standalone: true,
imports: [RouterOutlet, FormsModule, HttpClientModule, UploadCvsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],  // fixed here
})
export class AppComponent {

  constructor() {}


}
