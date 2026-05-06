// src/app/documents/documents.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RagService, DocumentInfo } from '../shared/services/rag.service';

type ToastType = 'success' | 'error' | 'info';
interface Toast { message: string; type: ToastType; }

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent implements OnInit {
  documents: DocumentInfo[] = [];
  isLoading = false;
  isIndexing = false;
  isUploading = false;
  isDragging = false;
  toast: Toast | null = null;

  constructor(private rag: RagService) {}
  ngOnInit() { this.loadDocuments(); }

  loadDocuments() {
    this.isLoading = true;
    this.rag.listDocuments().subscribe({
      next:  (docs) => { this.documents = docs; this.isLoading = false; },
      error: (err)  => { this.showToast(err.message, 'error'); this.isLoading = false; },
    });
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.uploadFiles(Array.from(input.files));
  }

  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragging = false;
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) this.uploadFiles(files);
  }
  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragging = true; }
  onDragLeave() { this.isDragging = false; }

  uploadFiles(files: File[]) {
    const allowed = ['.pdf', '.html', '.txt', '.raw'];
    const valid = files.filter(f => allowed.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (!valid.length) { this.showToast('Formats acceptés : PDF, HTML, TXT, RAW', 'error'); return; }

    this.isUploading = true;
    let done = 0;
    valid.forEach(file => {
      this.rag.uploadDocument(file).subscribe({
        next: () => { if (++done === valid.length) { this.isUploading = false; this.showToast(`${done} fichier(s) uploadé(s)`, 'success'); this.loadDocuments(); } },
        error: (err) => { if (++done === valid.length) this.isUploading = false; this.showToast(err.message, 'error'); },
      });
    });
  }

  indexDocuments() {
    this.isIndexing = true;
    this.rag.indexDocuments().subscribe({
      next:  (res) => { this.showToast(`Indexation réussie — ${res.documents_indexed} doc(s)`, 'success'); this.isIndexing = false; },
      error: (err) => { this.showToast(err.message, 'error'); this.isIndexing = false; },
    });
  }

  deleteDocument(filename: string) {
    if (!confirm(`Supprimer "${filename}" ?`)) return;
    this.rag.deleteDocument(filename).subscribe({
      next:  () => { this.showToast(`"${filename}" supprimé`, 'success'); this.loadDocuments(); },
      error: (err) => this.showToast(err.message, 'error'),
    });
  }

  formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  }

  typeIcon(ext: string) {
    const icons: Record<string,string> = { '.pdf':'📄', '.html':'🌐', '.txt':'📝', '.raw':'📋' };
    return icons[ext.toLowerCase()] ?? '📁';
  }

  showToast(message: string, type: ToastType) {
    this.toast = { message, type };
    setTimeout(() => (this.toast = null), 3500);
  }
}
