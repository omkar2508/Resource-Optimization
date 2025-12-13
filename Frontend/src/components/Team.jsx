import { Card, CardContent } from "@/components/ui/card";
import { Mail, User } from "lucide-react";
const teamMembers = [{
  name: "Pranita Kute",
  role: "Team Member",
  email: "pranita.22420110@viit.ac.in"
}, {
  name: "Omkar Babar",
  role: "Team Member",
  email: "omkar.22420276@viit.ac.in"
}, {
  name: "Vedant Wahile",
  role: "Team Member",
  email: "vedant.22420176@viit.ac.in"
}, {
  name: "Tejas Deore",
  role: "Team Member",
  email: "tejas.22420180@viit.ac.in"
}];
export const Team = () => {
  return <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Meet Our{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Team
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            CS (Software Engineering) students from VIIT working on this innovative project
          </p>
          <div className="pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Guided By:</strong> Mr. Vilas Ghonge
            </p>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Industry Partner:</strong> Mr. Anant Mulay, DataTech Labs Pvt. Ltd.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 bg-gradient-card">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <a href={`mailto:${member.email}`} className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-glow transition-colors">
                  <Mail className="w-4 h-4" />
                  <span className="break-all">{member.email}</span>
                </a>
              </CardContent>
            </Card>)}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto border-2 border-primary/20 bg-gradient-card">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Academic Year 2025-26</h3>
              <p className="text-muted-foreground mb-2">
                Department: CS (Software Engineering)
              </p>
              <p className="text-muted-foreground mb-2">
                Semester: V | Group No.: 17
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                BRACT's, Vishwakarma Institute of Information Technology
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};