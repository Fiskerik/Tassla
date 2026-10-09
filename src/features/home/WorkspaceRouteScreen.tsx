import { useRouter } from 'expo-router';
import { AppScreen } from '../../components/AppPrimitives';
import { AppBar, BottomNav, type BottomNavDestination } from '../../components/ui';
import { useWorkspace, type WorkspacePage } from './workspace-context';

const tabPages: readonly WorkspacePage[] = ['home', 'log', 'training', 'health', 'more'];

export function WorkspaceRouteScreen({ page, title, mode = 'Title' }: { page: WorkspacePage; title: string; mode?: 'Home' | 'Title' | 'Back' }) {
  const router = useRouter();
  const { renderPage } = useWorkspace();
  const tab = tabPages.includes(page) ? page as BottomNavDestination : undefined;
  return <AppScreen footer={tab ? <BottomNav active={tab} onChange={(destination) => { router.replace(`/${destination}` as never); }} /> : undefined}>
    <AppBar mode={mode} title={title} onAction={mode === 'Back' ? () => router.back() : mode === 'Home' ? () => router.push('/notifications' as never) : undefined} />
    {renderPage(page)}
  </AppScreen>;
}
