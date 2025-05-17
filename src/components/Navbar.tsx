
"use client";

import Link from 'next/link';
import { Menu, Settings, LogOut, Search, Bell, Mail, Heart, Users, ChevronDown } from 'lucide-react'; // Added Users, ChevronDown
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState, useMemo, KeyboardEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const NavLink: React.FC<{ href: string; children: React.ReactNode; className?: string; onClick?: () => void }> = ({ href, children, className, onClick }) => (
  <Link href={href} onClick={onClick} className={cn("text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-md", className)}>
    {children}
  </Link>
);

const itSkillCategories = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Cloud Computing",
  "Cybersecurity",
  "AI & ML",
  "DevOps",
  "UI/UX Design",
  "Game Development",
  "QA & Testing",
  "Database Management",
];

const Navbar = () => {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const searchParamsHook = useSearchParams(); // Renamed to avoid conflict
  const pathname = usePathname();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State for Navbar search and filters (Recruiter specific)
  const [navSearchTerm, setNavSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minExperienceFilter, setMinExperienceFilter] = useState('');
  const [maxRateFilter, setMaxRateFilter] = useState('');

  useEffect(() => {
    setMounted(true);
    // Initialize nav filters from URL if on dashboard, otherwise clear them
    if (pathname === '/dashboard') {
      setNavSearchTerm(searchParamsHook.get('search') || '');
      setLocationFilter(searchParamsHook.get('location') || '');
      setMinExperienceFilter(searchParamsHook.get('minExp') || '');
      setMaxRateFilter(searchParamsHook.get('maxRate') || '');
    } else {
      setNavSearchTerm('');
      setLocationFilter('');
      setMinExperienceFilter('');
      setMaxRateFilter('');
    }
  }, [searchParamsHook, pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log you out. Please try again." });
    }
  };

  const handleSearchSubmit = () => {
    const queryParts = [];
    if (navSearchTerm.trim()) queryParts.push(`search=${encodeURIComponent(navSearchTerm.trim())}`);
    if (locationFilter.trim()) queryParts.push(`location=${encodeURIComponent(locationFilter.trim())}`);
    if (minExperienceFilter.trim()) queryParts.push(`minExp=${encodeURIComponent(minExperienceFilter.trim())}`);
    if (maxRateFilter.trim()) queryParts.push(`maxRate=${encodeURIComponent(maxRateFilter.trim())}`);
    router.push(`/dashboard${queryParts.length > 0 ? '?' + queryParts.join('&') : ''}`);
  };

  const handleKeyboardSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  }

  const handleCategoryClick = (category: string) => {
    const currentSearchTerm = category;
    const queryParts = [];
    queryParts.push(`search=${encodeURIComponent(currentSearchTerm)}`);
    if (locationFilter.trim()) queryParts.push(`location=${encodeURIComponent(locationFilter.trim())}`);
    if (minExperienceFilter.trim()) queryParts.push(`minExp=${encodeURIComponent(minExperienceFilter.trim())}`);
    if (maxRateFilter.trim()) queryParts.push(`maxRate=${encodeURIComponent(maxRateFilter.trim())}`);
    
    // Update local state for nav input as well
    setNavSearchTerm(currentSearchTerm); 
    router.push(`/dashboard?${queryParts.join('&')}`);
  };

  const publicNavItems = useMemo(() => [
    { href: "/solutions", label: "Solutions" },
    { href: "/#about", label: "About" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ], []);

  if (!mounted && loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-20 items-center justify-between px-4 md:px-6">
          <div className="h-8 w-32 rounded-md bg-muted animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-20 rounded-md bg-muted animate-pulse"></div>
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70 shadow-md">
      <div className="container flex h-20 items-center justify-between px-4 md:px-6">
        <Logo />

        <div className="flex-1 flex justify-center items-center md:px-8 lg:px-16">
          {user && userData?.role === 'recruiter' ? (
            <div className="relative w-full max-w-2xl flex items-center gap-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search talent (keywords, skills...)"
                className="w-full pl-10 pr-2 py-2 rounded-lg border-border/50 focus:border-primary shadow-sm bg-card/60 h-9 text-sm flex-grow"
                value={navSearchTerm}
                onChange={(e) => setNavSearchTerm(e.target.value)}
                onKeyDown={handleKeyboardSearch}
              />
              <Input
                type="text"
                placeholder="Location"
                className="w-1/4 pl-3 pr-1 py-2 rounded-lg border-border/50 focus:border-primary shadow-sm bg-card/60 h-9 text-xs"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                onKeyDown={handleKeyboardSearch}
              />
              <Input
                type="number"
                placeholder="Min Exp"
                className="w-[100px] pl-3 pr-1 py-2 rounded-lg border-border/50 focus:border-primary shadow-sm bg-card/60 h-9 text-xs"
                value={minExperienceFilter}
                onChange={(e) => setMinExperienceFilter(e.target.value)}
                onKeyDown={handleKeyboardSearch}
              />
               <Input
                type="number"
                placeholder="Max Rate £"
                className="w-[110px] pl-3 pr-1 py-2 rounded-lg border-border/50 focus:border-primary shadow-sm bg-card/60 h-9 text-xs"
                value={maxRateFilter}
                onChange={(e) => setMaxRateFilter(e.target.value)}
                onKeyDown={handleKeyboardSearch}
              />
              <Button size="sm" onClick={handleSearchSubmit} className="h-9 px-3 py-2 text-xs">Search</Button>
            </div>
          ) : !user && !loading ? (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {publicNavItems.map(item => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <div className="hidden md:block h-10"></div> 
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {user && userData?.role === 'recruiter' && (
            <div className="hidden md:flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">Messages</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                    <Heart className="h-5 w-5" />
                    <span className="sr-only">Favorites</span>
                </Button>
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <Avatar className="h-10 w-10 border-2 border-primary/50 hover:border-primary transition-colors">
                    <AvatarImage src={user.photoURL || ""} alt={userData?.fullName || user.displayName || user.email || "User"} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
                      {(userData?.fullName || user.displayName || user.email || "U").substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-md font-semibold leading-none text-foreground">{userData?.fullName || user.displayName || "User"}</p>
                    <p className="text-sm leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {userData?.role && <p className="text-xs leading-none text-accent-foreground bg-accent/80 px-2 py-0.5 rounded-full inline-block mt-1 capitalize self-start">{userData.role}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="py-2.5 px-3 text-sm cursor-pointer" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                 {userData?.role === 'recruiter' && (
                    <DropdownMenuItem className="py-2.5 px-3 text-sm cursor-pointer" asChild>
                       <Link href="/dashboard">Manage Talent</Link>
                    </DropdownMenuItem>
                  )}
                {userData?.role === 'talent' && (
                  <DropdownMenuItem className="py-2.5 px-3 text-sm cursor-pointer" asChild>
                    <Link href="/profile/create">My Profile</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="py-2.5 px-3 text-sm cursor-pointer" disabled>
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="py-2.5 px-3 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2.5 h-5 w-5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading && (
            <>
              <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10 px-4 py-2.5 rounded-md hidden sm:flex" asChild>
                <Link href="/auth/login">
                  Log In
                </Link>
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 py-2.5 rounded-md shadow-sm hover:shadow-primary/30 transition-all hidden sm:flex" asChild>
                <Link href="/auth/signup">
                  Get Started
                </Link>
              </Button>
            </>
          )}
          
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-muted-foreground" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background p-6">
                <div className="mb-6">
                  <Logo />
                </div>
                <nav className="flex flex-col space-y-3">
                  {user ? (
                    <>
                      <NavLink href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-base py-2">Dashboard</NavLink>
                      {userData?.role === 'talent' && (
                        <NavLink href="/profile/create" onClick={() => setMobileMenuOpen(false)} className="text-base py-2">My Profile</NavLink>
                      )}
                       {userData?.role === 'recruiter' && (
                         <NavLink href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-base py-2">Manage Talent</NavLink>
                      )}
                      <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-base py-2 text-destructive hover:bg-destructive/10 px-3">Log Out</Button>
                    </>
                  ) : (
                    <>
                      {publicNavItems.map(item => (
                        <NavLink key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="text-base py-2">
                          {item.label}
                        </NavLink>
                      ))}
                      <DropdownMenuSeparator className="my-2 bg-border/50" />
                      <NavLink href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-base py-2">Log In</NavLink>
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                        <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      {/* Skill Category Bar - Only for Recruiters */}
      {user && userData?.role === 'recruiter' && (
        <div className="container mx-auto px-4 md:px-6 py-2 border-t border-border/20 bg-background/70">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center justify-center md:justify-start">
            {itSkillCategories.map((category) => (
              <Button
                key={category}
                variant="link"
                size="sm"
                className="text-xs text-muted-foreground hover:text-primary hover:no-underline px-1.5 py-0.5 h-auto"
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
