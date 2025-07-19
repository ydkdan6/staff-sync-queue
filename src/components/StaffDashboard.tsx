import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Phone, 
  SkipForward, 
  X, 
  Clock,
  User,
  FileText,
  RefreshCw
} from 'lucide-react';

interface QueueEntry {
  id: string;
  queue_number: number;
  student_name: string;
  reason: string;
  status: 'waiting' | 'called' | 'skipped' | 'completed';
  called_at: string | null;
  created_at: string;
}

interface Queue {
  id: string;
  status: 'open' | 'closed';
}

interface StaffDashboardProps {
  staff: any;
  onLogout: () => void;
}

export default function StaffDashboard({ staff, onLogout }: StaffDashboardProps) {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Memoized function to fetch queue entries for a specific queue ID
  const fetchQueueEntries = useCallback(async (queueId: string) => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('queue_id', queueId)
        .in('status', ['waiting', 'called'])
        .order('queue_number');

      if (error) throw error;
      setQueueEntries(data || []);
    } catch (error) {
      console.error('Error fetching queue entries:', error);
      toast({
        title: "Error",
        description: "Failed to load queue entries",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchQueue = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('staff_id', staff.id)
        .single();

      if (error) throw error;
      
      setQueue(data);
      
      // Fetch queue entries after successfully getting queue data
      if (data?.id) {
        await fetchQueueEntries(data.id);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast({
        title: "Error",
        description: "Failed to load queue information",
        variant: "destructive",
      });
    }
  }, [staff.id, fetchQueueEntries, toast]);

  // Manual refresh function
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchQueue();
      toast({
        title: "Refreshed",
        description: "Queue data has been updated",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('staff-queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries'
        },
        () => {
          // Refresh queue entries when there are changes
          if (queue?.id) {
            fetchQueueEntries(queue.id);
          }
        }
      )
      .subscribe();

    // Clean up unresponsive students every minute
    const interval = setInterval(async () => {
      await supabase.rpc('handle_unresponsive_students');
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchQueue, queue?.id, fetchQueueEntries]);

  const callNextStudent = async () => {
    const nextStudent = queueEntries.find(entry => entry.status === 'waiting');
    if (!nextStudent) {
      toast({
        title: "No Students Waiting",
        description: "There are no students in the queue to call",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({
          status: 'called',
          called_at: new Date().toISOString()
        })
        .eq('id', nextStudent.id);

      if (error) throw error;

      toast({
        title: "Student Called",
        description: `${nextStudent.student_name} has been notified`,
      });
    } catch (error) {
      console.error('Error calling student:', error);
      toast({
        title: "Error",
        description: "Failed to call student",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const skipStudent = async (studentId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ status: 'skipped' })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Student Skipped",
        description: "Student has been moved to skipped status",
      });
    } catch (error) {
      console.error('Error skipping student:', error);
      toast({
        title: "Error",
        description: "Failed to skip student",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completeVisit = async (studentId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ status: 'completed' })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Visit Completed",
        description: "Student visit has been marked as completed",
      });
    } catch (error) {
      console.error('Error completing visit:', error);
      toast({
        title: "Error",
        description: "Failed to complete visit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleQueueStatus = async () => {
    if (!queue) return;

    setLoading(true);
    try {
      const newStatus = queue.status === 'open' ? 'closed' : 'open';
      const { error } = await supabase
        .from('queues')
        .update({ status: newStatus })
        .eq('id', queue.id);

      if (error) throw error;

      setQueue({ ...queue, status: newStatus });
      toast({
        title: `Queue ${newStatus === 'open' ? 'Opened' : 'Closed'}`,
        description: `Your queue is now ${newStatus}`,
      });
    } catch (error) {
      console.error('Error toggling queue status:', error);
      toast({
        title: "Error",
        description: "Failed to update queue status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-[hsl(var(--queue-waiting))] text-black';
      case 'called':
        return 'bg-[hsl(var(--queue-called))] text-black';
      case 'skipped':
        return 'bg-[hsl(var(--queue-warning))] text-black';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {staff.name}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Queue Status
            </div>
            <Badge className={queue?.status === 'open' ? 'bg-[hsl(var(--queue-success))] text-white' : 'bg-destructive text-destructive-foreground'}>
              {queue?.status?.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {queueEntries.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Students in Queue
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={callNextStudent}
                disabled={loading || queueEntries.length === 0 || queue?.status === 'closed'}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Call Next
              </Button>
              <Button
                variant="outline"
                onClick={toggleQueueStatus}
                disabled={loading}
              >
                {queue?.status === 'open' ? 'Close Queue' : 'Open Queue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students in queue
            </div>
          ) : (
            <div className="space-y-4">
              {queueEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono">
                        #{entry.queue_number}
                      </Badge>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.student_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{entry.reason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Joined: {formatTime(entry.created_at)}
                        </span>
                        {entry.called_at && (
                          <span className="text-sm text-muted-foreground">
                            • Called: {formatTime(entry.called_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {entry.status === 'called' && (
                      <Button
                        size="sm"
                        onClick={() => completeVisit(entry.id)}
                        disabled={loading}
                        className="bg-[hsl(var(--queue-success))] text-white hover:bg-[hsl(var(--queue-success))]/90"
                      >
                        Complete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => skipStudent(entry.id)}
                      disabled={loading}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}