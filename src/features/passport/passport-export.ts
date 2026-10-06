import { Directory, File, Paths } from 'expo-file-system';
import * as ExpoCrypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { renderPassportHtml, type PassportSnapshot } from './passport-model';

export const PASSPORT_EXPORT_PREFIX = 'tassla-passport-';

export interface PassportExportDependencies {
  cleanupStaleFiles: () => void;
  printToFileAsync: (options: { html: string }) => Promise<{ uri: string; numberOfPages: number } | void>;
  isGeneratedPrintFile: (uri: string) => boolean;
  isOwnedPassportFile: (uri: string, name: string) => boolean;
  moveOwnedFile: (uri: string, name: string) => Promise<string>;
  isAvailableAsync: () => Promise<boolean>;
  shareAsync: (uri: string, options: { UTI: string; mimeType: string; dialogTitle: string }) => Promise<void>;
  deleteFile: (uri: string) => void;
  randomId: () => string;
}

export type PassportExportResult =
  | { status: 'dialog-closed' }
  | { status: 'unavailable' }
  | { status: 'stale' }
  | { status: 'busy' }
  | { status: 'failed' };

const activeOwnedFiles = new Set<string>();
let exportInFlight = false;

function isGeneratedPrintFile(uri: string): boolean {
  try {
    const file = new File(uri);
    const printDirectory = new Directory(Paths.cache, 'Print');
    return file.exists && file.parentDirectory.uri === printDirectory.uri;
  } catch {
    return false;
  }
}

function isOwnedPassportFile(uri: string, name: string): boolean {
  try {
    const file = new File(uri);
    return file.exists && file.name === name && name.startsWith(PASSPORT_EXPORT_PREFIX)
      && file.parentDirectory.uri === Paths.cache.uri;
  } catch {
    return false;
  }
}

function deleteIfPresent(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Cache cleanup is best effort; it must not hide the export result.
  }
}

export function cleanupStalePassportFiles(): void {
  if (exportInFlight) return;
  try {
    const cache = Paths.cache;
    if (!cache.exists) return;
    for (const entry of cache.list()) {
      if (entry instanceof File && entry.name.startsWith(PASSPORT_EXPORT_PREFIX)
        && !activeOwnedFiles.has(entry.uri)) entry.delete();
    }
  } catch {
    // Startup cleanup must not prevent the workspace from opening.
  }
}

export const passportExportDependencies: PassportExportDependencies = {
  cleanupStaleFiles: cleanupStalePassportFiles,
  printToFileAsync: (options) => Print.printToFileAsync(options),
  isGeneratedPrintFile,
  isOwnedPassportFile,
  async moveOwnedFile(uri, name) {
    const file = new File(uri);
    if (!isGeneratedPrintFile(uri)) {
      throw new Error('PDF was not created as a file directly in Expo Print cache');
    }
    if (!name.startsWith(PASSPORT_EXPORT_PREFIX) || !/^[a-z0-9-]+\.pdf$/i.test(name)) throw new Error('Invalid owned PDF filename');
    const ownedFile = new File(Paths.cache, name);
    if (ownedFile.parentDirectory.uri !== Paths.cache.uri || ownedFile.name !== name || ownedFile.exists) {
      throw new Error('Owned PDF destination was not a new direct cache file');
    }
    try {
      await file.move(ownedFile);
      return ownedFile.uri;
    } catch (error) {
      try { if (ownedFile.exists) ownedFile.delete(); } catch { /* Best effort cleanup. */ }
      throw error;
    }
  },
  isAvailableAsync: () => Sharing.isAvailableAsync(),
  shareAsync: (uri, options) => Sharing.shareAsync(uri, options),
  deleteFile: deleteIfPresent,
  randomId: () => ExpoCrypto.randomUUID(),
};

export async function createAndSharePassportPdf(
  snapshot: PassportSnapshot,
  isCurrent: () => boolean,
  dependencies: PassportExportDependencies = passportExportDependencies,
): Promise<PassportExportResult> {
  if (exportInFlight) return { status: 'busy' };
  // Run the synchronous, prefix-only cache sweep before taking the operation
  // lock; JavaScript run-to-completion keeps this check/sweep/lock sequence
  // serialized against another export request.
  try { dependencies.cleanupStaleFiles(); } catch { /* Best effort. */ }
  if (exportInFlight) return { status: 'busy' };
  exportInFlight = true;
  const createdFiles = new Set<string>();
  try {
    if (!isCurrent()) return { status: 'stale' };

    const printed = await dependencies.printToFileAsync({ html: renderPassportHtml(snapshot) });
    if (!printed?.uri || !dependencies.isGeneratedPrintFile(printed.uri)) return { status: 'failed' };
    const generatedUri = printed.uri;
    createdFiles.add(generatedUri);
    if (!isCurrent()) return { status: 'stale' };

    const ownedName = `${PASSPORT_EXPORT_PREFIX}${dependencies.randomId()}.pdf`;
    const ownedUri = await dependencies.moveOwnedFile(generatedUri, ownedName);
    if (!dependencies.isOwnedPassportFile(ownedUri, ownedName)) return { status: 'failed' };
    createdFiles.add(ownedUri);
    activeOwnedFiles.add(ownedUri);
    if (!isCurrent()) return { status: 'stale' };

    const available = await dependencies.isAvailableAsync();
    if (!isCurrent()) return { status: 'stale' };
    if (!available) return { status: 'unavailable' };

    if (!isCurrent()) return { status: 'stale' };
    await dependencies.shareAsync(ownedUri, {
      UTI: 'com.adobe.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Tassla-pass',
    });
    if (!isCurrent()) return { status: 'stale' };
    return { status: 'dialog-closed' };
  } catch {
    return { status: 'failed' };
  } finally {
    for (const uri of createdFiles) {
      try { dependencies.deleteFile(uri); } catch { /* Best effort cleanup. */ }
      activeOwnedFiles.delete(uri);
    }
    exportInFlight = false;
  }
}
