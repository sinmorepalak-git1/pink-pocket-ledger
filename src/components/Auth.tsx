import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type AuthState = "login" | "signup" | "forgotPassword";

export function Auth() {
  const [authState, setAuthState] = useState<AuthState>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, resetPassword } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");

    setIsLoading(true);

    try {
      if (authState === "signup") {
        if (!password) {
          toast.error("Password is required");
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        await signup(email, password);
        toast.success("Account created successfully!");
      } else if (authState === "login") {
        if (!password) {
          toast.error("Password is required");
          return;
        }
        await login(email, password);
        toast.success("Logged in successfully!");
      } else if (authState === "forgotPassword") {
        await resetPassword(email);
        toast.success("Password reset email sent. Check your inbox.");
        setAuthState("login");
      }
    } catch (error: any) {
      console.error(error);
      const code = error.code || "";
      if (code === "auth/invalid-email") toast.error("Invalid email address.");
      else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") toast.error("Invalid email or password.");
      else if (code === "auth/too-many-requests") toast.error("Too many login attempts. Try again later.");
      else if (code === "auth/email-already-in-use") toast.error("Email is already in use.");
      else toast.error("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md card-soft space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">
            {authState === "login" ? "Welcome Back" : authState === "signup" ? "Create Account" : "Reset Password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {authState === "login"
              ? "Login to access your expense tracker"
              : authState === "signup"
              ? "Sign up to track your daily expenses"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {authState !== "forgotPassword" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {authState === "signup" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Please wait..."
              : authState === "login"
              ? "Login"
              : authState === "signup"
              ? "Create Account"
              : "Send Reset Link"}
          </Button>
        </form>

        <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
          {authState === "login" ? (
            <>
              <button onClick={() => setAuthState("forgotPassword")} className="hover:text-primary">
                Forgot Password?
              </button>
              <p>
                Don't have an account?{" "}
                <button onClick={() => setAuthState("signup")} className="font-medium text-primary hover:underline">
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <p>
              Back to{" "}
              <button onClick={() => setAuthState("login")} className="font-medium text-primary hover:underline">
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
