import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly LANG_KEY = 'user_language';
  private langSubject = new BehaviorSubject<'en' | 'ar'>(this.getInitialLang());

  currentLang$ = this.langSubject.asObservable();

  get currentLang(): 'en' | 'ar' {
    return this.langSubject.value;
  }

  constructor() {
    this.applyLanguageSettings(this.currentLang);
  }

  toggleLang() {
    const newLang = this.currentLang === 'en' ? 'ar' : 'en';
    localStorage.setItem(this.LANG_KEY, newLang);
    this.langSubject.next(newLang);
    this.applyLanguageSettings(newLang);
  }

  private getInitialLang(): 'en' | 'ar' {
    return (localStorage.getItem(this.LANG_KEY) as 'en' | 'ar') || 'en';
  }

  private applyLanguageSettings(lang: 'en' | 'ar') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.body.classList.toggle('rtl-mode', lang === 'ar');
  }
}
