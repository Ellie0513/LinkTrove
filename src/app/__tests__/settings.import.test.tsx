import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Settings } from '../App';
import { FeedbackProvider } from '../ui/feedback';
import {
  createExportImportService,
  type StorageLike,
} from '../data/exportImport';

function makeStorage(
  initial: { pages?: any[]; cats?: any[] } = {}
): StorageLike {
  let pages = initial.pages ?? [];
  let cats = initial.cats ?? [];
  return {
    saveToLocal: async (d) => {
      pages = d as any;
    },
    loadFromLocal: async () => pages as any,
    saveToSync: async (d) => {
      cats = d as any;
    },
    loadFromSync: async () => cats as any,
    exportData: async () =>
      JSON.stringify({ webpages: pages, categories: cats }),
    importData: async (json) => {
      const obj = JSON.parse(json);
      pages = obj.webpages ?? [];
      cats = obj.categories ?? [];
    },
  };
}

describe('Settings import/export UI (task 10)', () => {
  it('imports JSON file and shows success toast', async () => {
    const storage = makeStorage({
      pages: [{ id: '1', title: 'A', url: 'https://a' }],
      cats: [{ id: 'c1', name: 'Default', color: '#fff', order: 0 }],
    });
    const ei = createExportImportService({ storage });
    render(
      <FeedbackProvider>
        <Settings ei={ei} />
      </FeedbackProvider>
    );

    const input = screen.getByLabelText('Import JSON file');
    const file = new File([
      JSON.stringify({
        webpages: [{ id: '2', title: 'B', url: 'https://b' }],
        categories: [{ id: 'c2', name: 'Work', color: '#0f0', order: 1 }],
      }),
    ], 'import.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /import json/i }));
    expect(
      await screen.findByText(/Imported: 1 pages, 1 categories/i)
    ).toBeInTheDocument();
  });

  it('shows error toast on invalid JSON file', async () => {
    const storage = makeStorage();
    const ei = createExportImportService({ storage });
    render(
      <FeedbackProvider>
        <Settings ei={ei} />
      </FeedbackProvider>
    );
    const input = screen.getByLabelText('Import JSON file');
    const file = new File(['{bad json'], 'import.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    fireEvent.click(screen.getByRole('button', { name: /import json/i }));
    expect(await screen.findByText(/invalid json/i)).toBeInTheDocument();
  });
});
