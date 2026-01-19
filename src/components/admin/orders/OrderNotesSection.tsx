import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lock, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderNotesSectionProps {
  orderId: string;
  orderType: 'orders' | 'package_orders';
  customerNote: string | null | undefined;
  privateNote: string | null | undefined;
  onNotesUpdated?: () => void;
}

const OrderNotesSection: React.FC<OrderNotesSectionProps> = ({
  orderId,
  orderType,
  customerNote,
  privateNote,
  onNotesUpdated,
}) => {
  const { toast } = useToast();
  const [editedCustomerNote, setEditedCustomerNote] = useState(customerNote || '');
  const [editedPrivateNote, setEditedPrivateNote] = useState(privateNote || '');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingPrivate, setSavingPrivate] = useState(false);

  const hasCustomerChanges = editedCustomerNote !== (customerNote || '');
  const hasPrivateChanges = editedPrivateNote !== (privateNote || '');

  const handleSaveCustomerNote = async () => {
    setSavingCustomer(true);
    try {
      const { error } = await supabase
        .from(orderType)
        .update({ order_notes: editedCustomerNote || null })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Customer Notes Updated',
        description: 'The customer notes have been saved successfully.',
      });
      onNotesUpdated?.();
    } catch (error: any) {
      console.error('Error saving customer note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save customer notes.',
        variant: 'destructive',
      });
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSavePrivateNote = async () => {
    setSavingPrivate(true);
    try {
      const { error } = await supabase
        .from(orderType)
        .update({ private_note: editedPrivateNote || null })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Private Notes Updated',
        description: 'The private notes have been saved successfully.',
      });
      onNotesUpdated?.();
    } catch (error: any) {
      console.error('Error saving private note:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save private notes.',
        variant: 'destructive',
      });
    } finally {
      setSavingPrivate(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Customer Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Customer Notes
            </span>
            <Badge variant="secondary" className="text-xs font-normal">
              Visible to customer
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={editedCustomerNote}
            onChange={(e) => setEditedCustomerNote(e.target.value)}
            placeholder="Notes entered by the customer at checkout..."
            className="min-h-[80px] resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Included in order confirmation emails and visible in customer account.
            </p>
            {hasCustomerChanges && (
              <Button
                size="sm"
                onClick={handleSaveCustomerNote}
                disabled={savingCustomer}
                className="ml-2"
              >
                {savingCustomer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Private Notes */}
      <Card className="border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Private Notes
            </span>
            <Badge variant="outline" className="text-xs font-normal border-amber-300 text-amber-700 dark:text-amber-400">
              Admin only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={editedPrivateNote}
            onChange={(e) => setEditedPrivateNote(e.target.value)}
            placeholder="Internal notes for staff only..."
            className="min-h-[80px] resize-none text-sm bg-background"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Never shown to customers or included in any emails.
            </p>
            {hasPrivateChanges && (
              <Button
                size="sm"
                onClick={handleSavePrivateNote}
                disabled={savingPrivate}
                className="ml-2"
              >
                {savingPrivate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderNotesSection;
