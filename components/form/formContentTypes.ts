export type EnhancedTextAreasMode = 'edit' | 'preview';

export interface FileInfo {
  detId?: number;
  file?: File;
  fileSrcUrl?: string;
}

export interface ContentElement {
  id: number;
  partialContent?: string;
  fileInfo?: FileInfo;
}
