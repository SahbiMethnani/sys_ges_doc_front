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
  private readonly maxFileSizeBytes = 20 * 1024 * 1024;
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
    input.value = '';
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
    const rejected: string[] = [];
    const valid = files.filter((file) => {
      const extensionAllowed = allowed.some((ext) => file.name.toLowerCase().endsWith(ext));
      let reason = '';
      if (!extensionAllowed) reason = 'format non accepté';
      else if (file.size === 0) reason = 'fichier vide';
      else if (file.size > this.maxFileSizeBytes) reason = 'fichier supérieur à 20 MiB';
      if (reason) rejected.push(`${file.name} : ${reason}`);
      return !reason;
    });
    if (!valid.length) {
      this.showToast(rejected.join(' · ') || 'Aucun fichier sélectionné.', 'error');
      return;
    }

    this.isUploading = true;
    let done = 0;
    let uploaded = 0;
    const failures: string[] = [];
    const finish = () => {
      if (done !== valid.length) return;
      this.isUploading = false;
      if (uploaded) this.loadDocuments();
      const issues = [...rejected, ...failures];
      const message = issues.length
        ? `${uploaded} fichier(s) envoyé(s). ${issues.join(' · ')}`
        : `${uploaded} fichier(s) uploadé(s)`;
      this.showToast(message, issues.length ? 'error' : 'success');
    };

    valid.forEach(file => {
      this.rag.uploadDocument(file).subscribe({
        next: () => { uploaded++; done++; finish(); },
        error: (err) => { failures.push(`${file.name} : ${err.message}`); done++; finish(); },
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
