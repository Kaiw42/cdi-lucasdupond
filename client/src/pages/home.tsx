import { useAuth } from "@/hooks/useAuth";
import StudentDesktop from "./student-desktop";
import TeacherDashboard from "./teacher-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, isLoading, isTeacher } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isTeacher) {
    return <TeacherDashboard />;
  }

  return <StudentDesktop />;
}
