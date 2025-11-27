import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Lightbulb, Search, FileText, Image, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Idea Input",
      description: "Share your innovation concept and let AI understand your vision"
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Prior Art Search",
      description: "Automated search to identify existing patents and competitors"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Smart Questionnaire",
      description: "AI-generated questions to capture every detail of your invention"
    },
    {
      icon: <Image className="h-6 w-6" />,
      title: "Diagram Generation",
      description: "Automatic creation of technical diagrams for your specifications"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Specifications",
      description: "Complete provisional and full patent application documents"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Final Analysis",
      description: "Comprehensive prior art analysis with actionable insights"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight">
              Transform Your Ideas Into
              <span className="text-accent block mt-2">Protected Patents</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AI-powered patent application creation with automated prior art search, 
              competitor analysis, and complete technical specifications generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-gradient-hero text-white hover:opacity-90 transition-smooth shadow-elegant text-lg px-8 py-6"
                onClick={() => navigate('/wizard')}
              >
                Start Your Patent Application
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5 text-lg px-8 py-6"
                onClick={() => navigate('/dashboard')}
              >
                View Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">
              Complete Patent Creation Workflow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From initial concept to final application, our AI handles every step with precision
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-8 hover:shadow-card transition-smooth border-border bg-card"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg text-accent">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-display font-bold text-foreground mb-4">
                Why Choose Our Platform
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                "Comprehensive prior art searches powered by advanced AI",
                "Automated competitor analysis and landscape mapping",
                "Interactive questioning system for complete specification clarity",
                "Professional technical diagrams generated automatically",
                "Both provisional and complete application formats",
                "Continuous validation against existing patents"
              ].map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 bg-card p-6 rounded-lg border border-border hover:shadow-card transition-smooth"
                >
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                  <p className="text-lg text-card-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Ready to Protect Your Innovation?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join innovators who trust our AI-powered platform for their patent applications
          </p>
          <Button 
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6"
            onClick={() => navigate('/wizard')}
          >
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
