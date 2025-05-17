
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { professionalSummarySuggester } from "@/ai/flows/professional-summary-suggester";
import { updateUserDocument, type UserRole } from "@/services/userService";
import * as z from "zod";
import { analyzeCv } from "@/ai/flows/cv-analyzer";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// import { TagInput } from "@/components/ui/tag-input"; // Assuming a TagInput component exists - currently placeholder
import FileUpload from "@/components/FileUpload"; 
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";


const profileFormSchema = z
  .object({
    fullName: z.string().min(2, {
 message: "Full name must be at least 2 characters.",
 }),
    country: z.string().min(1, {
      message: "Country is required.",
 }),
    timezone: z.string().min(1, {
 message: "Timezone is required.",
    }),
    headline: z.string().min(10, {
      message: "Headline must be at least 10 characters.",
    }),
    professionalSummary: z.string().min(50, {
      message: "Professional Summary must be at least 50 characters.",
    }),
    yearsOfExperience: z
      .number({
        required_error: "Years of Experience is required.",
        invalid_type_error: "Years of Experience must be a number.",
      })
      .min(0, { message: "Years of Experience cannot be negative." }),
    techStack: z.string().min(1, { message: "Tech Stack is required." }),
    linkedin: z.string().url({ message: "Invalid LinkedIn URL." }).optional().or(z.literal("")),
    github: z.string().url({ message: "Invalid GitHub URL." }).optional().or(z.literal("")),
    cv: z.any().refine((dataUri) => typeof dataUri === 'string' && dataUri.startsWith('data:'), { message: "CV upload is required and must be a valid data URI." })
    , 
    expectedMonthlyRateGBP: z
      .number({
        required_error: "Expected Monthly Rate is required.",
        invalid_type_error: "Expected Monthly Rate must be a number.",
      })
      .min(0, { message: "Expected Monthly Rate cannot be negative." }),
    availability: z.enum(
      ["Immediately", "2 Weeks Notice Period", "1 Month Notice Period", "2 Months Notice Period"],
      { required_error: "Availability is required." }
    ),
  })
  .refine((data) => data.linkedin || data.github, {
    message: "Either LinkedIn or GitHub profile link is required.",
    path: ["linkedin"], 
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestingSummary, setIsSuggestingSummary] = useState(false);
  const { user, userData } = useAuth(); 

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: userData?.fullName || "",
      country: userData?.country || "",
      timezone: userData?.timezone || "",
      headline: userData?.headline || "",
      professionalSummary: userData?.professionalSummary || "",
      yearsOfExperience: userData?.yearsOfExperience || 0,
      techStack: userData?.techStack || "",
      linkedin: userData?.linkedin || "",
      github: userData?.github || "",
      expectedMonthlyRateGBP: userData?.expectedMonthlyRateGBP || 0,
      availability: userData?.availability as any || "" as any, 
      cv: null, // CV is not pre-filled, user must re-upload if editing
    },
  });

  const handleGenerateSummarySuggestions = async () => {
    const headline = form.getValues("headline");
    if (!headline || headline.length < 10) {
      toast({
        variant: "destructive",
        title: "Headline too short",
        description: "Please provide a more detailed headline to generate summary suggestions.",
      });
      return;
    }

    setIsSuggestingSummary(true);
    try {
      const { suggestions } = await professionalSummarySuggester({ headline });
      if (suggestions && suggestions.length > 0) {
        form.setValue("professionalSummary", suggestions[0]); 
         toast({
            title: "Summary Suggested",
            description: "An AI-generated summary has been filled in. You can edit it as needed.",
        });
      } else {
         toast({
            variant: "default",
            title: "No Suggestions",
            description: "AI couldn't generate a summary for this headline. Please write one manually.",
        });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        variant: "destructive",
        title: "Suggestion Error",
        description: "Could not fetch AI summary suggestions at this time.",
      });
    } finally {
      setIsSuggestingSummary(false);
    }  };

  async function onSubmit(values: ProfileFormValues) {
    setIsLoading(true);
    if (!user || !user.uid || !userData || userData.role !== 'talent') {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Could not save profile. Please log in as a talent.",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("Form values being submitted:", values);

      let cvAnalysisResult = null;
      if (values.cv) { 
        try {
            cvAnalysisResult = await analyzeCv({ cvDataUri: values.cv });
            console.log("CV Analysis Result:", cvAnalysisResult);
        } catch (cvError) {
            console.error("Error analyzing CV:", cvError);
            toast({
                variant: "destructive",
                title: "CV Analysis Failed",
                description: "Could not analyze the uploaded CV. Please ensure it's a valid document.",
            });
        }
      } else if (!userData.cvAnalysisSummary) { // CV is required if no previous analysis exists
         toast({
            variant: "destructive",
            title: "CV Required",
            description: "Please upload your CV.",
         });
         setIsLoading(false);
         return;
      }

      const updateData: Partial<UserProfileData> = { 
            fullName: values.fullName,
            country: values.country,
            timezone: values.timezone,
            headline: values.headline,
            professionalSummary: values.professionalSummary,
            yearsOfExperience: values.yearsOfExperience,
            techStack: values.techStack,
            linkedin: values.linkedin || "", 
            github: values.github || "", 
            expectedMonthlyRateGBP: values.expectedMonthlyRateGBP,
            availability: values.availability,
            talentStatus: 'profile_submitted', 
        };

        if (cvAnalysisResult) {
            updateData.cvAnalysisSummary = cvAnalysisResult.summary;
            updateData.cvSkills = cvAnalysisResult.skills;
            updateData.cvExperience = cvAnalysisResult.experience;
            updateData.cvEducation = cvAnalysisResult.education;
            // If you implement file storage, save CV and set cvDownloadUrl here
        }
      
      await updateUserDocument(user.uid, 'talent', updateData);
      console.log("Talent document updated successfully!");

      toast({
        title: "Profile Submitted",
        description: "Your talent profile has been submitted successfully. You can now prepare for an AI interview.",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., United Kingdom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., GMT+0:00 (UTC)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Headline</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Senior Software Engineer" {...field} />
              </FormControl>
              <FormDescription>
                A brief, impactful statement about your professional focus. Used for AI summary suggestions.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="professionalSummary"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Professional Summary</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateSummarySuggestions}
                  disabled={isSuggestingSummary || !form.watch("headline")}
                  className="text-sm"
                >
                  {isSuggestingSummary ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<Sparkles className="mr-2 h-4 w-4 text-primary" />)}
                  AI Suggestions
                </Button>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your experience, skills, and career aspirations..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a detailed overview of your background and goals.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="yearsOfExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Experience</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5" {...field} 
                 onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                 value={field.value === null ? '' : field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="techStack"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tech Stack (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., React, Node.js, TypeScript" {...field}
                />
              </FormControl>
              <FormDescription>
                List the technologies and skills you are proficient in, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="linkedin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn Profile URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                </FormControl>
                <FormDescription>
                  At least one of LinkedIn or GitHub is required.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="github"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub Profile URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/yourprofile" {...field} />
                </FormControl>
                 <FormDescription>
                  At least one of LinkedIn or GitHub is required.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cv"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Your CV</FormLabel>
              <FormControl>
                <FileUpload 
                  onFileUpload={(fileName, dataUri) => {
                    console.log("CV Data URI set to form:", dataUri.substring(0,50) + "...");
                    field.onChange(dataUri);
                  }} 
                  maxFileSize={6 * 1024 * 1024} 
                />
              </FormControl>
              <FormDescription>
                Please upload your most recent CV. This will replace any existing CV.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedMonthlyRateGBP"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Monthly Rate (GBP)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5000" {...field} 
                 onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                 value={field.value === null ? '' : field.value}
                />
              </FormControl>
              <FormDescription>
                Your expected monthly rate in Great British Pounds.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='availability'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Availability</FormLabel>
              <FormControl>
                 {/* Replace with ShadCN Select if available and preferred */}
                <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                  <option value="" disabled>Select availability</option>
                  <option value="Immediately">Immediately</option>
                  <option value="2 Weeks Notice Period">2 Weeks Notice Period</option>
                  <option value="1 Month Notice Period">1 Month Notice Period</option>
                  <option value="2 Months Notice Period">2 Months Notice Period</option>
                </select>
              </FormControl>
              <FormDescription>
                Indicate your current availability for new opportunities.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || isSuggestingSummary} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Save Profile & Proceed"
          )}
        </Button>
      </form>
    </Form>
  );
}
export default ProfileForm;
