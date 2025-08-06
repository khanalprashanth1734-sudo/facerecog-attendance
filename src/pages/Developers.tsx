import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, Linkedin, Mail, ExternalLink, Code2 } from "lucide-react";

const Developers = () => {
  const developers = [
    {
      name: "Alex Chen",
      role: "Lead AI Engineer",
      description: "Specialized in computer vision and machine learning. Architected the face recognition system using advanced neural networks.",
      image: "/placeholder.svg",
      quote: "Building the future of biometric authentication, one face at a time.",
      skills: ["Machine Learning", "Computer Vision", "Python", "TensorFlow"],
      links: {
        github: "https://github.com",
        linkedin: "https://linkedin.com",
        email: "alex@faceattend.com"
      }
    },
    {
      name: "Sarah Kim",
      role: "Frontend Architect",
      description: "Expert in React and modern web technologies. Created the intuitive user interface and seamless user experience.",
      image: "/placeholder.svg",
      quote: "Great UX is invisible - users should focus on their goals, not the interface.",
      skills: ["React", "TypeScript", "UI/UX Design", "Tailwind CSS"],
      links: {
        github: "https://github.com",
        linkedin: "https://linkedin.com",
        email: "sarah@faceattend.com"
      }
    },
    {
      name: "David Rodriguez",
      role: "Backend Developer",
      description: "Full-stack developer with expertise in data management and API design. Built the robust backend infrastructure.",
      image: "/placeholder.svg",
      quote: "Reliable systems are built on solid foundations and thoughtful architecture.",
      skills: ["Node.js", "Database Design", "API Development", "System Architecture"],
      links: {
        github: "https://github.com",
        linkedin: "https://linkedin.com",
        email: "david@faceattend.com"
      }
    },
    {
      name: "Maya Patel",
      role: "Security Engineer",
      description: "Cybersecurity specialist ensuring data privacy and system security. Implemented biometric data protection protocols.",
      image: "/placeholder.svg",
      quote: "Privacy and security aren't features - they're fundamental rights.",
      skills: ["Cybersecurity", "Data Privacy", "Encryption", "Compliance"],
      links: {
        github: "https://github.com",
        linkedin: "https://linkedin.com",
        email: "maya@faceattend.com"
      }
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <Code2 className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Meet Our Team
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The talented individuals behind the FaceAttend system. Passionate about innovation, 
            committed to excellence, and dedicated to creating technology that makes a difference.
          </p>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <Card className="glass-effect card-elevated text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">4</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </CardContent>
          </Card>
          <Card className="glass-effect card-elevated text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">2+</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </CardContent>
          </Card>
          <Card className="glass-effect card-elevated text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">15+</div>
              <div className="text-sm text-muted-foreground">Technologies Used</div>
            </CardContent>
          </Card>
          <Card className="glass-effect card-elevated text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">99%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Developer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {developers.map((developer, index) => (
            <Card 
              key={index} 
              className="glass-effect card-elevated group hover:scale-105 transition-bounce overflow-hidden"
            >
              <CardHeader className="relative">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                    <AvatarImage src={developer.image} alt={developer.name} />
                    <AvatarFallback className="text-lg font-semibold bg-gradient-primary text-primary-foreground">
                      {developer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{developer.name}</CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      {developer.role}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-base leading-relaxed">
                  {developer.description}
                </CardDescription>
                
                <div className="bg-secondary/30 p-4 rounded-lg border-l-4 border-primary">
                  <p className="italic text-sm text-muted-foreground">
                    "{developer.quote}"
                  </p>
                </div>
                
                {/* Skills */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {developer.skills.map((skill, skillIndex) => (
                      <Badge 
                        key={skillIndex}
                        variant="outline" 
                        className="text-xs border-primary/30 hover:bg-primary/10 transition-smooth"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Social Links */}
                <div className="flex space-x-2 pt-4 border-t border-border">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-primary/10 hover:text-primary transition-smooth"
                    asChild
                  >
                    <a href={developer.links.github} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-primary/10 hover:text-primary transition-smooth"
                    asChild
                  >
                    <a href={developer.links.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-primary/10 hover:text-primary transition-smooth"
                    asChild
                  >
                    <a href={`mailto:${developer.links.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <Card className="glass-effect card-elevated max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Want to Join Our Team?</CardTitle>
              <CardDescription className="text-lg">
                We're always looking for talented individuals passionate about AI and innovation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth">
                <Mail className="mr-2 h-4 w-4" />
                Contact Us
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Developers;