import JSZip from 'jszip';

/**
 * Represents an unpacked file from a ZIP archive
 */
export interface UnpackedFile {
  name: string;
  path: string;
  content: Uint8Array;
  text?: string;
}

/**
 * Detects if a file is a ZIP archive by checking its magic bytes
 */
export async function isZipFile(file: File): Promise<boolean> {
  // ZIP files start with PK (0x50 0x4B)
  const buffer = await file.slice(0, 2).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return bytes[0] === 0x50 && bytes[1] === 0x4B;
}

/**
 * Unpacks a ZIP file and returns a collection of files
 */
export async function unzipFile(file: File): Promise<Map<string, UnpackedFile>> {
  const zip = await JSZip.loadAsync(file);
  const files = new Map<string, UnpackedFile>();

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (!zipEntry.dir) {
      const content = await zipEntry.async('uint8array');
      files.set(path, {
        name: path.split('/').pop() || path,
        path,
        content,
      });
    }
  }

  return files;
}

/**
 * Gets files from an unpacked collection that match a specific extension
 */
export function getFilesByExtension(
  files: Map<string, UnpackedFile>,
  extension: string
): UnpackedFile[] {
  const lowerExt = extension.toLowerCase();
  return Array.from(files.values()).filter(
    (file) => file.name.toLowerCase().endsWith(lowerExt)
  );
}

/**
 * Gets a single file by extension, throws if multiple or none found
 */
export function getSingleFileByExtension(
  files: Map<string, UnpackedFile>,
  extension: string,
  errorMessage?: string
): UnpackedFile {
  const matching = getFilesByExtension(files, extension);
  
  if (matching.length === 0) {
    throw new Error(
      errorMessage || `No file with extension ${extension} found in archive`
    );
  }
  
  if (matching.length > 1) {
    throw new Error(
      errorMessage || `Multiple files with extension ${extension} found in archive. Expected exactly one.`
    );
  }
  
  return matching[0];
}
