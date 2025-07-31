import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  RefreshCw,
  Copy,
  Settings
} from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  department: string;
  unique_id: string;
  created_at: string;
}

interface AdminDashboardProps {
  admin: any;
  onLogout: () => void;
}

export default function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
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
    if (!formData.name.trim() || !formData.email.trim() || !formData.department.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update({
            name: formData.name.trim(),
            email: formData.email.trim(),
            department: formData.department.trim()
          })
          .eq('id', editingStaff.id);

        if (error) throw error;

        toast({
          title: "Staff Updated",
          description: "Staff member has been updated successfully",
        });
      } else {
        // Add new staff
        const { data: newUniqueId, error: idError } = await supabase
          .rpc('generate_unique_staff_id');

        if (idError) throw idError;

        const { error } = await supabase
          .from('staff')
          .insert({
            name: formData.name.trim(),
            email: formData.email.trim(),
            department: formData.department.trim(),
            unique_id: newUniqueId
          });

        if (error) throw error;

        // Create a queue for the new staff member
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id')
          .eq('unique_id', newUniqueId)
          .single();

        if (!staffError && staffData) {
          await supabase
            .from('queues')
            .insert({
              staff_id: staffData.id,
              status: 'open'
            });
        }

        toast({
          title: "Staff Added",
          description: `Staff member added with ID: ${newUniqueId}`,
        });
      }

      fetchStaff();
      resetForm();
    } catch (error: any) {
      console.error('Error saving staff:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to delete ${staffName}? This will remove all their queue data.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Staff Deleted",
        description: "Staff member has been removed successfully",
      });
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateUniqueId = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to regenerate the unique ID for ${staffName}? They will need the new ID to access their dashboard.`)) {
      return;
    }

    setLoading(true);
    try {
      const { data: newUniqueId, error: idError } = await supabase
        .rpc('generate_unique_staff_id');

      if (idError) throw idError;

      const { error } = await supabase
        .from('staff')
        .update({ unique_id: newUniqueId })
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "ID Regenerated",
        description: `New unique ID: ${newUniqueId}`,
      });
      fetchStaff();
    } catch (error) {
      console.error('Error regenerating ID:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate unique ID",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Unique ID copied to clipboard",
    });
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', department: '' });
    setEditingStaff(null);
    setShowAddDialog(false);
  };

  const startEdit = (staffMember: Staff) => {
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      department: staffMember.department
    });
    setEditingStaff(staffMember);
    setShowAddDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-emerald-200/30 to-green-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-teal-200/30 to-emerald-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 space-y-8 max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-green-600/80 mt-2 text-lg">Welcome, {admin.name}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 shadow-sm"
          >
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{staff.length}</div>
                  <div className="text-emerald-100 text-sm font-medium">Staff Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Management */}
        <Card className="bg-white/90 backdrop-blur-sm border-green-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-green-500/5 border-b border-green-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-green-800">Staff Management</span>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => resetForm()}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-sm border-green-100">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-green-800">
                      {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                    </DialogTitle>
                  </DialogHeader>
                  <form className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-green-700 font-medium">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Dr. John Smith"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-400/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-green-700 font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john.smith@university.edu"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-400/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="department" className="text-green-700 font-medium">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Computer Science"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-400/20"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
                      >
                        {loading ? 'Saving...' : (editingStaff ? 'Update' : 'Add Staff')}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetForm}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {staff.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-green-600/60 text-lg">No staff members added yet</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {staff.map((member, index) => (
                  <div
                    key={member.id}
                    className="group bg-gradient-to-r from-white to-green-50/50 hover:from-green-50/50 hover:to-emerald-50/50 border border-green-100 hover:border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-green-800 text-lg">{member.name}</h3>
                            <Badge 
                              variant="outline" 
                              className="border-green-200 text-green-700 bg-green-50/50 font-medium"
                            >
                              {member.department}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-green-600/80 mb-4 ml-15">{member.email}</p>
                        <div className="flex items-center gap-3 ml-15">
                          <Badge 
                            variant="secondary" 
                            className="font-mono bg-gradient-to-r from-emerald-100 to-green-100 text-green-800 border border-green-200 px-3 py-1"
                          >
                            ID: {member.unique_id}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(member.unique_id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-100/50 transition-all duration-200"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(member)}
                          disabled={loading}
                          className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 shadow-sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateUniqueId(member.id, member.name)}
                          disabled={loading}
                          className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 shadow-sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStaff(member.id, member.name)}
                          disabled={loading}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
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