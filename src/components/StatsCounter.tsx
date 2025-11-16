import { useEffect, useRef, useState } from "react";
import { Users, Award, BookOpen, TrendingUp } from "lucide-react";

const StatsCounter = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const stats = [
    { icon: Users, value: 500, suffix: "+", label: "Students Enrolled", color: "from-primary to-accent" },
    { icon: Award, value: 98, suffix: "%", label: "Success Rate", color: "from-accent to-primary" },
    { icon: BookOpen, value: 10, suffix: "+", label: "Years of Excellence", color: "from-primary to-accent" },
    { icon: TrendingUp, value: 95, suffix: "%", label: "Further Learning", color: "from-accent to-primary" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const Counter = ({ target, suffix }: { target: number; suffix: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [isVisible, target]);

    return (
      <span className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {count}{suffix}
      </span>
    );
  };

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-primary/5 to-accent/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in-up">Our Achievements</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
            Numbers that reflect our commitment to excellence
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center group animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4 group-hover:scale-110 transition-smooth">
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <div className="mb-2">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
