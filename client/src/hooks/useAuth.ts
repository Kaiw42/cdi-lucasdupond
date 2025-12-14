import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthUser extends User {
  workstationId?: number;
  isLocked?: boolean;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",
    workstationId: user?.workstationId,
    isLocked: user?.isLocked,
  };
}
