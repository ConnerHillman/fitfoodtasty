import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";

interface CustomerNotesProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const CustomerNotes: React.FC<CustomerNotesProps> = ({
  value,
  onChange,
  placeholder = "Add any special requests, dietary notes, or delivery instructions...",
  maxLength = 500,
}) => {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5 text-primary" />
          Order Notes
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          id="customer-notes"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px] resize-none bg-background/50"
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Optional: Add pickup/delivery instructions or dietary notes.
          </span>
          <span className="text-xs text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerNotes;
