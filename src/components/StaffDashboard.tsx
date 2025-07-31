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
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200';
      case 'called':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200';
      case 'skipped':
        return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const waitingCount = queueEntries.filter(entry => entry.status === 'waiting').length;
  const calledCount = queueEntries.filter(entry => entry.status === 'called').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-80 h-80 bg-gradient-to-r from-emerald-200/20 to-green-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-96 h-96 bg-gradient-to-r from-teal-200/20 to-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-r from-green-200/15 to-emerald-200/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 space-y-8 max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              Staff Dashboard
            </h1>
            <p className="text-green-600/80 mt-2 text-lg">Welcome, {staff.name}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={refreshing}
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 shadow-sm"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Queue Status & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue Status Card */}
          <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-green-100 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-green-500/5 border-b border-green-100">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-green-800">Queue Control</span>
                </div>
                <Badge className={queue?.status === 'open' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                }>
                  {queue?.status?.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                      {queueEntries.length}
                    </div>
                    <div className="text-sm text-green-600/70 font-medium">
                      Total in Queue
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {waitingCount}
                    </div>
                    <div className="text-sm text-amber-600/70 font-medium">
                      Waiting
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {calledCount}
                    </div>
                    <div className="text-sm text-blue-600/70 font-medium">
                      Called
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={callNextStudent}
                    disabled={loading || queueEntries.length === 0 || queue?.status === 'closed'}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Next
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleQueueStatus}
                    disabled={loading}
                    className={queue?.status === 'open' 
                      ? "border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 shadow-sm"
                      : "border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 shadow-sm"
                    }
                  >
                    {queue?.status === 'open' ? 'Close Queue' : 'Open Queue'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Clock className="h-8 w-8" />
                </div>
                <div className="text-2xl font-bold mb-2">
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="text-emerald-100 text-sm font-medium">
                  Current Time
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Entries */}
        <Card className="bg-white/90 backdrop-blur-sm border-green-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-green-500/5 border-b border-green-100">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-800">Current Queue</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {queueEntries.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-green-600/60 text-lg">No students in queue</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {queueEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="group bg-gradient-to-r from-white to-green-50/30 hover:from-green-50/30 hover:to-emerald-50/30 border border-green-100 hover:border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            #{entry.queue_number}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={`${getStatusColor(entry.status)} font-medium px-3 py-1 shadow-sm`}>
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </Badge>
                            {entry.status === 'waiting' && index === 0 && (
                              <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 animate-pulse">
                                Next in Line
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3 ml-18">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-green-100 rounded-lg">
                              <User className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="font-semibold text-green-800 text-lg">{entry.student_name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-green-700">{entry.reason}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-purple-100 rounded-lg">
                              <Clock className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex gap-4 text-sm text-green-600/80">
                              <span>Joined: {formatTime(entry.created_at)}</span>
                              {entry.called_at && (
                                <span>• Called: {formatTime(entry.called_at)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                        {entry.status === 'called' && (
                          <Button
                            size="sm"
                            onClick={() => completeVisit(entry.id)}
                            disabled={loading}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => skipStudent(entry.id)}
                          disabled={loading}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 shadow-sm"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}