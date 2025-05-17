
"use client";

import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserCheck, Code, Star } from "lucide-react";
import TalentListing from "@/components/TalentListing"; // Import the new component

export default function TalentMarketplacePage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 md:py-16">
      <div className="container mx-auto px-4">
        <section className="text-center mb-12 md:mb-16">
           <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <ShieldCheck className="h-5 w-5" /> Pre-vetted Elite Talent
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Talent Marketplace
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Browse our curated selection of top tech professionals, all vetted through our AI-powered assessment process.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Badge variant="default" className="text-sm py-1.5 px-3 shadow-md bg-green-500/20 text-green-300 border-green-400/50">
                <UserCheck className="h-4 w-4 mr-1.5" /> AI-Vetted
            </Badge>
            <Badge variant="default" className="text-sm py-1.5 px-3 shadow-md bg-sky-500/20 text-sky-300 border-sky-400/50">
                <Star className="h-4 w-4 mr-1.5" /> Top Tier Talent
            </Badge>
             <Badge variant="default" className="text-sm py-1.5 px-3 shadow-md bg-purple-500/20 text-purple-300 border-purple-400/50">
                <Code className="h-4 w-4 mr-1.5" /> Senior Engineers
            </Badge>
          </div>
        </section>

        <TalentListing /> {/* Use the reusable component here */}

      </div>
    </div>
  );
}
