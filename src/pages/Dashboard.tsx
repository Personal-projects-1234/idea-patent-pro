import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Clock, CheckCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with real data from database
  const applications = [
    {
      id: 1,
      title: "Smart Home IoT System",
      status: "completed",
      date: "2025-01-15",
      progress: 100
    },
    {
      id: 2,
      title: "AI-Powered Medical Diagnostic Tool",
      status: "in_progress",
      date: "2025-01-20",
      progress: 60
    },
    {
      id: 3,
      title: "Renewable Energy Storage Device",
      status: "draft",
      date: "2025-01-22",
      progress: 20
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              Patent Applications
            </h1>
            <p className="text-muted-foreground">
              Manage and track your patent application progress
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gradient-hero text-white hover:opacity-90 transition-smooth shadow-elegant"
            onClick={() => navigate('/wizard')}
          >
            <Plus className="h-5 w-5 mr-2" />
            New Application
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 bg-card border-border hover:shadow-card transition-smooth">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-foreground">{applications.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-6 bg-card border-border hover:shadow-card transition-smooth">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">In Progress</p>
                <p className="text-3xl font-bold text-foreground">
                  {applications.filter(a => a.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </Card>
          <Card className="p-6 bg-card border-border hover:shadow-card transition-smooth">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-foreground">
                  {applications.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">
            Your Applications
          </h2>
          {applications.map((app) => (
            <Card
              key={app.id}
              className="p-6 bg-card border-border hover:shadow-card transition-smooth cursor-pointer"
              onClick={() => navigate(`/application/${app.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(app.status)}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {app.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Started on {new Date(app.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  app.status === 'completed'
                    ? 'bg-accent/10 text-accent'
                    : app.status === 'in_progress'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {getStatusText(app.status)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-medium">{app.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-hero h-2 rounded-full transition-smooth"
                    style={{ width: `${app.progress}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
