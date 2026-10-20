import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { RagService, StatusResponse, QueryResponse, DocumentInfo, MessageResponse } from './rag.service';

describe('RagService', () => {
  let service: RagService;
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let apiUrl: string;

  beforeEach(() => {
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };

    service = new RagService(httpClient as unknown as HttpClient);
    apiUrl = (service as any).api;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get status', () => {
    const expected: StatusResponse = {
      status: 'ready',
      documents_loaded: true,
      vector_store_exists: false,
      total_documents: 3,
    };

    httpClient.get.mockReturnValue(of(expected));

    service.getStatus().subscribe((response) => {
      expect(response).toEqual(expected);
    });

    expect(httpClient.get).toHaveBeenCalledWith(`${apiUrl}/status`);
  });

  it('should query and send show_sources flag', () => {
    const expected: QueryResponse = {
      answer: 'Réponse factice',
      sources: [{ source: 'fichier.txt', content: 'Contenu extrait' }],
    };

    httpClient.post.mockReturnValue(of(expected));

    service.query('Quel est le test ?', false).subscribe((response) => {
      expect(response).toEqual(expected);
    });

    expect(httpClient.post).toHaveBeenCalledWith(`${apiUrl}/query`, {
      question: 'Quel est le test ?',
      show_sources: false,
    });
  });

  it('should list documents', () => {
    const expected: DocumentInfo[] = [
      { filename: 'doc1.pdf', size: 1000, type: 'application/pdf' },
      { filename: 'doc2.txt', size: 200, type: 'text/plain' },
    ];

    httpClient.get.mockReturnValue(of(expected));

    service.listDocuments().subscribe((response) => {
      expect(response).toEqual(expected);
    });

    expect(httpClient.get).toHaveBeenCalledWith(`${apiUrl}/documents`);
  });

  it('should upload document with FormData', () => {
    const file = new File(['contenu'], 'monfichier.txt', {
      type: 'text/plain',
    });
    const expectedResponse = { success: true };

    httpClient.post.mockReturnValue(of(expectedResponse));

    service.uploadDocument(file).subscribe((response) => {
      expect(response).toEqual(expectedResponse);
    });

    const [url, body] = httpClient.post.mock.calls[0];

    expect(url).toBe(`${apiUrl}/documents/upload`);
    expect(body instanceof FormData).toBe(true);
    expect(body.get('file')).toBe(file);
  });

  it('should index documents', () => {
    const expectedResponse = { indexed: true };

    httpClient.post.mockReturnValue(of(expectedResponse));

    service.indexDocuments().subscribe((response) => {
      expect(response).toEqual(expectedResponse);
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      `${apiUrl}/documents/index`,
      {},
    );
  });

  it('should delete document', () => {
    const filename = 'delete-me.txt';
    const expected: MessageResponse = {
      message: 'Fichier supprimé',
    };

    httpClient.delete.mockReturnValue(of(expected));

    service.deleteDocument(filename).subscribe((response) => {
      expect(response).toEqual(expected);
    });

    expect(httpClient.delete).toHaveBeenCalledWith(
      `${apiUrl}/documents/${filename}`,
    );
  });

  it('should propagate HTTP error detail', () => {
    const error = new Error('Erreur de test');

    httpClient.get.mockReturnValue(throwError(() => error));

    service.getStatus().subscribe({
      next: () => {
        throw new Error('Attendu une erreur');
      },
      error: (caught: Error) => {
        expect(caught).toEqual(error);
      },
    });

    expect(httpClient.get).toHaveBeenCalledWith(`${apiUrl}/status`);
    //console.log("npx vite preview --outDir html");
  });
});