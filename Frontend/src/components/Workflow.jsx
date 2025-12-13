import { UserPlus, Settings, Cpu, CheckCircle } from "lucide-react";
const steps = [{
  icon: UserPlus,
  title: "User Registration & Profile Setup",
  description: "Admins, faculty, lab in-charges, and students create profiles with role-specific information and preferences.",
  step: "01"
}, {
  icon: Settings,
  title: "Input & Constraints Definition",
  description: "Define subjects, rooms, working hours, and constraints. Faculty sets availability and workload preferences.",
  step: "02"
}, {
  icon: Cpu,
  title: "AI Optimization Engine",
  description: "Our AI engine processes all inputs and generates optimal timetables with balanced faculty loads and efficient resource allocation.",
  step: "03"
}, {
  icon: CheckCircle,
  title: "Review & Deploy",
  description: "Review the generated schedule, make adjustments if needed, and deploy to all stakeholders instantly.",
  step: "04"
}];
export const Workflow = () => {
  return <section id="workflow" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            How It{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to transform your resource management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
          const Icon = step.icon;
          return <div key={index} className="relative">
                {/* Connecting line */}
                {index < steps.length - 1 && <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />}
                
                <div className="relative space-y-4 text-center">
                  <div className="relative inline-flex">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-md opacity-30" />
                    <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                      <Icon className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shadow-md">
                      {step.step}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold px-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground px-2">
                    {step.description}
                  </p>
                </div>
              </div>;
        })}
        </div>
      </div>
    </section>;
};