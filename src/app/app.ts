// src/app/app.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RagService, StatusResponse } from './shared/services/rag.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  status: StatusResponse | null = null;

  constructor(private rag: RagService) {}

  ngOnInit() {
    this.rag.getStatus().subscribe({
      next:  (s) => (this.status = s),
      error: ()  => (this.status = null),
    });
  }
}
