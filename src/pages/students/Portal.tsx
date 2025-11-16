import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, DollarSign, Calendar, BookOpen } from "lucide-react";
import { toast } from "sonner";

const StudentPortal = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<any>(null);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Verify student role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || roles.length === 0 || roles[0].role !== "student") {
      toast.error("Access denied. Student credentials required.");
      navigate("/auth");
      return;
    }

    loadStudentData(session.user.id);
  };

  const loadStudentData = async (userId: string) => {
    // Load student data
    const { data: student } = await supabase
      .from("students_data")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (student) {
      setStudentData(student);

      // Load fee payments
      const { data: fees } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      setFeeData(fees || []);

      // Load academic results
      const { data: academicResults } = await supabase
        .from("academic_results")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      setResults(academicResults || []);
    }

    // Load approved events
    const { data: approvedEvents } = await supabase
      .from("events")
      .select("*")
      .eq("approved", true)
      .order("event_date", { ascending: true })
      .limit(5);

    setEvents(approvedEvents || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!studentData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{studentData.full_name}</h1>
              <p className="text-sm opacity-90">
                {studentData.class} • Admission: {studentData.admission_number}
              </p>
            </div>
            <Button onClick={handleLogout} variant="secondary">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Parent Name</p>
                <p className="font-medium">{studentData.parent_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parent Phone</p>
                <p className="font-medium">{studentData.parent_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Fee Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feeData.length > 0 ? (
                <div className="space-y-2">
                  {feeData.slice(0, 3).map((fee) => (
                    <div key={fee.id} className="flex justify-between items-center">
                      <span className="text-sm">{fee.term} {fee.year}</span>
                      <Badge variant={fee.balance > 0 ? "destructive" : "default"}>
                        Balance: KES {fee.balance}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No fee records yet</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="border-l-2 border-primary pl-2">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Academic Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Academic Results
            </CardTitle>
            <CardDescription>Your recent performance</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{result.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.term} {result.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{result.marks}%</p>
                      <Badge>{result.grade}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No results available yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentPortal;
