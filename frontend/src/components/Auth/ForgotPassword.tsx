import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, MailCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/utils";

// Validation Schemas
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ForgotPassword() {
  const [step, setStep] = useState<
    "email" | "password" | "emailSuccess" | "passwordSuccess"
  >("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Forms
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  // Handlers
  const onEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: data.email }),
      });
      setEmail(data.email);
      setStep("emailSuccess");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: "reset-token-from-email", // normally from URL
          password: data.password,
        }),
      });
      setStep("passwordSuccess");
      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      {/* Left Section */}
      <div className="hidden md:flex w-1/2 flex-col justify-center px-20 bg-white">
        <img
          src="/welcome.png"
          alt="Password Reset Illustration"
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
            Reset Your Password
          </h1>

          {/* Step Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              {[1, 2].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      (step === "email" && num === 1) ||
                      (step === "password" && num <= 2) ||
                      (step === "emailSuccess" && num === 1) ||
                      (step === "passwordSuccess" && num === 2)
                        ? "bg-[#1A56DB] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {num}
                  </div>
                  {num < 2 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step === "password" || step === "passwordSuccess"
                          ? "bg-[#1A56DB]"
                          : "bg-gray-200"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Titles for forms only */}
          {(step === "email" || step === "password") && (
            <>
              <h2 className="text-2xl font-bold text-[#1F2937] mb-2 text-center">
                {step === "email" && "Forgot Password"}
                {step === "password" && "Create New Password"}
              </h2>

              <p className="text-gray-600 text-center mb-8">
                {step === "email" &&
                  "Enter your email address to reset your password"}
                {step === "password" &&
                  "Please create a new password for your account"}
              </p>
            </>
          )}

          {/* Email Form */}
          {step === "email" && (
            <form
              onSubmit={handleSubmitEmail(onEmailSubmit)}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...registerEmail("email")}
                  disabled={isLoading}
                  className="mt-2"
                />
                {emailErrors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {emailErrors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Reset Link
              </Button>

              <button
                onClick={() => window.history.back()}
                className="flex items-center text-sm text-[#1A56DB] hover:underline mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
            </form>
          )}

          {/* Password Form */}
          {step === "password" && (
            <form
              onSubmit={handleSubmitPassword(onPasswordSubmit)}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="password" className="text-gray-700">
                  New Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    {...registerPassword("password")}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {passwordErrors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    {...registerPassword("confirmPassword")}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reset Password
              </Button>

              <button
                onClick={() => setStep("email")}
                className="flex items-center text-sm text-[#1A56DB] hover:underline mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Email
              </button>
            </form>
          )}

          {/* Email Success */}
          {step === "emailSuccess" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <MailCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#1F2937]">
                Check Your Email!
              </h2>
              <p className="text-gray-600">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox.
              </p>
              <Button
                onClick={() => (window.location.href = "/login")}
                className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
              >
                Back to Login
              </Button>
            </div>
          )}

          {/* Password Success */}
          {step === "passwordSuccess" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <MailCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#1F2937]">
                Password Updated!
              </h2>
              <p className="text-gray-600">
                Your password has been successfully updated. You can now login
                with your new password.
              </p>
              <Button
                onClick={() => (window.location.href = "/login")}
                className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
              >
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
