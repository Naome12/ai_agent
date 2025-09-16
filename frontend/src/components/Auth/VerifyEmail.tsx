import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, MailCheck, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Form validation schemas
const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function VerifyEmail() {
  const [step, setStep] = useState<"password" | "success">("password");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Extract token from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "This verification link is invalid or has expired.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call backend verify email endpoint
      await apiFetch("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ 
          token: token,
          password: data.password 
        }),
      });
      
      setStep("success");
      toast({
        title: "Account Activated",
        description: "Your account has been successfully activated. You can now login.",
      });
    } catch (error: any) {
      toast({
        title: "Activation Failed",
        description: error?.message || "Failed to activate account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex bg-[#F9FAFB]">
        <div className="w-full flex items-center justify-center px-8">
          <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <MailCheck className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Invalid Link</h1>
            <p className="text-gray-600 mb-6">
              This verification link is invalid or has expired. Please check your email for a valid link.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      {/* Left Section */}
      <div className="hidden md:flex w-1/2 flex-col justify-center px-20 bg-white">
        <img
          src="/welcome.png"
          alt="Account Activation Illustration"
          className="max-w-lg w-full h-auto mt-4"
        />
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-8">
        <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-lg">
          
          {/* Logo */}
          <div className="flex items-center gap-0 mb-2 justify-center">
            <img src="/logo.png" alt="NCDA-TMS Logo" className="h-16 w-16" />
            <span className="text-2xl font-bold text-[#1A56DB]">NCDA-TMS</span>
          </div>

          {/* Heading */}
          <h1 className="text-xl font-extrabold text-[#1A56DB] leading-snug mb-10 text-center">
            Activate Your Account
          </h1>

          {/* Password Form */}
          {step === "password" && (
            <>
              <h2 className="text-2xl font-bold text-[#1F2937] mb-2 text-center">
                Set Your Password
              </h2>

              <p className="text-gray-600 text-center mb-8">
                Welcome! Please create a password to activate your trainer account.
              </p>

              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="password" className="text-gray-700">
                    Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      {...register("confirmPassword")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Activate Account
                </Button>
              </form>

              {/* Back Button */}
              <button 
                onClick={() => navigate("/login")}
                className="flex items-center text-sm text-[#1A56DB] hover:underline mt-6 mx-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
            </>
          )}

          {/* Success Message */}
          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-[#1F2937]">Account Activated!</h2>
              
              <p className="text-gray-600">
                Your trainer account has been successfully activated. You can now login with your email and password.
              </p>
              
              <Button
                onClick={() => navigate("/login")}
                className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
