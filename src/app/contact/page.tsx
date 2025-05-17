
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, Phone, MapPin, Clock, Linkedin, Github, Twitter, Facebook, Send, LifeBuoy, MessageCircle, Users, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  company: z.string().optional(),
  interest: z.enum(["hiring", "copilot", "talent", "other"], { required_error: "Please select an interest." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    console.log("Contact form submitted:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Message Sent!",
      description: "Thank you for reaching out. We'll get back to you soon.",
    });
    form.reset();
    setIsSubmitting(false);
  };

  const primaryButtonClass = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105 py-3 px-8 text-base w-full";


  const contactInfo = [
    { icon: Mail, title: "Email Us", lines: ["General Inquiries: info@merit.com", "Support: support@merit.com", "Partnerships: partnerships@merit.com"] },
    { icon: Phone, title: "Call Us", lines: ["USA: +1 (555) 123-4567", "Singapore: +65 0123 4567"] },
    { icon: MapPin, title: "Our Offices", lines: ["San Francisco: 123 Market St, San Francisco, CA 94103, USA", "Singapore: 12 Marina View, Asia Square Tower 2, Singapore 018961"] },
    { icon: Clock, title: "Working Hours", lines: ["Monday - Friday: 9:00 AM - 6:00 PM (PST/SGT)", "We have teams in multiple time zones to support you 24/5"] },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  const faqItems = [
    {
      value: "item-1",
      question: "How quickly can I expect a response?",
      answer: "We typically respond to all inquiries within 24 hours during business days. For urgent matters, please indicate so in your message and we'll prioritize your request.",
    },
    {
      value: "item-2",
      question: "Do you offer demos of your platform?",
      answer: "Yes, we offer personalized demos of both our talent marketplace and AI Recruiter Co-Pilot. Please select the appropriate option in the contact form and our team will schedule a demo at your convenience.",
    },
    {
      value: "item-3",
      question: "How can I join as a talent?",
      answer: "If you're a software engineer looking to join our platform, select 'Joining as Talent' in the contact form. Our team will guide you through the application and vetting process, which includes an AI-powered interview.",
    },
  ];


  return (
    <div className="min-h-screen bg-background text-foreground py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center mb-16 md:mb-24">
           <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            We're Here to Help
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Get in Touch
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Have questions about our platform or services? We're here to assist you every step of the way.
          </p>
        </section>

        {/* Contact Form and Info Section */}
        <section className="mb-16 md:mb-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left Column: Send Us a Message Form */}
            <Card className="bg-card/50 border-border/30 shadow-xl p-6 md:p-8">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-semibold text-foreground">Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1.5">Your Name</Label>
                    <Input id="name" placeholder="John Smith" {...form.register("name")} className="bg-muted/30 border-border/50 focus:border-primary" />
                    {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} className="bg-muted/30 border-border/50 focus:border-primary" />
                    {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="company" className="block text-sm font-medium text-muted-foreground mb-1.5">Company Name (Optional)</Label>
                    <Input id="company" placeholder="Acme Inc." {...form.register("company")} className="bg-muted/30 border-border/50 focus:border-primary" />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-muted-foreground mb-2">What are you interested in?</Label>
                    <RadioGroup
                      onValueChange={(value) => form.setValue("interest", value as any)}
                      defaultValue={form.getValues("interest")}
                      className="space-y-2"
                    >
                      {[
                        { value: "hiring", label: "Hiring Talent", icon: Users },
                        { value: "copilot", label: "AI Recruiter Co-Pilot", icon: Building },
                        { value: "talent", label: "Joining as Talent", icon: MessageCircle },
                        { value: "other", label: "Other Inquiry", icon: LifeBuoy },
                      ].map((item) => (
                        <div key={item.value} className="flex items-center space-x-2 p-2.5 rounded-md bg-muted/20 border border-transparent hover:border-primary/30 transition-colors">
                          <RadioGroupItem value={item.value} id={`interest-${item.value}`} />
                          <Label htmlFor={`interest-${item.value}`} className="font-normal flex items-center cursor-pointer text-muted-foreground hover:text-foreground">
                            <item.icon className="w-4 h-4 mr-2 text-primary/70" />
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {form.formState.errors.interest && <p className="text-destructive text-xs mt-1">{form.formState.errors.interest.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1.5">Your Message</Label>
                    <Textarea id="message" placeholder="Tell us how we can help..." {...form.register("message")} rows={5} className="bg-muted/30 border-border/50 focus:border-primary" />
                    {form.formState.errors.message && <p className="text-destructive text-xs mt-1">{form.formState.errors.message.message}</p>}
                  </div>
                  <Button type="submit" className={primaryButtonClass} disabled={isSubmitting}>
                    {isSubmitting && <Send className="mr-2 h-4 w-4 animate-pulse" /> }
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Right Column: Contact Information */}
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Contact Information</h2>
              {contactInfo.map((item) => (
                <div key={item.title} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                    {item.lines.map((line, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Connect With Us</h3>
                <div className="flex space-x-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-muted/30 hover:bg-primary/20 rounded-full text-muted-foreground hover:text-primary transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto space-y-3">
            {faqItems.map((item) => (
              <AccordionItem key={item.value} value={item.value} className="bg-card/50 border-border/30 rounded-lg shadow-md transition-all hover:bg-card/70">
                <AccordionTrigger className="px-6 py-4 text-left text-base font-medium text-foreground hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;

    