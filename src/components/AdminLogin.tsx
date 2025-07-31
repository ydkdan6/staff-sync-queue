import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield, Mail, Lock, ArrowLeft, UserPlus, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (user: any) => void;
  onBack: () => void;
  onSignup: () => void; // Add this for navigation to signup
}

export default function AdminLogin({ onLogin, onBack, onSignup }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user is admin using the auth user's ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id) // Use ID instead of email
          .eq('role', 'admin')
          .single();

        if (userError || !userData) {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Login Successful",
          description: `Welcome back, ${userData.name}!`,
        });
        onLogin(userData);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
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

      <div className="max-w-md mx-auto space-y-6 relative z-10 w-full">
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0 overflow-hidden relative">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5"></div>
          
          {/* Top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
          
          <CardHeader className="relative z-10 text-center pb-8 pt-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
              Admin Login
            </CardTitle>
            <p className="text-slate-600 mt-2 font-medium">Secure administrative access</p>
          </CardHeader>
          <CardContent className="relative z-10 px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  className="h-12 border-2 border-green-100 focus:border-green-400 bg-gradient-to-r from-green-50/50 to-emerald-50/50 transition-all duration-300 hover:shadow-md"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 border-2 border-green-100 focus:border-green-400 bg-gradient-to-r from-green-50/50 to-emerald-50/50 transition-all duration-300 hover:shadow-md pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-green-100/50 text-green-600 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-0"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Logging in...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    Login
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={onSignup}
                className="text-sm text-slate-600 hover:text-green-700 hover:bg-green-50/50 transition-all duration-300 p-2 rounded-lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Don't have an admin account? Create one
              </Button>
            </div>

            {/* Decorative element */}
            <div className="mt-8 flex justify-center">
              <div className="w-20 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full opacity-60"></div>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-12 border-2 border-green-200 text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-300 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Main
        </Button>
      </div>
    </div>
  );
}