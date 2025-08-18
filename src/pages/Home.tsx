import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle, 
  Clock, 
  Shield, 
  Zap, 
  Users, 
  Camera,
  ArrowRight,
  Sparkles,
  LogIn
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant face recognition and attendance marking in seconds"
    },
    {
      icon: Shield,
      title: "Contactless & Safe",
      description: "No physical contact required, completely hygienic solution"
    },
    {
      icon: CheckCircle,
      title: "High Accuracy",
      description: "Advanced AI algorithms ensure precise identification"
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Live attendance monitoring with instant updates"
    }
  ];

  const technologies = [
    "Face-API.js",
    "WebRTC",
    "Machine Learning",
    "React",
    "TypeScript"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div className="container mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Next-Gen Attendance System
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Face Recognition
              <br />
              <span className="text-4xl md:text-6xl">Attendance System</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Experience the future of attendance tracking with our AI-powered face recognition system. 
              Fast, accurate, and completely contactless.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/attendance">
                    <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth group">
                      Start Attendance
                      <Camera className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                      Register New Student
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth group">
                    Login to Continue
                    <LogIn className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, efficient, and powered by cutting-edge technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="card-elevated glass-effect text-center group hover:scale-105 transition-bounce">
              <CardHeader>
                <div className="gradient-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>1. Register</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Register members by capturing their face data securely. One-time setup for each person.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-elevated glass-effect text-center group hover:scale-105 transition-bounce">
              <CardHeader>
                <div className="gradient-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                  <Camera className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>2. Scan</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Look at the camera for instant face recognition. No touching or manual entry required.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="card-elevated glass-effect text-center group hover:scale-105 transition-bounce">
              <CardHeader>
                <div className="gradient-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                  <CheckCircle className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>3. Track</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Attendance is automatically recorded with timestamp and stored securely for easy tracking.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose FaceAttend?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Modern problems require modern solutions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-elevated glass-effect group hover:scale-105 transition-bounce">
                <CardHeader className="text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4 group-hover:text-accent transition-smooth" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Powered by Modern Technologies</h2>
          <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
            {technologies.map((tech, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="px-4 py-2 text-sm border-primary/50 hover:bg-primary/10 transition-smooth"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="card-elevated glass-effect max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join the future of attendance management today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/register">
                <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth">
                  Register Your First Member
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;