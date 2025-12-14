import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Monitor, User, Lock, AlertCircle, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Workstation } from "@shared/schema";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedWorkstation, setSelectedWorkstation] = useState<number | null>(null);

  const { data: workstations = [] } = useQuery<Workstation[]>({
    queryKey: ["/api/workstations"],
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; workstationId: number }) => {
      return apiRequest("POST", "/api/auth/student/login", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkstation) {
      loginMutation.mutate({ username, password, workstationId: selectedWorkstation });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Monitor className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">EduLinux</h1>
          <p className="text-muted-foreground">Sélectionnez votre poste et connectez-vous</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Choisissez votre poste</CardTitle>
              <CardDescription>Sélectionnez un poste disponible</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {workstations.map((ws) => (
                  <Button
                    key={ws.id}
                    type="button"
                    variant={selectedWorkstation === ws.id ? "default" : "outline"}
                    disabled={ws.isOccupied || false}
                    onClick={() => setSelectedWorkstation(ws.id)}
                    className={`h-16 flex flex-col gap-1 ${
                      ws.isOccupied ? "opacity-50" : ""
                    } ${selectedWorkstation === ws.id ? "" : ""}`}
                    data-testid={`button-workstation-${ws.id}`}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="text-xs">{ws.label}</span>
                    {ws.isOccupied && (
                      <span className="text-[10px] text-muted-foreground">Occupé</span>
                    )}
                  </Button>
                ))}
              </div>

              {selectedWorkstation && (
                <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                  <Check className="h-4 w-4" />
                  Poste {selectedWorkstation} sélectionné
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Identifiez-vous</CardTitle>
              <CardDescription>Entrez vos identifiants</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {loginMutation.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {(loginMutation.error as any)?.message || "Erreur de connexion"}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Identifiant</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Votre identifiant"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      data-testid="input-username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      data-testid="input-password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedWorkstation || loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Connexion..." : "Se connecter"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setLocation("/teacher")}
                    data-testid="link-teacher"
                  >
                    Connexion en tant que professeur
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
