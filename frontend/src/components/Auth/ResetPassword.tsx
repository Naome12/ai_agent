import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";

// ✅ Validation schema
const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"form" | "invalid" | "success">("form");

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract token from URL params
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!token) {
      setStatus("invalid");
      toast({
        title: "Invalid Link",
        description: "This reset link is invalid or has expired.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: token,
          password: data.password,
        }),
      });

      setStatus("success");
      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset.",
      });
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description:
          error?.message ||
          "Failed to reset password. Please try again or contact support.",
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
        <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-lg text-center">
          {/* Logo */}
          <div className="flex items-center gap-0 mb-4 justify-center">
            <img src="/logo.png" alt="NCDA-TMS Logo" className="h-16 w-16" />
            <span className="text-2xl font-bold text-[#1A56DB]">NCDA-TMS</span>
          </div>

          {status === "invalid" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F2937] mb-2">
                Invalid Reset Link
              </h1>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
              >
                Request New Reset Link
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F2937] mb-2">
                Password Reset Successfully!
              </h1>
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. You can now login
                with your new password.
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full py-3 text-base font-semibold bg-[#1A56DB] hover:bg-[#1747B2] text-white rounded-lg"
              >
                Go to Login
              </Button>
            </>
          )}

          {status === "form" && (
            <>
              <h1 className="text-xl font-extrabold text-[#1A56DB] leading-snug mb-8">
                Reset Your Password
              </h1>
              <h2 className="text-2xl font-bold text-[#1F2937] mb-2">
                Create New Password
              </h2>
              <p className="text-gray-600 mb-8">
                Please create a new password for your account
              </p>

              <form
                onSubmit={handleSubmit(onPasswordSubmit)}
                className="space-y-6 text-left"
              >
                {/* New Password */}
                <div>
                  <Label htmlFor="password" className="text-gray-700">
                    New Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      {...register("password")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      {...register("confirmPassword")}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
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
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Reset Password
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
        </div>
      </div>
    </div>
  );
}
