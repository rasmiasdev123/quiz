import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Shield, GraduationCap, Filter, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, Input, Badge, Table, Spinner, Button } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { getUsers, updateUser } from '../../services/userService';
import { useUIStore } from '../../stores';
import { formatDate } from '../../utils/formatters';
import { USER_ROLES, ROUTES } from '../../utils/constants';

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUser, setUpdatingUser] = useState(null);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const options = selectedRole ? { role: selectedRole } : {};
      const response = await getUsers(options);
      setUsers(response?.documents || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role) => {
    return role === USER_ROLES.ADMIN ? Shield : GraduationCap;
  };

  const getRoleBadge = (role) => {
    return role === USER_ROLES.ADMIN ? (
      <Badge variant="purple">Admin</Badge>
    ) : (
      <Badge variant="default">Student</Badge>
    );
  };

  const handleUserNameClick = (userId) => {
    // Navigate to attempts page filtered by this user
    navigate(`${ROUTES.ADMIN.ATTEMPTS}?student=${userId}`);
  };

  const handleToggleActive = async (user) => {
    if (updatingUser === user.$id) return; // Prevent double clicks
    
    try {
      setUpdatingUser(user.$id);
      const newStatus = !user.is_active; // Toggle: if currently active (true), set to false, and vice versa
      
      await updateUser(user.$id, { is_active: newStatus });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.$id === user.$id ? { ...u, is_active: newStatus } : u
        )
      );
      
      showSuccess(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      showError('Failed to update user status');
    } finally {
      setUpdatingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">Manage users and their roles</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <NativeSelect
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            containerClassName="w-full sm:w-64"
          >
            <option value="">All Roles</option>
            <option value={USER_ROLES.ADMIN}>Admin</option>
            <option value={USER_ROLES.STUDENT}>Student</option>
          </NativeSelect>
        </div>
      </Card>

      {filteredUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedRole ? 'Try adjusting your filters' : 'No users registered yet'}
          </p>
        </Card>
      ) : (
        <Card variant="elevated" className="overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>User</Table.Head>
                <Table.Head>Email</Table.Head>
                <Table.Head>Role</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Joined</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const isActive = user.is_active !== false; // Default to true if not set
                const isUpdating = updatingUser === user.$id;
                
                return (
                  <Table.Row key={user.$id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                          <RoleIcon className="w-5 h-5 text-white" />
                        </div>
                        <button
                          onClick={() => handleUserNameClick(user.$id)}
                          className="font-medium text-gray-900 hover:text-indigo-600 hover:underline transition-colors cursor-pointer text-left"
                          title="View user's quiz attempts"
                        >
                          {user.name}
                        </button>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>{getRoleBadge(user.role)}</Table.Cell>
                    <Table.Cell>
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={isUpdating}
                        className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {isActive ? (
                          <div className="flex items-center gap-2">
                            <ToggleRight className="w-6 h-6 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                            <span className="text-sm text-gray-500 font-medium">Inactive</span>
                          </div>
                        )}
                      </button>
                    </Table.Cell>
                    <Table.Cell>{formatDate(user.$createdAt)}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default Users;

