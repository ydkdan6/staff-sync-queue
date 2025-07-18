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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {admin.name}</p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{staff.length}</div>
                <div className="text-sm text-muted-foreground">Staff Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Staff Management
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.smith@university.edu"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Computer Science"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : (editingStaff ? 'Update' : 'Add Staff')}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff members added yet
            </div>
          ) : (
            <div className="space-y-4">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{member.name}</h3>
                      <Badge variant="outline">{member.department}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        ID: {member.unique_id}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(member.unique_id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(member)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateUniqueId(member.id, member.name)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteStaff(member.id, member.name)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
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