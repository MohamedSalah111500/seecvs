import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';
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
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(15px)' }),
            stagger(
              '100ms',
              animate(
                '400ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              )
            ),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
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
    const mapped: UploadedCv[] = Array.from(input.files).map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
      score: 0,
      comment: '',
    }));
    this.cvs = [...this.cvs, ...mapped];
    input.value = '';
  }

  uploadAll() {
    if (!this.jobDescription.trim()) return;
    this.isUploading = true;

    this.cvs.forEach((cv) => {
      if (cv.status === 'done') return;
      cv.status = 'uploading';

      this.analyzerService
        .analyzeSingleCv(cv.file, this.jobDescription, '')
        .subscribe({
          next: (res: any) => {
            console.log('RAW RESPONSE FROM BACKEND:', res); // CHECK YOUR BROWSER CONSOLE

            // Check the new structure: res.results[0]
            if (res && res.results && res.results.length > 0) {
              const aiResult = res.results[0];

              cv.score = aiResult.score;
              cv.comment = aiResult.comment;
              cv.status = 'done'; // Success!
            } else {
              console.error('Data structure mismatch or empty results', res);
              cv.status = 'error';
            }
            this.checkFinished();
          },
          error: (err) => {
            console.error('HTTP ERROR:', err);
            cv.status = 'error';
            this.checkFinished();
          },
        });
    });
  }

  checkAts() {
    if (!this.atsFile) return;
    this.isUploading = true;

    this.analyzerService
      .analyzeSingleCv(this.atsFile, 'ATS Optimization', 'ats-mode')
      .subscribe({
        next: (res: any) => {
          // FIX: Access res.results[0]
          if (res && res.results && res.results.length > 0) {
            this.atsResult = res.results[0];
          }
          this.isUploading = false;
        },
        error: () => (this.isUploading = false),
      });
  }
  checkFinished() {
    if (this.cvs.every((c) => c.status !== 'uploading')) {
      this.isUploading = false;
      this.cvs = [...this.cvs].sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  }

  onAtsFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.atsFile = input.files[0];
  }

  trackByFn(index: number, item: UploadedCv) {
    return item.file.name;
  }
}
