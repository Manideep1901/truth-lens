import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, Lock, BarChart } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Detection',
      description: 'Advanced machine learning algorithms analyze images for deepfake indicators',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get detection results in seconds with detailed confidence scores',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your images are stored securely and only accessible by you',
    },
    {
      icon: BarChart,
      title: 'Track History',
      description: 'Review past detections and monitor patterns over time',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-secondary to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              TRUTH LENS
              <span className="block text-primary mt-2">AI SCAN</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload any image and get instant AI-powered analysis to determine if it's authentic or artificially generated. Protect yourself from digital manipulation.
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="text-lg px-8"
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Button>
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="text-lg px-8"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              State-of-the-art technology combined with user-friendly design
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Start Detecting?
              </h2>
              <p className="text-muted-foreground text-lg">
                Join thousands of users protecting themselves from deepfakes
              </p>
              <Button
                size="lg"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="text-lg px-8"
              >
                {user ? 'Open Dashboard' : 'Sign Up Free'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 DeepFake Detector. Powered by advanced AI technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
