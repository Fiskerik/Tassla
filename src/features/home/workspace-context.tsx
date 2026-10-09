import { createContext, useContext, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OwnedDog } from '../../data/app-data';

export type WorkspacePage =
  | 'home'
  | 'log'
  | 'training'
  | 'more'
  | 'health'
  | 'planned-health'
  | 'knowledge'
  | 'passport'
  | 'profile'
  | 'notification-settings'
  | 'account-settings'
  | 'beta-info';

export type WorkspaceContextValue = {
  client: SupabaseClient;
  dog: OwnedDog;
  renderPage: (page: WorkspacePage) => ReactNode;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceContext');
  return value;
}

export function WorkspaceRoute({ page }: { page: WorkspacePage }) {
  return <>{useWorkspace().renderPage(page)}</>;
}
