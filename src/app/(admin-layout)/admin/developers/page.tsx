'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addDeveloper, deleteDeveloper, getDevelopers } from '@/services/developerService';

export default function DevelopersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/developer/dashboard');
    }
  }, [status, session, router]);

  // React Query for fetching developers
  const {
    data,
    isLoading: loading,
    error: fetchError,
    refetch: refetchDevelopers
  } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const response = await getDevelopers();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    enabled: status === 'authenticated' && session?.user?.role === 'admin',
  });

  const developers = data?.developers || [];
  const error = fetchError instanceof Error ? fetchError.message :
    (fetchError ? 'Failed to fetch developers' : null);

  // React Query mutation for adding developer
  const addDeveloperMutation = useMutation({
    mutationFn: async (developerData: DeveloperData) => {
      const response = await addDeveloper(developerData);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (data) => {
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setOpenAddDialog(false);

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['developers'] });
      toast.success(data.message || 'Developer added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding developer:', error);
      setFormError(error.message || 'Failed to add developer');
    }
  });

  // React Query mutation for deleting developer
  const deleteDeveloperMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteDeveloper(id);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: (data) => {
      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['developers'] });
      setDeleteDialogOpen(false);
      setSelectedDeveloper(null);
      toast.success(data.message || 'Developer deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting developer:', error);
      toast.error(error.message || 'Failed to delete developer');
      setDeleteDialogOpen(false);
      setSelectedDeveloper(null);
    }
  });

  const handleAddDeveloper = async () => {
    if (!name || !email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    setFormError(null);
    addDeveloperMutation.mutate({ name, email, password });
  };

  const handleDeleteDeveloper = async () => {
    if (!selectedDeveloper) return;
    deleteDeveloperMutation.mutate(selectedDeveloper._id);
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Developers</h1>

          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button className='cursor-pointer'>Add Developer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Developer</DialogTitle>
                <DialogDescription>
                  Create a new developer account. They will be able to login and manage assigned clients.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Developer's name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                  />
                </div>

                {formError && (
                  <div className="text-red-500 text-sm">{formError}</div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenAddDialog(false)}
                  disabled={addDeveloperMutation.isPending}
                  className='cursor-pointer'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDeveloper}
                  disabled={addDeveloperMutation.isPending}
                  className='cursor-pointer'
                >
                  {addDeveloperMutation.isPending ? 'Adding...' : 'Add Developer1'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Developers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading developers...</p>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : developers.length === 0 ? (
              <p>No developers found. Add your first developer to get started.</p>
            ) : (
              <div className="space-y-4">
                {developers.map((developer) => (
                  <div
                    key={developer._id}
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium">{developer.userId.name}</h3>
                      <p className="text-sm text-gray-500">{developer.userId.email}</p>
                    </div>

                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setSelectedDeveloper(developer)}
                          className='cursor-pointer'
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the developer account
                            and remove their data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setSelectedDeveloper(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteDeveloper}
                            disabled={deleteDeveloperMutation.isPending}
                          >
                            {deleteDeveloperMutation.isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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