import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  name: string;
  department: string;
}

interface StudentFormProps {
  onSubmit: (queueEntry: any) => void;
}

export default function StudentForm({ onSubmit }: StudentFormProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, department')
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !studentName.trim() || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First get the queue for the selected staff
      const { data: queueData, error: queueError } = await supabase
        .from('queues')
        .select('id')
        .eq('staff_id', selectedStaffId)
        .eq('status', 'open')
        .single();

      if (queueError || !queueData) {
        toast({
          title: "Queue Unavailable",
          description: "This staff member's queue is currently closed",
          variant: "destructive",
        });
        return;
      }

      // Get next queue number
      const { data: nextNumberData, error: numberError } = await supabase
        .rpc('get_next_queue_number', { queue_uuid: queueData.id });

      if (numberError) throw numberError;

      // Insert queue entry
      const { data: entryData, error: entryError } = await supabase
        .from('queue_entries')
        .insert({
          queue_id: queueData.id,
          student_name: studentName.trim(),
          reason: reason.trim(),
          queue_number: nextNumberData,
          status: 'waiting'
        })
        .select()
        .single();

      if (entryError) throw entryError;

      toast({
        title: "Successfully Joined Queue!",
        description: `You are number ${nextNumberData} in the queue`,
      });

      onSubmit(entryData);
    } catch (error) {
      console.error('Error joining queue:', error);
      toast({
        title: "Error",
        description: "Failed to join queue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-semibold">
          Join Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff">Select Staff Member</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe why you need to see this staff member"
              rows={3}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Joining Queue...' : 'Join Queue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}