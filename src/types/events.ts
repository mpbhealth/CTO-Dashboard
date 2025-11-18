import { ChangeEvent, FormEvent, MouseEvent, DragEvent } from 'react';

export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;
export type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
export type FormSubmitEvent = FormEvent<HTMLFormElement>;
export type ButtonClickEvent = MouseEvent<HTMLButtonElement>;
export type DivClickEvent = MouseEvent<HTMLDivElement>;
export type FileDragEvent = DragEvent<HTMLDivElement>;

export interface FileUploadEvent {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface ModalActions {
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface TableSortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

export interface PaginationEvent {
  page: number;
  pageSize: number;
}

export interface FilterChangeEvent {
  field: string;
  value: string | number | boolean | null;
}

export interface SearchEvent {
  query: string;
  filters?: Record<string, unknown>;
}
