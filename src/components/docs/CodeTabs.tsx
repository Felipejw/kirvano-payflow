import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "./CodeBlock";

interface CodeExample {
  language: string;
  label: string;
  code: string;
}

interface CodeTabsProps {
  examples: CodeExample[];
}

export function CodeTabs({ examples }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState(examples[0]?.language || "javascript");
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="bg-muted/50 border border-border">
        {examples.map((example) => (
          <TabsTrigger 
            key={example.language} 
            value={example.language}
            className="data-[state=active]:bg-background"
          >
            {example.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {examples.map((example) => (
        <TabsContent key={example.language} value={example.language} className="mt-3">
          <CodeBlock code={example.code} language={example.language} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
