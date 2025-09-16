import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, Users, Search } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-kozi-pink to-purple-600 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="text-center text-white space-y-8">
          <div className="space-y-4">
            <div className="mx-auto w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8">
              <span className="text-4xl font-bold">K</span>
            </div>
            <h1 className="text-6xl font-bold mb-4">Job Seeker Hub</h1>
            <p className="text-xl mb-2">Start your career journey today</p>
            <p className="text-lg opacity-90">Join thousands of successful professionals</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button 
              asChild
              className="w-full sm:w-auto bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-sm"
            >
              <Link to="/role-selection" className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Search jobs
              </Link>
            </Button>
            
            <Button 
              asChild
              className="w-full sm:w-auto bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-sm"
            >
              <Link to="/role-selection" className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Apply Smartly
              </Link>
            </Button>
            
            <Button 
              asChild
              className="w-full sm:w-auto bg-kozi-pink-light hover:bg-kozi-pink text-white"
            >
              <Link to="/role-selection" className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Build Resume
              </Link>
            </Button>
          </div>

          <div className="pt-8">
            <p className="text-sm opacity-80 mb-4">Ready to get started?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-white text-kozi-pink hover:bg-white/90">
                <Link to="/role-selection" className="flex items-center">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
