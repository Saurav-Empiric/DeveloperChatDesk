'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, MessageCircle, Users } from 'lucide-react';

export default function AdminHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [animateTitle, setAnimateTitle] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/admin/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
    { href: '/admin/developers', label: 'Developers', icon: <Users className="w-4 h-4 mr-2" /> },
    { href: '/admin/chats', label: 'Chats', icon: <MessageCircle className="w-4 h-4 mr-2" /> },
  ];

  // Set current page title based on pathname
  useEffect(() => {
    const currentLink = navLinks.find(link => pathname.startsWith(link.href));
    if (currentLink) {
      setAnimateTitle(true);
      setPageTitle(currentLink.label);
      
      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setAnimateTitle(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-slate-800 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo and App Name */}
        <div className="flex items-center">
          <Link href="/admin/dashboard" className="text-xl font-semibold">
            Admin Portal
          </Link>
          <div className="hidden md:flex items-center ml-6">
            <span className="text-slate-400 mx-2">/</span>
            <span className={`font-medium ${animateTitle ? 'animate-fadeIn' : ''}`}>
              {pageTitle}
            </span>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`px-3 py-2 rounded transition-all duration-200 flex items-center ${
                  isActive 
                    ? 'bg-slate-700 text-white shadow-md' 
                    : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span className={`transition-all duration-300 ${isActive ? 'text-green-400' : ''}`}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
          
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-700 ml-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-700 text-white">
                      {getInitials(session.user.name || 'Admin')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-default">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {session.user.role}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer" 
                  onClick={handleSignOut}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <span className="text-sm mr-3 text-slate-300">{pageTitle}</span>
          <Button variant="ghost" className="text-white hover:bg-slate-700 p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 py-3 border-t border-slate-700">
          <div className="space-y-1 px-2">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`flex items-center px-3 py-2 rounded transition-colors ${
                    isActive 
                      ? 'bg-slate-700 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={isActive ? 'text-green-400' : ''}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
            
            {session?.user && (
              <div className="border-t border-slate-700 mt-4 pt-4 px-3">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-700 text-white">
                      {getInitials(session.user.name || 'Admin')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-gray-400">{session.user.email}</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={handleSignOut}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 