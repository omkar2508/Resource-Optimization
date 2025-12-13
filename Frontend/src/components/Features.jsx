import {
  Calendar,
  Users,
  FlaskConical,
  Shield,
  RefreshCw,
  Clock,
  Heart,
  LayoutDashboard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Calendar,
    title: "Automate Timetable Generation",
    description:
      "Generate conflict-free timetables automatically using advanced AI algorithms.",
  },
  {
    icon: LayoutDashboard,
    title: "Optimal Room Allocation",
    description:
      "Efficiently allocate classrooms and labs based on capacity and requirements.",
  },
  {
    icon: Users,
    title: "Faculty Load Balancing",
    description:
      "Distribute teaching loads fairly across faculty members considering preferences.",
  },
  {
    icon: FlaskConical,
    title: "Lab Equipment Utilization",
    description:
      "Maximize laboratory equipment usage and prevent scheduling conflicts.",
  },
  {
    icon: Shield,
    title: "Conflict-Free Scheduling",
    description:
      "Eliminate scheduling conflicts with intelligent constraint validation.",
  },
  {
    icon: RefreshCw,
    title: "Last-Minute Flexibility",
    description:
      "Adapt to changes quickly with dynamic rescheduling capabilities.",
  },
  {
    icon: Heart,
    title: "Student-Centric Optimization",
    description:
      "Consider student preferences and avoid back-to-back heavy subjects.",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    description: "Get instant notifications and updates on schedule changes.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4">
        {/* Title Section */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Powerful Features for{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Seamless Management
            </span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive dashboard provides everything you need to manage
            educational resources efficiently.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border hover:border-primary/40 bg-gradient-card"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
