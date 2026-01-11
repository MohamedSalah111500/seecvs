import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { CvAnalyzerService } from './cv-analyzer.service';

export interface UploadedCv {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  score?: number;
  comment?: string;
}

@Component({
  selector: 'app-upload-cvs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-cvs.component.html',
  styleUrls: ['./upload-cvs.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger('100ms', animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class UploadCvsComponent {
  cvs: UploadedCv[] = [];
  jobDescription: string = '';
  isUploading = false;
  currentLang: 'en' | 'ar' = 'en';
  activeTab: 'rank' | 'ats' = 'rank';

  atsFile: File | null = null;
  atsResult: any = null;

  constructor(private analyzerService: CvAnalyzerService) {}

  toggleLang() {
    this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
    document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const mapped: UploadedCv[] = Array.from(input.files).map(file => ({
      file, progress: 0, status: 'pending' as const, score: 0, comment: ''
    }));
    this.cvs = [...this.cvs, ...mapped];
    input.value = '';
  }

  uploadAll() {

    if (!this.jobDescription.trim()) return;
    this.isUploading = true;
    this.cvs.forEach(cv => {
      if (cv.status === 'done') return;
      cv.status = 'uploading';
      this.analyzerService.analyzeSingleCv(cv.file, this.jobDescription, '').subscribe({
        next: (res) => {
          cv.status = 'done';
          cv.score = res.score || 0;
          cv.comment = res.comment;
          this.checkFinished();
        },
        error: () => { cv.status = 'error'; this.checkFinished(); }
      });
    });
  }

  checkFinished() {
    if (this.cvs.every(c => c.status !== 'uploading')) {
      this.isUploading = false;
      this.cvs = [...this.cvs].sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  }

  onAtsFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.atsFile = input.files[0];
  }
checkAts() {
  if (!this.atsFile) return;
  this.isUploading = true;

  // We send "ATS Scan" as the job description
  // AND "ats-mode" as the notes so the Python logic can switch prompts
  this.analyzerService.analyzeSingleCv(this.atsFile, "ATS Optimization", "ats-mode").subscribe({
    next: (res) => {
      // res will now contain the advice in the 'comment' field
      this.atsResult = res;
      this.isUploading = false;
    },
    error: () => this.isUploading = false
  });
}

  trackByFn(index: number, item: UploadedCv) { return item.file.name; }
}
