import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export const AdmissionLettersManager = () => {
  const [open, setOpen] = useState(false);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [gender, setGender] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [uploading, setUploading] = useState(false);
  const [letterUrl, setLetterUrl] = useState("");

  const queryClient = useQueryClient();

  const { data: letters } = useQuery({
    queryKey: ["admission-letters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_letters")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("admission_letters").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-letters"] });
      toast.success("Admission letter added");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admission_letters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-letters"] });
      toast.success("Admission letter deleted");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `admission-letters/${fileName}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(data.path);

      setLetterUrl(publicUrl);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setOpen(false);
    setAdmissionNumber("");
    setStudentName("");
    setFormGrade("");
    setGender("");
    setCurriculum("");
    setLetterUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterUrl) {
      toast.error("Please upload admission letter");
      return;
    }
    
    createMutation.mutate({
      admission_number: admissionNumber,
      student_name: studentName,
      form_grade: formGrade,
      gender,
      curriculum,
      letter_url: letterUrl,
    });
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Admission Letter
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Admission Letter</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Admission Number</Label>
              <Input
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="e.g., 2026/001"
                required
              />
            </div>
            <div>
              <Label>Student Name</Label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student full name"
                required
              />
            </div>
            <div>
              <Label>Form/Grade</Label>
              <Select value={formGrade} onValueChange={setFormGrade} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select form/grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Form 3">Form 3</SelectItem>
                  <SelectItem value="Form 4">Form 4</SelectItem>
                  <SelectItem value="Grade 10">Grade 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boys">Boys</SelectItem>
                  <SelectItem value="Girls">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Curriculum</Label>
              <Select value={curriculum} onValueChange={setCurriculum} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select curriculum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBC">CBC</SelectItem>
                  <SelectItem value="8-4-4">8-4-4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Admission Letter (PDF)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {letterUrl && <FileText className="h-5 w-5 text-green-500" />}
              </div>
              {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
            </div>
            <Button type="submit" className="w-full" disabled={!letterUrl}>
              Add Letter
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {letters?.map((letter) => (
          <div key={letter.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{letter.student_name}</p>
                <p className="text-sm text-muted-foreground">
                  {letter.admission_number} • {letter.form_grade} • {letter.gender} • {letter.curriculum}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                asChild
              >
                <a href={letter.letter_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => deleteMutation.mutate(letter.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
