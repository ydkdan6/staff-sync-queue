import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, User, MessageSquare, Sparkles } from 'lucide-react';


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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 flex items-center justify-center">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-green-200/30 to-emerald-300/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-teal-200/30 to-green-300/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-emerald-300/20 to-green-400/20 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-lg mx-auto relative backdrop-blur-sm bg-white/90 shadow-2xl border-0 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5"></div>
        
        {/* Top gradient accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
        
        <CardHeader className="relative z-10 text-center pb-8 pt-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
            Join Queue
          </CardTitle>
          <p className="text-slate-600 mt-2 font-medium">Connect with staff members instantly</p>
        </CardHeader>
        
        <CardContent className="relative z-10 px-8 pb-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="staff" className="text-slate-700 font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Select Staff Member
              </Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="h-12 border-2 border-green-100 focus:border-green-400 bg-gradient-to-r from-green-50/50 to-emerald-50/50 transition-all duration-300 hover:shadow-md">
                  <SelectValue placeholder="Choose a staff member" />
                </SelectTrigger>
                <SelectContent className="border-green-200">
                  {staff.map((member) => (
                    <SelectItem 
                      key={member.id} 
                      value={member.id}
                      className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{member.name}</span>
                        <span className="text-sm text-slate-500">{member.department}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="name" className="text-slate-700 font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12 border-2 border-green-100 focus:border-green-400 bg-gradient-to-r from-green-50/50 to-emerald-50/50 transition-all duration-300 hover:shadow-md"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="reason" className="text-slate-700 font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                Reason for Visit
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe why you need to see this staff member"
                rows={4}
                className="border-2 border-green-100 focus:border-green-400 bg-gradient-to-r from-green-50/50 to-emerald-50/50 transition-all duration-300 hover:shadow-md resize-none"
                required
              />
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full h-14 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-0"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Joining Queue...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  Join Queue
                </div>
              )}
            </Button>
          </div>

          {/* Decorative bottom element */}
          <div className="mt-8 flex justify-center">
            <div className="w-20 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full opacity-60"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}