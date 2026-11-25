export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Pool {
  id: number;
  name: string;
  size: string | null;
  pH: number | null;
  lastReadingAt: string | null;
  readings: number;
}

export interface Reading {
  recordedAt: string;
  ph: number;
  status: 'ok' | 'warn' | 'danger';
}

export interface Alert {
  id: number;
  pool: string;
  type: 'ok' | 'warn' | 'danger';
  title: string;
  msg: string;
  occurredAt: string;
}

export interface Settings {
  ph_min?: string;
  ph_max?: string;
  [key: string]: string | undefined;
}
