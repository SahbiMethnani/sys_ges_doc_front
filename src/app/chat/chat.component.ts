import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
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
export class ChatComponent implements AfterViewInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollbarTrack') private scrollbarTrack?: ElementRef<HTMLDivElement>;

  messages: Message[] = [];
  input = '';
  showSources = true;
  isLoading = false;
  showScrollbar = false;
  scrollbarThumbHeight = 32;
  scrollbarThumbTop = 0;
  isDraggingScrollbar = false;
  private dragStartY = 0;
  private dragStartScrollTop = 0;

  constructor(private rag: RagService) {}

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.updateScrollbar());
  }

  send() {
    const q = this.input.trim();
    if (!q || this.isLoading) return;

    this.messages.push({ role: 'user', text: q, ts: new Date() });
    this.input = '';
    this.isLoading = true;

    const placeholder: Message = { role: 'assistant', text: '', loading: true, ts: new Date() };
    this.messages.push(placeholder);
    this.scrollToBottom();

    this.rag.query(q, this.showSources).subscribe({
      next: (res) => {
        placeholder.text    = res.answer;
        placeholder.sources = res.sources;
        placeholder.loading = false;
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        placeholder.text    = err.message;
        placeholder.loading = false;
        placeholder.error   = true;
        this.isLoading = false;
        this.scrollToBottom();
      },
    });
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  sendSuggestion(text: string) { this.input = text; this.send(); }
  clear() {
    this.messages = [];
    this.showScrollbar = false;
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      const container = this.messagesContainer?.nativeElement;
      if (!container) return;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      this.updateScrollbar();
    });
  }

  updateScrollbar(): void {
    const container = this.messagesContainer?.nativeElement;
    if (!container) return;

    const trackHeight = this.scrollbarTrack?.nativeElement.clientHeight
      ?? Math.max(0, container.clientHeight - 24);
    const scrollRange = container.scrollHeight - container.clientHeight;
    this.showScrollbar = scrollRange > 1 && trackHeight > 0;
    if (!this.showScrollbar) return;

    this.scrollbarThumbHeight = Math.max(
      32,
      (trackHeight * container.clientHeight) / container.scrollHeight,
    );
    const thumbTravel = Math.max(0, trackHeight - this.scrollbarThumbHeight);
    this.scrollbarThumbTop = (container.scrollTop / scrollRange) * thumbTravel;
  }

  messagesContainerValue(): number {
    const container = this.messagesContainer?.nativeElement;
    if (!container) return 0;
    const scrollRange = container.scrollHeight - container.clientHeight;
    return scrollRange > 0 ? Math.round((container.scrollTop / scrollRange) * 100) : 0;
  }

  onScrollbarPointerDown(event: PointerEvent): void {
    const container = this.messagesContainer.nativeElement;
    const track = this.scrollbarTrack?.nativeElement;
    if (!track) return;

    if (!(event.target as HTMLElement).classList.contains('messages-scrollbar-thumb')) {
      const bounds = track.getBoundingClientRect();
      const fraction = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
      container.scrollTop = fraction * container.scrollHeight - container.clientHeight / 2;
      this.updateScrollbar();
      return;
    }

    event.preventDefault();
    this.isDraggingScrollbar = true;
    this.dragStartY = event.clientY;
    this.dragStartScrollTop = container.scrollTop;
    track.setPointerCapture(event.pointerId);
  }

  onScrollbarPointerMove(event: PointerEvent): void {
    if (!this.isDraggingScrollbar) return;
    const container = this.messagesContainer.nativeElement;
    const trackHeight = this.scrollbarTrack?.nativeElement.clientHeight ?? 0;
    const thumbTravel = trackHeight - this.scrollbarThumbHeight;
    if (thumbTravel <= 0) return;

    const scrollRange = container.scrollHeight - container.clientHeight;
    const delta = ((event.clientY - this.dragStartY) / thumbTravel) * scrollRange;
    container.scrollTop = this.dragStartScrollTop + delta;
    this.updateScrollbar();
  }

  onScrollbarPointerUp(event: PointerEvent): void {
    this.isDraggingScrollbar = false;
    const track = this.scrollbarTrack?.nativeElement;
    if (track?.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
  }

  onScrollbarKeydown(event: KeyboardEvent): void {
    const container = this.messagesContainer.nativeElement;
    const page = container.clientHeight;
    const movements: Record<string, number> = {
      ArrowUp: -40,
      ArrowDown: 40,
      PageUp: -page,
      PageDown: page,
      Home: -container.scrollTop,
      End: container.scrollHeight,
    };
    const movement = movements[event.key];
    if (movement === undefined) return;
    event.preventDefault();
    container.scrollTop = event.key === 'End' ? movement : container.scrollTop + movement;
    this.updateScrollbar();
  }

  formatTime(d: Date) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  shortSource(path: string) { return path.split(/[/\\]/).pop() ?? path; }
}
