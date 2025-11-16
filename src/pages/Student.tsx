import { Card, CardContent } from "@/components/ui/card";
import { Quote, Play, Star } from "lucide-react";
import studentImage from "@/assets/student-ambassador.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import EnhancedFooter from "@/components/EnhancedFooter";

const Student = () => {
  const videos = [
    { 
      id: "video1", 
      title: "Student Council Activities", 
      thumbnail: gallery1,
      description: "Watch our student leaders in action"
    },
    { 
      id: "video2", 
      title: "Club Meetings & Events", 
      thumbnail: gallery2,
      description: "Experience student life and interaction"
    },
    { 
      id: "video3", 
      title: "Debate Club Competition", 
      thumbnail: gallery3,
      description: "See students showcasing their talents"
    },
    { 
      id: "video4", 
      title: "Leadership Workshop", 
      thumbnail: gallery4,
      description: "Student mentorship and development"
    }
  ];

  const previousLeaders = [
    {
      name: "James Kimani",
      position: "School President",
      years: "2022-2023",
      image: gallery1,
      rating: 5,
      achievement: "Led the establishment of peer mentorship program"
    },
    {
      name: "Grace Njeri",
      position: "Head Prefect",
      years: "2021-2022",
      image: gallery2,
      rating: 5,
      achievement: "Initiated community outreach programs"
    },
    {
      name: "David Omondi",
      position: "School President",
      years: "2020-2021",
      image: gallery3,
      rating: 4,
      achievement: "Improved student-teacher communication"
    },
    {
      name: "Faith Wambui",
      position: "Senior Prefect",
      years: "2019-2020",
      image: gallery4,
      rating: 5,
      achievement: "Organized first annual cultural festival"
    }
  ];

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Student Voice</h1>
          
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Hear directly from our students about their experience at Elma Kamonong High School
          </p>

          <Card className="shadow-soft border-0 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-2/5">
                <img 
                  src={studentImage}
                  alt="Student Ambassador"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:w-3/5 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Amina Wanjiku</h2>
                  <p className="text-muted-foreground">Senior Prefect & Student Ambassador</p>
                </div>
                
                <CardContent className="p-0 space-y-4">
                  <p className="text-lg leading-relaxed">
                    When I first joined Elma Kamonong High School, I was nervous. But the teachers and students welcomed me warmly. I've learned so much more than just schoolwork here—I've learned to believe in myself.
                  </p>
                  
                  <p className="text-lg leading-relaxed">
                    Being part of the debate club helped me find my voice. Now I'm a prefect, and I help new students feel at home, just like others did for me.
                  </p>
                  
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-lg mt-6 relative">
                    <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/20" />
                    <p className="text-xl font-medium italic pt-6">
                      "We learn to believe in ourselves here. The teachers don't just teach—they encourage us to dream big and work hard."
                    </p>
                  </div>

                  <p className="text-lg leading-relaxed mt-6">
                    I'm proud to represent this school. We're not just a school—we're a family that supports each other and celebrates every success, big or small.
                  </p>
                </CardContent>
              </div>
            </div>
          </Card>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-soft text-center p-6">
              <div className="text-4xl font-bold text-primary mb-2">450+</div>
              <p className="text-muted-foreground">Active Students</p>
            </Card>
            <Card className="border-0 shadow-soft text-center p-6">
              <div className="text-4xl font-bold text-accent mb-2">15+</div>
              <p className="text-muted-foreground">Clubs & Activities</p>
            </Card>
            <Card className="border-0 shadow-soft text-center p-6">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">Student Satisfaction</p>
            </Card>
          </div>

          {/* Video Gallery Section */}
          <section className="mt-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Student Life in Action</h2>
            <p className="text-lg text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Watch our students interact, learn, and grow together
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="group overflow-hidden shadow-soft hover:shadow-hover transition-smooth border-0">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img 
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                          <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
                      <p className="text-muted-foreground">{video.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Previous Student Leaders Section */}
          <section className="mt-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Previous Student Leaders</h2>
            <p className="text-lg text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Honoring the legacy of our past student leaders who have shaped our school community
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {previousLeaders.map((leader, index) => (
                <Card key={index} className="border-0 shadow-soft hover:shadow-hover transition-smooth overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img 
                        src={leader.image}
                        alt={leader.name}
                        className="w-full h-56 object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold">{leader.rating}/5</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-1">{leader.name}</h3>
                      <p className="text-primary font-semibold mb-1">{leader.position}</p>
                      <p className="text-sm text-muted-foreground mb-3">{leader.years}</p>
                      <p className="text-sm italic">{leader.achievement}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
      <EnhancedFooter />
    </div>
  );
};

export default Student;
