"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Monitor,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChannelSearch } from "./ChannelSearch";
import { PresenceIndicator } from "./PresenceIndicator";

const CHANNELS = ["design-sync", "dev-flow", "growth-ops", "client-feedback"];
const DIRECT_MESSAGES = [
  { name: "Alex Rivera", status: "online" as const },
  { name: "Sarah Chen", status: "focus" as const },
  { name: "Marcus Wright", status: "busy" as const },
  { name: "Elara Vance", status: "away" as const },
];

export function Sidebar({ className }: { className?: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "relative flex flex-col bg-sidebar border-r border-sidebar-border h-screen liquid-elastic-transition z-40 group/sidebar",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Workflow className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-headline font-bold tracking-tight text-foreground">
              Match<span className="text-primary">Flow</span>
            </h1>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white mx-auto">
            <Workflow className="w-5 h-5" />
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-4 top-16 bg-sidebar border border-sidebar-border rounded-full h-8 w-8 hover:bg-sidebar-accent z-50 shadow-md"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4">
        {!isCollapsed && <ChannelSearch />}
        
        <div className="space-y-6 mt-4">
          <div className="space-y-1">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" active />
            <NavItem icon={<MessageSquare />} label="Threads" />
          </div>

          <Separator className="bg-sidebar-border" />

          <div className="space-y-2">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">Channels</h3>
                <Plus className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
              </div>
            )}
            {CHANNELS.map(c => (
              <NavItem key={c} icon={<HashIcon />} label={c} isCompact={isCollapsed} />
            ))}
          </div>

          <div className="space-y-2">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">Messages</h3>
                <Monitor className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
              </div>
            )}
            {DIRECT_MESSAGES.map(dm => (
              <NavItem 
                key={dm.name} 
                icon={<PresenceIndicator status={dm.status} />} 
                label={dm.name} 
                isCompact={isCollapsed} 
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto">
        <Separator className="bg-sidebar-border mb-4" />
        <NavItem icon={<Settings />} label="Settings" isCompact={isCollapsed} />
      </div>
    </aside>
  );
}

function HashIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-4 h-4"
    >
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  );
}

function NavItem({ icon, label, active, isCompact }: { icon: React.ReactNode, label: string, active?: boolean, isCompact?: boolean }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg cursor-pointer liquid-elastic-transition group/item",
        active ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-white"
      )}
    >
      <div className={cn("w-5 h-5 flex items-center justify-center", isCompact && "mx-auto")}>
        {icon}
      </div>
      {!isCompact && <span className="text-[15px] font-medium transition-all group-hover/item:translate-x-1">{label}</span>}
    </div>
  );
}
