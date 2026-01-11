import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root', // ✅ this is key
})
export class CvAnalyzerService {
  private API = 'https://seecvs-be.onrender.com/analyze-cvs';

  constructor(private http: HttpClient) {}

  analyzeSingleCv(
    file: File,
    jobDescription: string,
    notes: string
  ): Observable<{ score: number; comment: string }> {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('job_description', jobDescription);
    formData.append('notes', notes);

    return this.http
      .post<any>(this.API, formData)
      .pipe(map((res) => res.ranked_cvs[0]));
  }
}
