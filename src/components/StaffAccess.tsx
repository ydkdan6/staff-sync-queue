import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaffAccessProps {
  onAccess: (staff: any) => void;
  onBack: () => void;
}

export default function StaffAccess({ onAccess, onBack }: StaffAccessProps) {
  const [uniqueId, setUniqueId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your unique ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('unique_id', uniqueId.trim().toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: "Access Denied",
          description: "Invalid unique ID. Please check and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Access Granted",
        description: `Welcome, ${data.name}!`,
      });
      onAccess(data);
    } catch (error) {
      console.error('Staff access error:', error);
      toast({
        title: "Error",
        description: "Failed to verify ID. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Staff Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unique-id">Unique ID</Label>
              <Input
                id="unique-id"
                type="text"
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                placeholder="Enter your unique ID"
                className="font-mono"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the unique ID provided by your administrator
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={onBack}
        className="w-full"
      >
        Back to Main
      </Button>
    </div>
  );
}