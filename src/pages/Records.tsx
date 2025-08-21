import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  User,
  Clock,
  BarChart3,
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import * as XLSX from 'xlsx';

interface AttendanceRecord {
  id: string;
  student_name: string;
  student_class: string;
  created_at: string;
  status: string;
  confidence: number | null;
  late_count: number | null;
  is_late: boolean | null;
  absent_count: number | null;
}

const Records = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [clearPassword, setClearPassword] = useState('');
  const [stats, setStats] = useState({
    totalRecords: 0,
    todayRecords: 0,
    uniqueMembers: 0,
    averageAttendance: 0
  });
  const [lateComers, setLateComers] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load attendance records from Supabase
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('attendance_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50); // Only get top 50 recent records

        if (fetchError) throw fetchError;

        setRecords(data || []);
        
        // Calculate stats
        const today = new Date().toDateString();
        const todayRecords = data?.filter(record => 
          new Date(record.created_at).toDateString() === today
        ).length || 0;
        
        const uniqueMembers = new Set(data?.map(record => record.student_name)).size;
        
        setStats({
          totalRecords: data?.length || 0,
          todayRecords,
          uniqueMembers,
          averageAttendance: Math.round((data?.length || 0) / Math.max(1, new Date().getDate()))
        });

        // Load late comers
        const { data: lateComersData, error: lateComersError } = await supabase
          .from('late_comers')
          .select('*')
          .order('total_late_count', { ascending: false });

        if (lateComersError) {
          console.error('Error loading late comers:', lateComersError);
        } else {
          setLateComers(lateComersData || []);
        }
      } catch (error) {
        console.error('Error loading records:', error);
        setError('Failed to load attendance records');
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student_class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      const filterDateString = new Date(filterDate).toDateString();
      filtered = filtered.filter(record => 
        new Date(record.created_at).toDateString() === filterDateString
      );
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, filterDate]);

  // Verify password and export to Excel
  const verifyPasswordAndExport = async () => {
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password to download the file.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Verify password by attempting to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: password
      });

      if (error) {
        toast({
          title: "Invalid Password",
          description: "The password you entered is incorrect.",
          variant: "destructive"
        });
        return;
      }

      // Group records by class for separate sheets
      const recordsByClass = filteredRecords.reduce((acc, record) => {
        const className = record.student_class || 'Unassigned';
        if (!acc[className]) {
          acc[className] = [];
        }
        acc[className].push(record);
        return acc;
      }, {} as Record<string, AttendanceRecord[]>);

      const workbook = XLSX.utils.book_new();

      // Create a sheet for each class
      Object.entries(recordsByClass).forEach(([className, records]) => {
        const exportData = records.map(record => ({
          'Student Name': record.student_name,
          'Date': new Date(record.created_at).toLocaleDateString(),
          'Time': new Date(record.created_at).toLocaleTimeString(),
          'Status': record.status,
          'Late Status': record.is_late ? 'Late' : 'On Time',
          'Total Late Count': record.late_count || 0,
          'Absent Count': record.absent_count || 0,
          'Confidence': record.confidence ? `${(record.confidence * 100).toFixed(1)}%` : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Style headers
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; C++) {
          const address = XLSX.utils.encode_col(C) + "1";
          if (!worksheet[address]) continue;
          worksheet[address].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "4472C4" } }
          };
        }

        // Style late status cells as yellow
        for (let R = range.s.r + 1; R <= range.e.r; R++) {
          const lateStatusCol = 4; // "Late Status" column
          const cellAddress = XLSX.utils.encode_col(lateStatusCol) + (R + 1);
          if (worksheet[cellAddress] && worksheet[cellAddress].v === 'Late') {
            worksheet[cellAddress].s = {
              fill: { fgColor: { rgb: "FFFF00" } }
            };
          }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, className.substring(0, 31)); // Sheet name limit
      });
      
      XLSX.writeFile(workbook, `attendance_records_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: "Attendance records have been exported to Excel.",
      });

      setShowPasswordDialog(false);
      setPassword('');
    } catch (error) {
      console.error('Error verifying password:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the file.",
        variant: "destructive"
      });
    }
  };

  // Verify password and clear all records
  const verifyPasswordAndClear = async () => {
    if (!clearPassword) {
      toast({
        title: "Password Required",
        description: "Please enter your password to clear all records.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Verify password by attempting to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: clearPassword
      });

      if (error) {
        toast({
          title: "Invalid Password",
          description: "The password you entered is incorrect.",
          variant: "destructive"
        });
        return;
      }

      // Clear all attendance records
      const { error: deleteError } = await supabase
        .from('attendance_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: "Records Cleared",
        description: "All attendance records have been successfully deleted.",
      });

      // Refresh the records and stats
      setRecords([]);
      setFilteredRecords([]);
      setLateComers([]);
      setStats({
        totalRecords: 0,
        todayRecords: 0,
        uniqueMembers: 0,
        averageAttendance: 0
      });

      setShowClearDialog(false);
      setClearPassword('');
    } catch (error) {
      console.error('Error clearing records:', error);
      toast({
        title: "Clear Failed",
        description: "An error occurred while clearing the records.",
        variant: "destructive"
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <FileSpreadsheet className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Attendance Records
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            View, filter, and export attendance data with comprehensive reporting tools
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalRecords}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Attendance</p>
                  <p className="text-2xl font-bold text-primary">{stats.todayRecords}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-primary">{stats.uniqueMembers}</p>
                </div>
                <User className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Average</p>
                  <p className="text-2xl font-bold text-primary">{stats.averageAttendance}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="glass-effect card-elevated mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-smooth">
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Verify Password</DialogTitle>
                        <DialogDescription>
                          Please enter your password to download the attendance records.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={verifyPasswordAndExport}
                            className="flex-1"
                          >
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowPasswordDialog(false);
                              setPassword('');
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Records
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Clear All Records</DialogTitle>
                        <DialogDescription>
                          This will permanently delete all attendance records. Please enter your password to confirm.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="clearPassword">Password</Label>
                          <Input
                            id="clearPassword"
                            type="password"
                            value={clearPassword}
                            onChange={(e) => setClearPassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={verifyPasswordAndClear}
                            variant="destructive"
                            className="flex-1"
                          >
                            Clear All
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowClearDialog(false);
                              setClearPassword('');
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredRecords.length} of {records.length} records
              </p>
              {(searchTerm || filterDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDate('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Late Comers Section */}
        {lateComers.length > 0 && (
          <Card className="glass-effect card-elevated mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                Late Comers (More than 3 Late Arrivals)
              </CardTitle>
              <CardDescription>
                Students who have exceeded the late arrival threshold
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lateComers.map((lateComer) => (
                  <div 
                    key={lateComer.id}
                    className="p-4 bg-destructive/10 rounded-lg border border-destructive/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{lateComer.student_name}</h4>
                      <Badge variant="destructive">
                        {lateComer.total_late_count} Late
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Class: {lateComer.student_class}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records Table */}
        <Card className="glass-effect card-elevated">
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Complete attendance history with timestamps and status
            </CardDescription>
          </CardHeader>
          <CardContent>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Late Status</TableHead>
                          <TableHead>Late Count</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading records...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No attendance records found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRecords.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.student_name}</TableCell>
                              <TableCell>{record.student_class}</TableCell>
                              <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(record.created_at).toLocaleTimeString()}</TableCell>
                              <TableCell>
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={record.is_late ? "destructive" : "default"} 
                                  className={record.is_late ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : "bg-green-100 text-green-800 hover:bg-green-100"}
                                >
                                  {record.is_late ? 'Late' : 'On Time'}
                                </Badge>
                              </TableCell>
                              <TableCell>{record.late_count || 0}</TableCell>
                              <TableCell>
                                {record.confidence ? `${(record.confidence * 100).toFixed(1)}%` : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
            
            {filteredRecords.length >= 50 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing recent 50 records. Use filters to narrow down results or export to Excel for complete data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Records;