
"use client";

import Link from 'next/link';
import Logo from './Logo'; // Assuming Logo component is in the same directory or accessible
import { Facebook, Twitter, Instagram, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Github, href: "#", label: "GitHub" },
  ];

  const footerLinks = {
    solutions: [
      { href: "/solutions", label: "AI Recruiter Co-Pilot" },
      { href: "/marketplace", label: "Talent Marketplace" },
      { href: "#interview-practice", label: "Interview Practice" }, // Placeholder
    ],
    company: [
      { href: "#about", label: "About Us" }, // Placeholder
      { href: "/contact", label: "Contact" },
      { href: "#careers", label: "Careers" }, // Placeholder
      { href: "#blog", label: "Blog" }, // Placeholder
    ],
    support: [
      { href: "#faq", label: "FAQs" }, // Placeholder
      { href: "#terms-of-service", label: "Terms of Service" }, // Placeholder
      { href: "#privacy-policy", label: "Privacy Policy" }, // Placeholder
      { href: "#help-center", label: "Help Center" }, // Placeholder
    ],
  };

  return (
    <footer className="bg-card/30 text-muted-foreground border-t border-border/40 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Logo and Description */}
          <div className="md:col-span-2 lg:col-span-1 space-y-4">
            <Logo />
            <p className="text-sm max-w-xs leading-relaxed">
              Merit AI connects global companies with pre-vetted, elite software engineers from Southeast Asia at 50% the cost of local hires.
            </p>
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-muted/30 hover:bg-primary/20 rounded-full text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">Solutions</h4>
            <ul className="space-y-2.5">
              {footerLinks.solutions.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs">
          <p>&copy; {currentYear} Merit AI. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Link href="#terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#support-bottom" className="hover:text-primary transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
