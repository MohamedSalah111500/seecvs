export interface UploadedCv {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  score?: number;
  comment?: string[];
  improvements?: string[];
  warnings?: string[];
}
