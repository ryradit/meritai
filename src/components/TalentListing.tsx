
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, MapPin, Star, Search, Loader2, AlertTriangle } from "lucide-react";
import { getListedTalentProfiles, type UserProfileData } from "@/services/userService";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const TalentMarketplaceCard: React.FC<{ talent: UserProfileData }> = ({ talent }) => {
  const techSkills = talent.cvSkills && talent.cvSkills.length > 0
    ? talent.cvSkills
    : talent.techStack?.split(',').map(s => s.trim()).filter(s => s) || [];

  const matchPercentage = talent.weightedTotalScore ?? "N/A";
  let matchBadgeColor = "text-yellow-400 border-yellow-400";

  if (typeof matchPercentage === 'number') {
    if (matchPercentage >= 90) {
        matchBadgeColor = "text-green-400 border-green-400 bg-green-500/10";
    } else if (matchPercentage >= 85) {
        matchBadgeColor = "text-sky-400 border-sky-400 bg-sky-500/10";
    } else if (matchPercentage >= 80) {
        matchBadgeColor = "text-yellow-400 border-yellow-400 bg-yellow-500/10";
    } else {
         matchBadgeColor = "text-orange-400 border-orange-400 bg-orange-500/10";
    }
  }

  return (
    <Card className="bg-card/70 border-border/40 shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
        <Avatar className="w-12 h-12 border-2 border-primary/30">
          <AvatarImage src={talent.profilePhotoUrl || ""} alt={talent.fullName || "Talent"} />
          <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
            {(talent.fullName || "T").substring(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-foreground mb-0.5">{talent.fullName || "N/A"}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{talent.headline || "N/A"}</CardDescription>
        </div>
        {matchPercentage !== "N/A" && (
          <Badge variant="outline" className={`text-xs font-semibold py-1 px-2 ${matchBadgeColor}`}>
            {matchPercentage}% Match
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-3 pt-2 pb-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
          {talent.country || "Location N/A"}
        </div>

        {techSkills.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Top Skills:</h4>
            <div className="flex flex-wrap gap-1.5">
              {techSkills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="px-2 py-0.5 text-xs bg-muted/50 text-muted-foreground hover:bg-muted/80">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
            <div className="flex items-center">
                <Briefcase className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                {talent.yearsOfExperience ?? "N/A"} yrs exp.
            </div>
            <div className="flex items-center">
                <Star className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                £{talent.expectedMonthlyRateGBP?.toLocaleString() ?? "N/A"}/mo
            </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4 px-4">
        <Button className="w-full bg-primary/80 hover:bg-primary text-primary-foreground py-2.5 text-sm" asChild>
          <Link href={`/profile/${talent.uid}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

interface TalentListingProps {
  externalSearchTerm?: string;
  locationFilter?: string;
  minExperienceFilter?: string;
  maxRateFilter?: string;
  availabilityFilter?: string; 
}

export default function TalentListing({
  externalSearchTerm = "",
  locationFilter = "",
  minExperienceFilter = "",
  maxRateFilter = "",
  availabilityFilter = "",
}: TalentListingProps) {
  const [allTalents, setAllTalents] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTalents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTalents = await getListedTalentProfiles();
        setAllTalents(fetchedTalents);
      } catch (err: any) {
        console.error("Failed to fetch talent profiles:", err);
        let detailedError = "An unexpected error occurred while loading talent profiles. Please try again later.";
        const lowerCaseMessage = err.message?.toLowerCase() || "";

        if (lowerCaseMessage.includes("permission") || lowerCaseMessage.includes("missing or insufficient permissions")) {
            detailedError = "Could not load talent profiles. This can be due to Firestore security rules or missing database indexes.\n\n1. Firestore Security Rules: Ensure your rules allow 'list' operations on the '/talents' collection. For public marketplace viewing, this might mean allowing unauthenticated reads. For authenticated access (e.g., by recruiters), ensure the rule is correctly configured.\n\n2. Composite Indexes: For queries with multiple filters and ordering (like 'talentTier' and 'weightedTotalScore' on the 'talents' collection), Firestore requires composite indexes. Check the Firebase console (Firestore > Indexes tab) for error messages or prompts to create the necessary index for the 'talents' collection.";
        } else if (lowerCaseMessage.includes("index")) {
            detailedError = "Failed to load talent profiles because a required Firestore index is missing for the 'talents' collection. " +
                            "Please check the Firebase console (Firestore > Indexes tab) for index creation prompts related to this query. The query may filter by 'talentTier' and order by 'weightedTotalScore'.";
        } else {
            detailedError = `Failed to load talent profiles: ${err.message || "Unknown error"}`;
        }
        setError(detailedError);
      }
      setIsLoading(false);
    };
    fetchTalents();
  }, []);

  const filteredTalents = allTalents.filter((talent) => {
    const searchTermLower = externalSearchTerm.toLowerCase();
    const locationFilterLower = locationFilter.toLowerCase();
    const minExp = minExperienceFilter ? Number(minExperienceFilter) : null;
    const maxRate = maxRateFilter ? Number(maxRateFilter) : null;
    const availabilityFilterLower = availabilityFilter.toLowerCase();

    // Keyword search
    if (searchTermLower) {
      const talentName = talent.fullName?.toLowerCase() || "";
      const talentHeadline = talent.headline?.toLowerCase() || "";
      const cvSkillsString = (talent.cvSkills || []).join(" ").toLowerCase();
      const techStackString = (talent.techStack || "").toLowerCase();
      const combinedTalentKeywords = `${cvSkillsString} ${techStackString}`.trim();

      let keywordMatch = false;
      if (talentName.includes(searchTermLower) || talentHeadline.includes(searchTermLower)) {
        keywordMatch = true;
      } else if (searchTermLower.includes(" & ")) {
        const subTerms = searchTermLower.split(" & ").map(st => st.trim()).filter(st => st);
        if (subTerms.length > 0) {
          keywordMatch = subTerms.some(subTerm => 
            combinedTalentKeywords.includes(subTerm) ||
            (subTerm === "ai" && combinedTalentKeywords.includes("artificial intelligence")) ||
            (subTerm === "ml" && combinedTalentKeywords.includes("machine learning"))
          );
        }
      } else {
        keywordMatch = combinedTalentKeywords.includes(searchTermLower) ||
                       (searchTermLower === "ai" && combinedTalentKeywords.includes("artificial intelligence")) ||
                       (searchTermLower === "ml" && combinedTalentKeywords.includes("machine learning"));
      }
      if (!keywordMatch) return false;
    }

    // Location filter
    if (locationFilterLower && !(talent.country?.toLowerCase().includes(locationFilterLower))) {
      return false;
    }

    // Min Experience filter
    if (minExp !== null && (talent.yearsOfExperience === undefined || talent.yearsOfExperience < minExp)) {
      return false;
    }
    
    // Max Rate filter
    if (maxRate !== null && (talent.expectedMonthlyRateGBP === undefined || talent.expectedMonthlyRateGBP > maxRate)) {
      return false;
    }

    // Availability filter
    if (availabilityFilterLower && availabilityFilterLower !== "all" && 
        !(talent.availability?.toLowerCase() === availabilityFilterLower)) {
      return false;
    }

    return true;
  });


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading talent profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
       <Alert variant="destructive" className="max-w-3xl mx-auto my-10 bg-destructive/10 border-destructive/30 text-destructive-foreground">
        <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
        <AlertTitle className="font-semibold text-lg text-destructive-foreground">Error Loading Talent Profiles</AlertTitle>
        <AlertDescription className="whitespace-pre-line text-sm mt-2 text-destructive-foreground/90">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {filteredTalents.length === 0 && !isLoading && (
         <div className="text-center py-20">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Talent Found</h3>
            <p className="text-muted-foreground">
            No talent profiles match your current search and filter criteria.
            </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTalents.map((talent) => (
          <TalentMarketplaceCard key={talent.uid} talent={talent} />
        ))}
      </div>
    </div>
  );
}

    