import React from 'react';
import type { DrizzleAdminConfig } from './types';

export interface DrizzleAdminProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | undefined>>;
  config: DrizzleAdminConfig;
}

export const DrizzleAdmin: React.FC<DrizzleAdminProps> = ({ params: _params, searchParams: _searchParams, config: _config }) => {
  // Minimal placeholder to satisfy build; real UI would live in the external package.
  return <div>Drizzle Admin UI placeholder</div>;
};

