
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { createUserDocument, type UserRole } from "@/services/userService";
import { FirebaseError } from "firebase/app";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  role: z.enum(["talent", "recruiter"], { required_error: "You must select a role." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const defaultRole = searchParams.get("role") === "recruiter" ? "recruiter" : "talent";
  const redirectPath = searchParams.get("redirect") || "/dashboard";


  const formSchema = mode === "login" ? loginSchema : signupSchema;
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === "login" ? {
      email: "",
      password: "",
    } : {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: defaultRole as UserRole,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      if (mode === "login") {
        const loginValues = values as z.infer<typeof loginSchema>;
        await signInWithEmailAndPassword(auth, loginValues.email, loginValues.password);
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting you...",
        });
      } else {
        const signupValues = values as z.infer<typeof signupSchema>;
        const userCredential = await createUserWithEmailAndPassword(auth, signupValues.email, signupValues.password);
        await updateProfile(userCredential.user, { displayName: signupValues.fullName });
        // createUserDocument now handles saving to 'talents' or 'recruiters' collection based on role
        await createUserDocument(userCredential.user.uid, signupValues.email, signupValues.role as UserRole, signupValues.fullName);
        toast({
          title: "Signup Successful",
          description: "Welcome to Merit! Redirecting you...",
        });
      }
      router.push(redirectPath);
    } catch (error: unknown) {
      console.error("Authentication error:", error);
      
      let toastTitle = mode === "login" ? "Login Failed" : "Signup Failed";
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential": // Covers invalid email or password
            errorMessage = "Invalid email or password. Please check your credentials and try again.";
            break;
          case "auth/email-already-in-use":
            toastTitle = "Email Already Registered";
            errorMessage = "This email is already in use. Please try logging in or use a different email address.";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak. It should be at least 6 characters long.";
            break;
          case "auth/invalid-api-key":
            errorMessage = "Configuration error. Please contact support.";
            break;
          default:
            errorMessage = "An authentication error occurred: " + error.message;
        }
      }
      toast({
        variant: "destructive",
        title: toastTitle,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            {mode === "login" ? <LogIn className="mr-2 h-6 w-6"/> : <UserPlus className="mr-2 h-6 w-6"/>}
            {mode === "login" ? "Login to Merit" : "Create your Merit Account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Enter your credentials to access your account."
              : "Join Merit today to find opportunities or talent."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {mode === "signup" && (
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
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "signup" && (
                <>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>I am a...</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="talent" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Talent (Looking for opportunities)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="recruiter" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Recruiter (Looking to hire)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Login" : "Sign Up"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <Link href={`/auth/signup${searchParams.get('redirect') ? '?redirect=' + searchParams.get('redirect') : ''}`} className="underline hover:text-primary">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href={`/auth/login${searchParams.get('redirect') ? '?redirect=' + searchParams.get('redirect') : ''}`} className="underline hover:text-primary">
                  Login
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

