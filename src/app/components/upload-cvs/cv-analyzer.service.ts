import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root', // ✅ this is key
})
export class CvAnalyzerService {
  private apiUrl = 'https://seecvs-be.onrender.com/analyze-cvs';

  constructor(private http: HttpClient) {}

  analyzeSingleCv(
    file: File,
    jobDesc: string,
    notes: string,
    lang: string,
  ): Observable<any> {
    const formData = new FormData();
    formData.append('files', file); // Note: Backend expects 'files' as a list
    formData.append('job_description', jobDesc);
    formData.append('notes', notes);
    formData.append('lang', lang);
    return this.http.post(this.apiUrl, formData);
  }
}
