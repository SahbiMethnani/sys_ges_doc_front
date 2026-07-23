// src/app/shared/services/rag.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface QueryRequest   { question: string; show_sources?: boolean; }
export interface SourceDocument { source: string; content: string; }
export interface QueryResponse  { answer: string; sources?: SourceDocument[]; }
export interface StatusResponse { status: string; documents_loaded: boolean; vector_store_exists: boolean; total_documents: number; }
export interface DocumentInfo   { filename: string; size: number; type: string; }
export interface MessageResponse{ message: string; }

@Injectable({ providedIn: 'root' })
export class RagService {
  private readonly api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getStatus(): Observable<StatusResponse> {
    return this.http.get<StatusResponse>(`${this.api}/status`).pipe(catchError(this.handleError));
  }
  query(question: string, showSources = true): Observable<QueryResponse> {
    return this.http.post<QueryResponse>(`${this.api}/query`, { question, show_sources: showSources }).pipe(catchError(this.handleError));
  }
  listDocuments(): Observable<DocumentInfo[]> {
    return this.http.get<DocumentInfo[]>(`${this.api}/documents`).pipe(catchError(this.handleError));
  }
  uploadDocument(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.api}/documents/upload`, fd).pipe(catchError(this.handleError));
  }
  indexDocuments(): Observable<any> {
    return this.http.post(`${this.api}/documents/index`, {}).pipe(catchError(this.handleError));
  }
  deleteDocument(filename: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.api}/documents/${filename}`).pipe(catchError(this.handleError));
  }
  private handleError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.error?.detail || err.message || 'Erreur inconnue'));
  }
}
