import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Users, FileText, Share2, BookOpen, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: Monitor,
      title: "Postes de travail virtuels",
      description: "Chaque élève dispose de son propre environnement de bureau Linux"
    },
    {
      icon: Users,
      title: "Gestion des classes",
      description: "Organisation par niveaux : 6e, 5e, 4e et 3e"
    },
    {
      icon: FileText,
      title: "Partage de documents",
      description: "Le professeur partage les cours directement sur les postes"
    },
    {
      icon: Share2,
      title: "Partage d'écran",
      description: "Diffusez votre écran à tous les élèves en temps réel"
    },
    {
      icon: BookOpen,
      title: "Applications éducatives",
      description: "Éditeur de texte, navigateur, calculatrice et plus"
    },
    {
      icon: Shield,
      title: "Contrôle total",
      description: "Surveillance et gestion des postes élèves"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">EduLinux</span>
          </div>
          <Button onClick={handleLogin} data-testid="button-login">
            Se connecter
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Votre salle informatique
              <span className="text-primary block mt-2">en ligne</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Une plateforme éducative complète permettant aux élèves d'accéder à un environnement 
              de bureau Linux directement depuis leur navigateur, avec un contrôle total pour les professeurs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleLogin} data-testid="button-login-hero">
                Accéder à mon poste
              </Button>
              <Button size="lg" variant="outline" onClick={handleLogin} data-testid="button-teacher-login">
                Espace Professeur
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">Fonctionnalités</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-card-border">
                  <CardContent className="p-6">
                    <feature.icon className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">13 postes disponibles</h2>
            <p className="text-muted-foreground mb-8">
              12 postes pour les élèves + 1 poste professeur avec tableau de bord de contrôle
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-sm font-medium"
                >
                  P{i + 1}
                </div>
              ))}
              <div className="w-20 h-16 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                Prof
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          EduLinux - Plateforme éducative
        </div>
      </footer>
    </div>
  );
}
