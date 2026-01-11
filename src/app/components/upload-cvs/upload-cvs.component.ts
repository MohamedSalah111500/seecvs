import { Component } from '@angular/core';
import { UploadedCv } from './types';
import { CvAnalyzerService } from './cv-analyzer.service';
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

@Component({
  selector: 'app-upload-cvs',
  templateUrl: './upload-cvs.component.html',
  styleUrls: ['./upload-cvs.component.scss'],
  standalone: true,
  providers: [CvAnalyzerService],
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        // Handles items entering the list
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(
              '80ms',
              animate(
                '300ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              )
            ),
          ],
          { optional: true }
        ),

        // FIX: Instead of :move, we use animateChild or
        // let Angular handle the position change via the 'trackBy' logic
        query(
          ':leave',
          [
            animate(
              '200ms ease-in',
              style({ opacity: 0, transform: 'scale(0.9)' })
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
  notes: string = '';
  isUploading = false;

  constructor(private analyzerService: CvAnalyzerService) {}

  trackByFn(index: number, item: UploadedCv) {
    // Unique ID based on name and size to ensure Angular tracks the row correctly
    return item.file ? `${item.file.name}-${item.file.size}` : index;
  }

 sortByScore() {
  // 1. Sort the existing array
  this.cvs.sort((a, b) => (b.score || 0) - (a.score || 0));

  // 2. IMPORTANT: Create a new array reference so Angular detects the change
  // This triggers the listAnimation and refreshes the view
  this.cvs = [...this.cvs];
}

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles = Array.from(input.files);

    // Map files to our structure and APPEND them to the existing list
    const mappedCvs: UploadedCv[] = newFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
      score: 0,
      comment: ''
    }));

    this.cvs = [...this.cvs, ...mappedCvs];
    input.value = ''; // Reset input so same file can be picked again if removed
  }

  uploadAll() {
    // VALIDATION: Not submitting without Job Description
    if (!this.jobDescription.trim()) {
      alert("Please enter a Job Description first.");
      return;
    }

    if (!this.cvs.length) return;

    this.isUploading = true;

    this.cvs.forEach((cv) => {
      if (cv.status === 'done') return; // Skip already processed

      cv.status = 'uploading';
      cv.progress = 30; // Start progress bar visually

      this.analyzerService
        .analyzeSingleCv(cv.file, this.jobDescription, this.notes)
        .subscribe({
          next: (res) => {
            cv.progress = 100;
            cv.status = 'done';
            cv.score = res.score;
            cv.comment = res.comment;

            // Auto-sort once everything is finished
            if (this.cvs.every(item => item.status === 'done' || item.status === 'error')) {
              this.isUploading = false;
              this.sortByScore();
            }
          },
          error: () => {
            cv.status = 'error';
            cv.progress = 0;
            this.isUploading = false;
          },
        });
    });
  }

  removeCv(index: number) {
    this.cvs.splice(index, 1);
  }
}
