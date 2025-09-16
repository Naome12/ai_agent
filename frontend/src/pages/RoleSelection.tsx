import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore, UserRole } from "@/stores/authStore";
import { Users, Building, ArrowLeft, ArrowRight } from "lucide-react";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { setSelectedRole: storeSetRole } = useAuthStore();
  const navigate = useNavigate();

  const roles = [
    {
      type: "job_seeker" as UserRole,
      title: "Worker",
      subtitle: "(Usaba akazi)",
      description: "Find your dream job and advance your career",
      icon: Users,
      gradient: "from-kozi-pink to-pink-400",
    },
    {
      type: "employer" as UserRole,
      title: "Employer",
      subtitle: "",
      description: "Post jobs and find the perfect candidates",
      icon: Building,
      gradient: "from-kozi-pink to-purple-500",
    },
  ];

  const handleContinue = () => {
    if (selectedRole) {
      storeSetRole(selectedRole); // ✅ save into store
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-kozi-pink flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Illustration */}
              <div className="flex items-center justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-kozi-pink/20 to-purple-500/20 rounded-3xl flex items-center justify-center">
                  <div className="w-40 h-40 bg-kozi-pink rounded-2xl flex items-center justify-center">
                    <Users className="w-20 h-20 text-white" />
                  </div>
                </div>
              </div>

              {/* Role selection */}
              <div className="space-y-6">
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Continue as
                  </h1>
                  <p className="text-muted-foreground">
                    Choose your role to get started
                  </p>
                </div>

                <div className="space-y-4">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.type;

                    return (
                      <button
                        key={role.type}
                        onClick={() => setSelectedRole(role.type)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? "border-kozi-pink bg-kozi-pink/5 shadow-lg"
                            : "border-border bg-card hover:border-kozi-pink/50 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 rounded-full bg-gradient-to-r ${role.gradient} flex items-center justify-center`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {role.title}
                              {role.subtitle && (
                                <span className="text-kozi-pink ml-1">
                                  {role.subtitle}
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {role.description}
                            </p>
                          </div>
                          <ArrowRight
                            className={`w-5 h-5 transition-opacity ${
                              isSelected
                                ? "text-kozi-pink opacity-100"
                                : "text-muted-foreground opacity-0"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="text-muted-foreground hover:text-kozi-pink"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>

                  <Button
                    onClick={handleContinue}
                    disabled={!selectedRole}
                    className="bg-kozi-pink hover:bg-kozi-pink-dark text-white px-8"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleSelection;
