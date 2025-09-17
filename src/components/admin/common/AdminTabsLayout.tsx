import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LucideIcon } from "lucide-react";

export interface TabConfig {
  value: string;
  label: string;
  icon?: LucideIcon;
  content: ReactNode;
  badge?: string | number;
}

interface AdminTabsLayoutProps {
  tabs: TabConfig[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function AdminTabsLayout({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className = "",
  orientation = "horizontal"
}: AdminTabsLayoutProps) {
  return (
    <Tabs
      defaultValue={defaultValue || tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
      className={`space-y-6 ${className}`}
    >
      <TabsList className={`${orientation === "vertical" ? "flex-col h-auto" : "w-full"} bg-muted/30`}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={`${
              orientation === "vertical" ? "w-full justify-start" : ""
            } flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm`}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
            {tab.badge && (
              <span className="ml-auto bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="space-y-6 mt-6"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}