import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import Landing from "@/pages/Landing";
import Universe from "@/pages/Universe";
import Simulator from "@/pages/Simulator";
import Psychology from "@/pages/Psychology";
import Mentor from "@/pages/Mentor";
import Scenarios from "@/pages/Scenarios";
import Challenges from "@/pages/Challenges";
import Portfolio from "@/pages/Portfolio";

const queryClient = new QueryClient();

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      {/* Protected routes with sidebar */}
      <Route path="/:rest*">
        <SidebarLayout>
          <Switch>
            <Route path="/universe" component={Universe} />
            <Route path="/simulator" component={Simulator} />
            <Route path="/psychology" component={Psychology} />
            <Route path="/mentor" component={Mentor} />
            <Route path="/scenarios" component={Scenarios} />
            <Route path="/challenges" component={Challenges} />
            <Route path="/portfolio" component={Portfolio} />
            <Route component={NotFound} />
          </Switch>
        </SidebarLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
