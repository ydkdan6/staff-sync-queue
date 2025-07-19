import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Clock, User, FileText, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QueueEntry {
  id: string;
  queue_id: string;
  queue_number: number;
  student_name: string;
  reason: string;
  status: 'waiting' | 'called' | 'skipped' | 'completed';
  called_at: string | null;
  queue: {
    staff: {
      name: string;
    };
  };
}

interface StudentDashboardProps {
  queueEntry: QueueEntry;
  onBack: () => void;
}

export default function StudentDashboard({ queueEntry, onBack }: StudentDashboardProps) {
  const [currentEntry, setCurrentEntry] = useState<QueueEntry>(queueEntry);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { toast } = useToast();

  // Save queue entry to sessionStorage on mount and when it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('currentQueueEntry', JSON.stringify(currentEntry));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  }, [currentEntry]);

  // Load queue entry from sessionStorage on page refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem('currentQueueEntry', JSON.stringify(currentEntry));
      } catch (error) {
        console.error('Error saving to sessionStorage on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentEntry]);

  // Check if there's a saved queue entry on component mount (for page refresh)
  useEffect(() => {
    try {
      const savedEntry = sessionStorage.getItem('currentQueueEntry');
      if (savedEntry && !queueEntry.id) {
        const parsedEntry = JSON.parse(savedEntry);
        setCurrentEntry(parsedEntry);
      }
    } catch (error) {
      console.error('Error loading from sessionStorage:', error);
    }
  }, [queueEntry.id]);

  useEffect(() => {
    // Set up real-time subscription for queue updates
    const channel = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `id=eq.${currentEntry.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedEntry = payload.new as any;
            setCurrentEntry(prev => ({ ...prev, ...updatedEntry }));
            
            if (updatedEntry.status === 'called' && currentEntry.status !== 'called') {
              playNotificationSound();
              toast({
                title: "You've been called!",
                description: "Please proceed to the staff member. You have 5 minutes to respond.",
                variant: "default",
              });
              setTimeRemaining(5 * 60); // 5 minutes in seconds
            }
          } else if (payload.eventType === 'DELETE') {
            // Clear sessionStorage when removed from queue
            try {
              sessionStorage.removeItem('currentQueueEntry');
            } catch (error) {
              console.error('Error clearing sessionStorage:', error);
            }
            toast({
              title: "Removed from queue",
              description: "You have been removed from the queue.",
              variant: "destructive",
            });
            onBack();
          }
        }
      )
      .subscribe();

    // Calculate initial position and wait time
    calculatePosition();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEntry.id]);

  useEffect(() => {
    // Update position when other queue entries change
    const positionChannel = supabase
      .channel('position-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries'
        },
        () => {
          calculatePosition();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(positionChannel);
    };
  }, []);

  useEffect(() => {
    // Countdown timer for when called
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const calculatePosition = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('queue_number, status')
        .eq('queue_id', currentEntry.queue_id)
        .lt('queue_number', currentEntry.queue_number)
        .in('status', ['waiting', 'called']);

      if (error) throw error;

      const position = data.length + 1;
      setCurrentPosition(position);
      setEstimatedWait(position * 5); // 5 minutes per person
    } catch (error) {
      console.error('Error calculating position:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/audio/notification.wav');
      
      // Set volume and other properties
      audio.volume = 0.7;
      audio.preload = 'auto';
      
      // Play with error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Notification sound played successfully');
          })
          .catch((error) => {
            console.error('Error playing notification sound:', error);
            // Fallback: try to create a simple beep sound
            createFallbackSound();
          });
      }
    } catch (error) {
      console.error('Error creating audio element:', error);
      // Fallback: try to create a simple beep sound
      createFallbackSound();
    }
  };

  const createFallbackSound = () => {
    try {
      // Create a simple beep using Web Audio API as fallback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz tone
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error creating fallback sound:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const handleBackClick = () => {
    // Clear sessionStorage when manually going back
    try {
      sessionStorage.removeItem('currentQueueEntry');
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
    onBack();
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                #{currentEntry.queue_number}
              </div>
              <div className="text-sm text-muted-foreground">
                Your Number
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {currentPosition}
              </div>
              <div className="text-sm text-muted-foreground">
                Current Position
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={getStatusColor(currentEntry.status)}>
              {currentEntry.status.charAt(0).toUpperCase() + currentEntry.status.slice(1)}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Estimated wait: {estimatedWait} minutes
            </span>
          </div>

          {currentEntry.status === 'called' && timeRemaining !== null && (
            <div className="p-4 bg-[hsl(var(--queue-warning))] text-black rounded-lg animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 animate-bounce" />
                <span className="font-medium">You've been called!</span>
              </div>
              <div className="text-sm">
                Time remaining to respond: {formatTime(timeRemaining)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visit Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">Staff:</span> {currentEntry.queue?.staff?.name}
          </div>
          <div>
            <span className="font-medium">Name:</span> {currentEntry.student_name}
          </div>
          <div>
            <span className="font-medium">Reason:</span> {currentEntry.reason}
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={handleBackClick}
        className="w-full"
      >
        Back to Main
      </Button>
    </div>
  );
}