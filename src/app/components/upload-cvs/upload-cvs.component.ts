import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations'
import { CvAnalyzerService } from './cv-analyzer.service'

export interface UploadedCv {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  score: number
  comment: string[]
  isExpanded?: boolean
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
                style({ opacity: 1, transform: 'translateY(0)' }),
              ),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class UploadCvsComponent {
  cvs: UploadedCv[] = []
  jobDescription = ''
  isUploading = false
  currentLang: 'en' | 'ar' = 'en'
  activeTab: 'rank' | 'ats' = 'rank'
  atsFile: File | null = null
  atsResult: any = null

  MAX_VISIBLE_COMMENTS = 3
  readonly LANG_KEY = 'user_language'

  constructor(private analyzerService: CvAnalyzerService) {
    const savedLang = localStorage.getItem(this.LANG_KEY) as 'en' | 'ar'
    if (savedLang) {
      this.currentLang = savedLang
      this.applyLanguageSettings(savedLang)
    }
  }

  visibleComments(cv: UploadedCv): string[] {
    return cv.isExpanded
      ? cv.comment
      : cv.comment.slice(0, this.MAX_VISIBLE_COMMENTS)
  }

  hasMore(cv: UploadedCv): boolean {
    return cv.comment.length > this.MAX_VISIBLE_COMMENTS
  }

  toggleExpand(cv: UploadedCv): void {
    cv.isExpanded = !cv.isExpanded
  }

  toggleLang() {
    this.currentLang = this.currentLang === 'en' ? 'ar' : 'en'
    localStorage.setItem(this.LANG_KEY, this.currentLang)
    this.applyLanguageSettings(this.currentLang)
  }

  applyLanguageSettings(lang: 'en' | 'ar') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.body.classList.toggle('rtl-mode', lang === 'ar')
  }

  uploadAll() {
    if (!this.jobDescription.trim() || !this.cvs.length) return

    this.isUploading = true
    this.setScroll(true)

    this.cvs.forEach((cv) => {
      cv.status = 'uploading'

      this.analyzerService
        .analyzeSingleCv(cv.file, this.jobDescription, '', this.currentLang)
        .subscribe({
          next: (res: any) => {
            const data = res.results[0]
            cv.comment = data.comment
            cv.score = data.score
            cv.status = 'done'
            this.checkFinished()
          },
          error: () => {
            cv.status = 'error'
            this.checkFinished()
          },
        })
    })
  }

  checkFinished() {
    if (!this.cvs.some((cv) => cv.status === 'uploading')) {
      this.isUploading = false
      this.setScroll(false)
      this.cvs.sort((a, b) => (b.score || 0) - (a.score || 0))
    }
  }

  private setScroll(lock: boolean) {
    document.body.style.overflow = lock ? 'hidden' : 'auto'
    document.body.classList.toggle('lock-scroll', lock)
  }

  checkAts() {
    if (!this.atsFile) return

    this.isUploading = true
    this.setScroll(true)

    this.analyzerService
      .analyzeSingleCv(this.atsFile, 'ATS Mode', 'ats-mode', this.currentLang)
      .subscribe({
        next: (res: any) => {
          const data = res.results[0]
          this.atsResult = { ...data, comment: data.comment }
          this.isUploading = false
          this.setScroll(false)
        },
        error: () => {
          this.isUploading = false
          this.setScroll(false)
        },
      })
  }

  onAtsFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files) this.atsFile = input.files[0]
  }

  trackByFn(_: number, item: UploadedCv) {
    return item.file.name
  }
isArray(value: any): boolean {
    return Array.isArray(value);
  }
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) return

    const mapped: UploadedCv[] = Array.from(input.files).map((file) => ({
      file,
      progress: 0,
      status: 'pending',
      score: 0,
      comment: [],
    }))

    this.cvs = [...this.cvs, ...mapped]
    input.value = ''
  }
}
