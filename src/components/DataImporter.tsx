import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importGoPrepMenu } from '@/utils/importGoPrep';

const DataImporter = () => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; imported?: number; error?: string } | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    
    try {
      const result = await importGoPrepMenu();
      setResult(result);
      
      if (result.success) {
        toast({
          title: "Import Successful!",
          description: `Successfully imported ${result.imported} meals from GoPrep data.`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({ success: false, error: errorMessage });
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import GoPrep Data
        </CardTitle>
        <CardDescription>
          Import your complete menu data from GoPrep into the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleImport} 
          disabled={importing}
          className="w-full"
          size="lg"
        >
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Menu Data
            </>
          )}
        </Button>
        
        {result && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.success ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Successfully imported {result.imported} meals!</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>Error: {result.error}</span>
              </>
            )}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p><strong>This will:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Import 280+ meals from your GoPrep data</li>
            <li>Set correct prices and categories</li>
            <li>Mark active/inactive status</li>
            <li>Replace existing test data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataImporter;