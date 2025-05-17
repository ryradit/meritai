
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getTalentDocument, type UserProfileData } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Star, Linkedin, Github, Mail, Phone, CalendarDays, CheckCircle, Loader2, AlertTriangle, LogIn, UserPlus } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TalentProfilePage({ params }: { params: { talentId: string } }) {
  const { talentId } = params; // Destructure talentId here

  const { user: authUser, loading: authLoading, userData: authUserData } = useAuth();
  const router = useRouter();
  const [talentData, setTalentData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (authLoading) {
      // Still waiting for auth state to resolve, keep loading true.
      return;
    }

    // Auth state resolved.
    if (!authUser) {
      // User is not logged in. Show login prompt.
      setShowLoginPrompt(true);
      setIsLoading(false); // Stop general loading, show login prompt instead.
      return;
    }

    // User is logged in, hide login prompt if it was shown.
    setShowLoginPrompt(false);
    const fetchTalentData = async () => {
      setIsLoading(true); // Start loading talent data.
      setError(null);
      try {
        const profile = await getTalentDocument(talentId); // Use destructured talentId
        if (profile) {
          setTalentData(profile);
        } else {
          setError("Talent profile not found or you do not have permission to view it.");
        }
      } catch (err) {
        console.error("Error fetching talent profile:", err);
        setError("Failed to load talent profile. Please ensure you have permission or try again later.");
      }
      setIsLoading(false); // Finished loading talent data (or failed).
    };

    if (talentId) { // Use destructured talentId
      fetchTalentData();
    } else {
      setError("No talent ID provided.");
      setIsLoading(false);
    }
  }, [talentId, authUser, authLoading, router]); // Use destructured talentId in dependency array

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Profile...</p>
      </div>
    );
  }

  if (showLoginPrompt) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <Card className="max-w-md mx-auto shadow-xl bg-card/80 border-border/40 p-8">
          <AlertTriangle className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">Access Full Profile</h2>
          <p className="text-muted-foreground mb-8">
            Please log in or sign up to view the complete details of this talent profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href={`/auth/login?redirect=/profile/${talentId}`}>
                <LogIn className="mr-2 h-5 w-5" /> Log In
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/10">
              <Link href={`/auth/signup?redirect=/profile/${talentId}`}>
                <UserPlus className="mr-2 h-5 w-5" /> Sign Up
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Error Loading Profile</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/marketplace')} variant="outline">Back to Marketplace</Button>
      </div>
    );
  }

  if (!talentData) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Talent profile could not be loaded or was not found.
      </div>
    );
  }

  const techSkills = talentData.cvSkills && talentData.cvSkills.length > 0
    ? talentData.cvSkills
    : talentData.techStack?.split(',').map(s => s.trim()).filter(s => s) || [];

  const isRecruiterViewing = authUserData?.role === 'recruiter';

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-4xl mx-auto shadow-xl bg-card/80 border-border/40">
        <CardHeader className="pb-4 border-b border-border/30">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-28 h-28 border-4 border-primary shadow-lg">
              <AvatarImage src={talentData.profilePhotoUrl || ""} alt={talentData.fullName || "Talent"} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {(talentData.fullName || "T").substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-3xl font-bold text-foreground mb-1">{talentData.fullName || "N/A"}</CardTitle>
              <CardDescription className="text-lg text-primary mb-2">{talentData.headline || "N/A"}</CardDescription>
              <div className="flex items-center justify-center sm:justify-start text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mr-1.5 text-primary/80" />
                {talentData.country || "Location N/A"}
                 {talentData.timezone && <span className="ml-1">({talentData.timezone})</span>}
              </div>
               {talentData.talentTier && (
                 <Badge variant={talentData.talentTier === 'priority' ? 'default' : 'secondary'}
                        className={`capitalize text-xs ${talentData.talentTier === 'priority' ? 'bg-green-500/20 text-green-300 border-green-400/50' : 'bg-sky-500/20 text-sky-300 border-sky-400/50'}`}>
                    {talentData.talentTier.replace(/_/g, ' ')} Talent
                 </Badge>
               )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {talentData.professionalSummary && (
            <section>
              <h3 className="text-xl font-semibold text-foreground mb-2">Professional Summary</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{talentData.professionalSummary}</p>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">Key Info</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-primary/80" /> Years of Experience: <span className="font-medium text-foreground ml-1">{talentData.yearsOfExperience ?? "N/A"}</span></li>
                <li className="flex items-center"><Star className="h-4 w-4 mr-2 text-primary/80" /> Expected Rate: <span className="font-medium text-foreground ml-1">£{talentData.expectedMonthlyRateGBP?.toLocaleString() ?? "N/A"} / month</span></li>
                <li className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary/80" /> Availability: <span className="font-medium text-foreground ml-1">{talentData.availability || "N/A"}</span></li>
                {talentData.weightedTotalScore && (
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" /> Merit Score: <span className="font-medium text-green-400 ml-1">{talentData.weightedTotalScore}/100</span></li>
                )}
              </ul>
            </section>

            {techSkills.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold text-foreground mb-3">Core Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {techSkills.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-sm px-3 py-1 bg-muted/50 text-muted-foreground hover:bg-muted/80">{skill}</Badge>
                  ))}
                </div>
              </section>
            )}
          </div>

          {talentData.shortBio && (
             <section>
                <h3 className="text-xl font-semibold text-foreground mb-2">Short Bio</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{talentData.shortBio}</p>
            </section>
          )}

          {(talentData.linkedin || talentData.github || (isRecruiterViewing && talentData.email)) && (
            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">Connect</h3>
              <div className="flex flex-wrap gap-3">
                {talentData.linkedin && (
                  <Button variant="outline" size="sm" asChild className="border-primary/50 text-primary hover:bg-primary/10">
                    <Link href={talentData.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="mr-2 h-4 w-4" />LinkedIn</Link>
                  </Button>
                )}
                {talentData.github && (
                  <Button variant="outline" size="sm" asChild className="border-primary/50 text-primary hover:bg-primary/10">
                    <Link href={talentData.github} target="_blank" rel="noopener noreferrer"><Github className="mr-2 h-4 w-4" />GitHub</Link>
                  </Button>
                )}
                {isRecruiterViewing && talentData.email && (
                    <Button variant="outline" size="sm" asChild className="border-primary/50 text-primary hover:bg-primary/10">
                        <a href={`mailto:${talentData.email}`}><Mail className="mr-2 h-4 w-4" />Email Talent</a>
                    </Button>
                )}
              </div>
            </section>
          )}

          {isRecruiterViewing && talentData.interviewReportSummary && (
            <section>
                <h3 className="text-xl font-semibold text-foreground mb-3">AI Interview Report</h3>
                <Button asChild>
                    <Link href={`/report/${talentData.uid}`}>View Full Report</Link>
                </Button>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
