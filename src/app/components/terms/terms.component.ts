import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
})
export class TermsComponent {
  currentLang: 'en' | 'ar' = 'en';

  constructor(private langService: LanguageService) {
    this.langService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
    });
  }
}
