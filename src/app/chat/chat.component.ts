import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RagService, SourceDocument } from '../shared/services/rag.service';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: SourceDocument[];
  loading?: boolean;
  error?: boolean;
  ts: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

  messages: Message[] = [];
  input = '';
  showSources = true;
  isLoading = false;

  constructor(private rag: RagService) {}

  ngAfterViewChecked() { this.scrollToBottom(); }

  send() {
    const q = this.input.trim();
    if (!q || this.isLoading) return;

    this.messages.push({ role: 'user', text: q, ts: new Date() });
    this.input = '';
    this.isLoading = true;

    const placeholder: Message = { role: 'assistant', text: '', loading: true, ts: new Date() };
    this.messages.push(placeholder);

    this.rag.query(q, this.showSources).subscribe({
      next: (res) => {
        placeholder.text    = res.answer;
        placeholder.sources = res.sources;
        placeholder.loading = false;
        this.isLoading = false;
      },
      error: (err) => {
        placeholder.text    = err.message;
        placeholder.loading = false;
        placeholder.error   = true;
        this.isLoading = false;
      },
    });
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  sendSuggestion(text: string) { this.input = text; this.send(); }
  clear() { this.messages = []; }

  private scrollToBottom() {
    try { this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }

  formatTime(d: Date) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  shortSource(path: string) { return path.split(/[/\\]/).pop() ?? path; }
}
