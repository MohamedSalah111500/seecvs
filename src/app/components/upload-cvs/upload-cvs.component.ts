import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { animate, query, stagger, style, transition, trigger } from '@angular/animations'
import { CvAnalyzerService } from './cv-analyzer.service'
import { LanguageService } from '../../services/language.service'

export interface UploadedCv {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  score: number
  comment: string[]
  improvements: string[]
  warnings: string[]
  isExpanded?: boolean
}

@Component({
  selector: 'app-upload-cvs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './upload-cvs.component.html',
  styleUrls: ['./upload-cvs.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class UploadCvsComponent {
  cvs: UploadedCv[] = []
  jobDescription = ''
  isUploading = false
  consentGiven = false
  currentLang: 'en' | 'ar' = 'en'
  activeTab: 'rank' | 'ats' = 'ats'
  atsFile: File | null = null
  atsResult: any = null

  constructor(private analyzerService: CvAnalyzerService, private langService: LanguageService) {
    this.langService.currentLang$.subscribe(lang => {
      this.currentLang = lang
    })
  }

  // Task Selection
  setTask(task: 'rank' | 'ats') {
    this.activeTab = task;
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }

  uploadAll() {
    if (!this.jobDescription.trim() || !this.cvs.length) return
    this.isUploading = true
    this.setScroll(true)

    this.cvs.forEach((cv) => {
      cv.status = 'uploading'
      this.analyzerService.analyzeSingleCv(cv.file, this.jobDescription, '', this.currentLang)
        .subscribe({
          next: (res: any) => {
            const data = res.results[0]
            cv.comment = data.comment || []; cv.score = data.score; cv.status = 'done'
            cv.improvements = data.improvements || []; cv.warnings = data.warnings || []
            this.checkFinished()
          },
          error: () => { cv.status = 'error'; this.checkFinished() }
        })
    })
  }

  checkFinished() {
    if (!this.cvs.some((cv) => cv.status === 'uploading')) {
      this.isUploading = false; this.setScroll(false)
      this.cvs.sort((a, b) => (b.score || 0) - (a.score || 0))
      setTimeout(() => document.querySelector('.results-pane')?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }

  checkAts() {
    if (!this.atsFile) return
    this.isUploading = true; this.setScroll(true)
    this.analyzerService.analyzeSingleCv(this.atsFile, 'ATS Mode', 'ats-mode', this.currentLang)
      .subscribe({
        next: (res: any) => {
          this.atsResult = res.results[0]
          this.isUploading = false; this.setScroll(false)
        },
        error: () => { this.isUploading = false; this.setScroll(false) }
      })
  }

  private setScroll(lock: boolean) {
    document.body.style.overflow = lock ? 'hidden' : 'auto'
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) return
    const mapped: UploadedCv[] = Array.from(input.files).map((file) => ({
      file, status: 'pending' as const, score: 0, comment: [], improvements: [], warnings: []
    }))
    this.cvs = [...this.cvs, ...mapped]; input.value = ''
  }

  onAtsFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files) this.atsFile = input.files[0]
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return this.currentLang === 'en' ? 'Excellent' : 'ممتاز';
    if (score >= 50) return this.currentLang === 'en' ? 'Average' : 'متوسط';
    return this.currentLang === 'en' ? 'Poor' : 'ضعيف';
  }

  trackByFn(_: number, item: UploadedCv) { return item.file.name }
}
