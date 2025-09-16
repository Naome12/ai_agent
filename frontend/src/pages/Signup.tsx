import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore, UserRole } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const { signup, selectedRole } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    password: "",
    role: (selectedRole as UserRole) || "job_seeker",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedRole) {
      setFormData((prev) => ({ ...prev, role: selectedRole }));
    }
  }, [selectedRole]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast({
        title: "Please agree to terms",
        description:
          "You must agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signup(formData);
      toast({
        title: "Welcome to KOZI!",
        description: "Your account has been created successfully.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabel =
    formData.role === "job_seeker"
      ? "Job Seeker"
      : formData.role === "employer"
      ? "Employer"
      : "Admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-kozi-pink to-purple-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-kozi-pink rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">K</span>
          </div>
          <CardTitle className="text-2xl font-bold">
            Join {roleLabel}
          </CardTitle>
          <p className="text-muted-foreground">
            Create your {roleLabel.toLowerCase()} account
          </p>
          <div className="text-sm">
            <span className="text-muted-foreground">Usanzwe ufite konti? </span>
            <Link to="/login" className="text-kozi-pink hover:underline">
              Kanda hano
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="First name"
                  value={formData.fname}
                  onChange={(e) => handleInputChange("fname", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Last name"
                  value={formData.lname}
                  onChange={(e) => handleInputChange("lname", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) =>
                  handleInputChange("password", e.target.value)
                }
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                Soma kandi wemeze{" "}
                <span className="text-kozi-pink">amategeko n'amabwiriza.</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-kozi-pink hover:bg-kozi-pink-dark text-white"
              disabled={isLoading || !agreedToTerms}
            >
              {isLoading ? "Creating account..." : "Injira"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
