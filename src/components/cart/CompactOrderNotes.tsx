import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface CompactOrderNotesProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const CompactOrderNotes: React.FC<CompactOrderNotesProps> = ({
  value,
  onChange,
  maxLength = 500,
}) => {
  return (
    <div className="border border-border/40 rounded-xl bg-muted/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Order notes
          <span className="text-xs font-normal ml-1">(optional)</span>
        </span>
      </div>
      <Textarea
        id="order-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Dietary requirements, delivery instructions, or anything else we should know"
        className="min-h-[80px] resize-none bg-background/50 text-sm"
        maxLength={maxLength}
      />
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

export default React.memo(CompactOrderNotes);
