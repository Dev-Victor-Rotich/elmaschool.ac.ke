import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Settings } from "lucide-react";

const FeeStructureManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<any>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Form state
  const [className, setClassName] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [tuitionFee, setTuitionFee] = useState("");
  const [boardingFee, setBoardingFee] = useState("");
  const [activityFee, setActivityFee] = useState("");
  const [otherFees, setOtherFees] = useState("");
  const [description, setDescription] = useState("");

  const { data: feeStructures, isLoading } = useQuery({
    queryKey: ["fee-structures", filterYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("year", parseInt(filterYear))
        .order("class_name")
        .order("term");

      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (feeData: any) => {
      if (editingStructure) {
        const { error } = await supabase
          .from("fee_structures")
          .update(feeData)
          .eq("id", editingStructure.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fee_structures").insert(feeData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      toast.success(editingStructure ? "Fee structure updated" : "Fee structure created");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save fee structure");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      toast.success("Fee structure deleted");
    },
    onError: () => {
      toast.error("Failed to delete fee structure");
    },
  });

  const resetForm = () => {
    setClassName("");
    setTerm("");
    setYear(new Date().getFullYear().toString());
    setTuitionFee("");
    setBoardingFee("");
    setActivityFee("");
    setOtherFees("");
    setDescription("");
    setEditingStructure(null);
  };

  const handleEdit = (structure: any) => {
    setEditingStructure(structure);
    setClassName(structure.class_name);
    setTerm(structure.term);
    setYear(structure.year.toString());
    setTuitionFee(structure.tuition_fee.toString());
    setBoardingFee(structure.boarding_fee.toString());
    setActivityFee(structure.activity_fee.toString());
    setOtherFees(structure.other_fees.toString());
    setDescription(structure.description || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      class_name: className,
      term,
      year: parseInt(year),
      tuition_fee: parseFloat(tuitionFee) || 0,
      boarding_fee: parseFloat(boardingFee) || 0,
      activity_fee: parseFloat(activityFee) || 0,
      other_fees: parseFloat(otherFees) || 0,
      description,
    });
  };

  const totalPreview =
    (parseFloat(tuitionFee) || 0) +
    (parseFloat(boardingFee) || 0) +
    (parseFloat(activityFee) || 0) +
    (parseFloat(otherFees) || 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Fee Structure Setup
            </CardTitle>
            <CardDescription>Define fees per class, term and year</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fee Structure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingStructure ? "Edit" : "Add"} Fee Structure</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Input
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="Grade 10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Term</Label>
                      <Select value={term} onValueChange={setTerm} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Term 1</SelectItem>
                          <SelectItem value="2">Term 2</SelectItem>
                          <SelectItem value="3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Tuition Fee (KES)</Label>
                      <Input
                        type="number"
                        value={tuitionFee}
                        onChange={(e) => setTuitionFee(e.target.value)}
                        placeholder="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Boarding Fee (KES)</Label>
                      <Input
                        type="number"
                        value={boardingFee}
                        onChange={(e) => setBoardingFee(e.target.value)}
                        placeholder="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Activity Fee (KES)</Label>
                      <Input
                        type="number"
                        value={activityFee}
                        onChange={(e) => setActivityFee(e.target.value)}
                        placeholder="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Fees (KES)</Label>
                      <Input
                        type="number"
                        value={otherFees}
                        onChange={(e) => setOtherFees(e.target.value)}
                        placeholder="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium">
                      Total Fee: <span className="text-primary">KES {totalPreview.toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Day scholar fees"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : editingStructure ? "Update" : "Create"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading...</p>
        ) : feeStructures?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No fee structures defined for {filterYear}. Add one to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead className="text-right">Tuition</TableHead>
                  <TableHead className="text-right">Boarding</TableHead>
                  <TableHead className="text-right">Activity</TableHead>
                  <TableHead className="text-right">Other</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeStructures?.map((structure) => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.class_name}</TableCell>
                    <TableCell>Term {structure.term}</TableCell>
                    <TableCell className="text-right">
                      {Number(structure.tuition_fee).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(structure.boarding_fee).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(structure.activity_fee).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(structure.other_fees).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      KES {Number(structure.total_fee).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(structure)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(structure.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeeStructureManager;
