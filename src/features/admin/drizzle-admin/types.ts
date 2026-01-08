import type { ComponentType, ReactNode } from 'react';

export interface AdminPageNavProps<T> {
  basePath: string;
  resourcePath: string;
  row?: T;
}

export interface AdminRowNavProps<T> {
  basePath: string;
  resourcePath: string;
  row: T;
}

export type AdminPageNav<T> = ComponentType<AdminPageNavProps<T>>;
export type AdminRowNav<T> = ComponentType<AdminRowNavProps<T>>;

export type CustomFormControl = ComponentType<{ value?: unknown; onChange?: (value: unknown) => void; children?: ReactNode }>;

export interface DrizzleAdminConfig {
  basePath: string;
  schema: Record<string, unknown>;
  db: unknown;
  dbDialect: string;
  paginationOpts?: Record<string, unknown>;
}

export interface DrizzleTableConfig {
  drizzleTable: unknown;
  formControlMap?: Record<string, string>;
  customFormControlMap?: Record<string, CustomFormControl>;
  components?: Record<string, ComponentType<object>>;
}

