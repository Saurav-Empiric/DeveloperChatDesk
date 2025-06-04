'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface Developer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export default function DevelopersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/developer/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchDevelopers();
    }
  }, [status, session]);

  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/developers');
      setDevelopers(response.data.developers);
    } catch (error) {
      console.error('Error fetching developers:', error);
      setError('Failed to fetch developers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeveloper = async () => {
    if (!name || !email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      
      await axios.post('/api/developers', {
        name,
        email,
        password,
      });
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setOpenAddDialog(false);
      
      // Refresh the list
      fetchDevelopers();
      
      toast.success('Developer added successfully');
    } catch (error: any) {
      console.error('Error adding developer:', error);
      setFormError(error.response?.data?.error || 'Failed to add developer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDeveloper = async () => {
    if (!selectedDeveloper) return;
    
    try {
      await axios.delete(`/api/developers?id=${selectedDeveloper._id}`);
      
      // Refresh the list
      fetchDevelopers();
      
      toast.success('Developer deleted successfully');
    } catch (error) {
      console.error('Error deleting developer:', error);
      toast.error('Failed to delete developer');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedDeveloper(null);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Developers</h1>
          
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button>Add Developer</Button>
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
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddDeveloper}
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Developer'}
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
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the developer account and remove all chat assignments.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteDeveloper}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4">
              <Button variant="outline" onClick={fetchDevelopers} className="mt-4">
                Refresh List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 