import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Shield, ShieldOff, Mail, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Import new generic components
import { GenericFiltersBar, StatsCardsGrid, GenericDataTable, GenericModal } from "@/components/common";
import type { StatCardData, ColumnDef, ActionItem } from "@/components/common";

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  roles: string[];
}

interface UserFilters {
  searchTerm: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  viewMode: "list" | "card";
}

const UserManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user");
  const { toast } = useToast();

  // Filter state
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: "",
    sortBy: "created_at",
    sortOrder: "desc",
    viewMode: "list"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all user data from auth.users (admin access required)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine the data
      const combinedUsers = authUsers?.users?.map(authUser => {
        const roles = userRoles?.filter(role => role.user_id === authUser.id).map(role => role.role) || [];
        return {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email || '',
          created_at: authUser.created_at,
          roles
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
  }, [users, filters.searchTerm]);

  // Stats data
  const statsData: StatCardData[] = useMemo(() => {
    const adminUsers = users.filter(u => u.roles.includes('admin'));
    const regularUsers = users.filter(u => !u.roles.includes('admin'));
    const recentUsers = users.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.created_at) > weekAgo;
    });

    return [
      {
        id: 'total',
        title: 'Total Users',
        value: users.length,
        icon: Users,
        iconColor: 'text-blue-500'
      },
      {
        id: 'admins',
        title: 'Admin Users',
        value: adminUsers.length,
        icon: Shield,
        iconColor: 'text-red-500',
        subtitle: `${regularUsers.length} regular users`
      },
      {
        id: 'recent',
        title: 'New This Week',
        value: recentUsers.length,
        icon: UserPlus,
        iconColor: 'text-green-500'
      },
      {
        id: 'active',
        title: 'Active Users',
        value: users.length, // All users are considered active for now
        icon: Mail,
        iconColor: 'text-orange-500'
      }
    ];
  }, [users]);

  // Table columns
  const columns: ColumnDef<User>[] = [
    {
      key: 'full_name',
      header: 'Name',
      accessor: (user) => (
        <div>
          <div className="font-medium">{user.full_name || 'No name'}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      )
    },
    {
      key: 'roles',
      header: 'Roles',
      accessor: (user) => (
        <div className="flex gap-1">
          {user.roles.length > 0 ? (
            user.roles.map((role, index) => (
              <Badge 
                key={index} 
                variant={role === 'admin' ? 'destructive' : 'secondary'}
              >
                {role}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">user</Badge>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Joined',
      cell: (value: string) => formatDate(value, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }
  ];

  // Table actions
  const actions: ActionItem<User>[] = [
    {
      label: 'Make Admin',
      icon: Shield,
      onClick: (user) => toggleUserRole(user.id, 'admin' as const, true),
      variant: 'outline',
      hidden: (user) => user.roles.includes('admin')
    },
    {
      label: 'Remove Admin',
      icon: ShieldOff,
      onClick: (user) => toggleUserRole(user.id, 'admin' as const, false),
      variant: 'destructive',
      hidden: (user) => !user.roles.includes('admin')
    }
  ];

  const toggleUserRole = async (userId: string, role: 'admin' | 'user' | 'moderator', add: boolean) => {
    try {
      if (add) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `User granted ${role} role`,
        });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `${role} role removed from user`,
        });
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // Here you would typically send an invite email
      // For now, we'll just show a success message
      toast({
        title: "Invite Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      
      setInviteEmail("");
      setIsInviteOpen(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const sortOptions = [
    { value: 'created_at', label: 'Date Joined' },
    { value: 'full_name', label: 'Name' },
    { value: 'email', label: 'Email' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCardsGrid 
        stats={statsData}
        columns={4}
        loading={loading}
      />

      {/* Filters */}
      <GenericFiltersBar
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        totalCount={users.length}
        filteredCount={filteredUsers.length}
        searchPlaceholder="Search users by name or email..."
        sortOptions={sortOptions}
        viewModes={['list']}
        entityName="user"
        entityNamePlural="users"
      />

      {/* Users Table */}
      <GenericDataTable
        data={filteredUsers}
        columns={columns}
        actions={actions}
        loading={loading}
        getRowId={(user) => user.id}
        emptyMessage="No users found"
        emptyDescription="Invite users to get started"
        emptyAction={{
          label: "Invite User",
          onClick: () => setIsInviteOpen(true)
        }}
      />

      {/* Invite User Modal */}
      <GenericModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        title="Invite User"
        description="Send an invitation to join the platform"
        size="sm"
        scrollable={false}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser}>
              Send Invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Initial Role</Label>
            <Select value={inviteRole} onValueChange={(value: "admin" | "user") => setInviteRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GenericModal>
    </div>
  );
};

export default UserManager;