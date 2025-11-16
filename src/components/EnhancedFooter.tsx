import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EnhancedFooter = () => {
  return (
    <footer className="bg-gradient-to-br from-muted/50 to-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Elma Kamonong High School</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Growing confident, skilled, and inspired learners through modern, hands-on education.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-smooth">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-smooth">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-smooth">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-smooth">About Us</Link>
              </li>
              <li>
                <Link to="/cbc" className="text-muted-foreground hover:text-primary transition-smooth">CBC Curriculum</Link>
              </li>
              <li>
                <Link to="/programs" className="text-muted-foreground hover:text-primary transition-smooth">Programs</Link>
              </li>
              <li>
                <Link to="/admissions" className="text-muted-foreground hover:text-primary transition-smooth">Admissions</Link>
              </li>
              <li>
                <Link to="/gallery" className="text-muted-foreground hover:text-primary transition-smooth">Gallery</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 text-primary" />
                <span>+254 715 748 735</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <span>info@elmakamonong.ac.ke</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>Kamonong, Kenya</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">Subscribe to receive news and updates.</p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="text-sm"
              />
              <Button size="sm" className="shrink-0">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold text-foreground">KLWDCT</span>. All rights reserved ©2025
          </p>
          <div className="flex gap-4">
            <Link to="/contact" className="hover:text-primary transition-smooth">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-primary transition-smooth">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
