import { useState } from "react";
import { Button } from "@/components/ui/button";
import StudentForm from "@/components/StudentForm";
import StudentDashboard from "@/components/StudentDashboard";
import AdminLogin from "@/components/AdminLogin";
import AdminSignup from "@/components/AdminSignUp";
import StaffAccess from "@/components/StaffAccess";
import AdminDashboard from "@/components/AdminDashboard";
import StaffDashboard from "@/components/StaffDashboard";
import { ShieldCheck, Users } from "lucide-react";

type AppState = 'main' | 'student-dashboard' | 'admin-login' | 'admin-signup' | 'admin-dashboard' | 'staff-access' | 'staff-dashboard';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('main');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [queueEntry, setQueueEntry] = useState<any>(null);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setAppState('admin-dashboard');
  };

  const handleSignup = (user: any) => {
    setCurrentUser(user);
    setAppState('admin-dashboard');
  };

  const handleBack = () => {
    setAppState('main');
  };

  const renderCurrentView = () => {
    switch (appState) {
      case 'student-dashboard':
        return (
          <StudentDashboard
            queueEntry={queueEntry}
            onBack={() => setAppState('main')}
          />
        );
      case 'admin-login':
        return (
          <AdminLogin 
            onLogin={handleLogin}
            onBack={handleBack}
            onSignup={() => setAppState('admin-signup')}
          />
        );
      case 'admin-signup':
        return (
          <AdminSignup 
            onSignup={handleSignup}
            onBack={() => setAppState('admin-login')}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard
            admin={currentUser}
            onLogout={() => {
              setCurrentUser(null);
              setAppState('main');
            }}
          />
        );
      case 'staff-access':
        return (
          <StaffAccess
            onAccess={(staff) => {
              setCurrentUser(staff);
              setAppState('staff-dashboard');
            }}
            onBack={() => setAppState('main')}
          />
        );
      case 'staff-dashboard':
        return (
          <StaffDashboard
            staff={currentUser}
            onLogout={() => {
              setCurrentUser(null);
              setAppState('main');
            }}
          />
        );
      default:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-primary">
                Kaduna Polytechnic <br/>Computer Science Department<br/> Queue System
              </h1>
              <p className="text-muted-foreground text-lg">
                Join a queue to meet with department staff
              </p>
            </div>

            <StudentForm
              onSubmit={(entry) => {
                setQueueEntry(entry);
                setAppState('student-dashboard');
              }}
            />

            <div className="flex justify-center gap-4 pt-8">
              <Button
                variant="outline"
                onClick={() => setAppState('admin-login')}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Login
              </Button>
              <Button
                variant="outline"
                onClick={() => setAppState('staff-access')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Staff Access
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Index;