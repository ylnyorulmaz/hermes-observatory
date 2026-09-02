import React from 'react';
import { Overview } from './components/Overview';
import { ProfilesView } from './components/ProfilesView';
import { KanbanView } from './components/KanbanView';
import { SubagentsView } from './components/SubagentsView';
import { TokensView } from './components/TokensView';
import { LogsView } from './components/LogsView';
import { Sidebar } from './components/Sidebar';
import { useUIStore } from './store/ui';

const VIEW_COMPONENTS: Record<string, React.FC> = {
  overview: Overview,
  profiles: ProfilesView,
  kanban: KanbanView,
  subagents: SubagentsView,
  tokens: TokensView,
  logs: LogsView,
};

const App: React.FC = () => {
  const { viewMode, sidebarOpen } = useUIStore();
  const CurrentView = VIEW_COMPONENTS[viewMode] || Overview;
  const marginLeft = sidebarOpen ? 'ml-0' : 'ml-16';

  return (
    <div className="h-screen w-full flex bg-bg overflow-hidden">
      <Sidebar />
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${marginLeft}`}>
        {CurrentView ? <CurrentView /> : null}
      </main>
    </div>
  );
};

export default App;