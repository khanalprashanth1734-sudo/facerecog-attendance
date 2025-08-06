import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  User,
  Clock,
  BarChart3
} from "lucide-react";
import * as XLSX from 'xlsx';

interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  date: string;
  time: string;
  status: 'Present' | 'Late';
}

const Records = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [stats, setStats] = useState({
    totalRecords: 0,
    todayRecords: 0,
    uniqueMembers: 0,
    averageAttendance: 0
  });

  // Generate sample data
  useEffect(() => {
    const generateSampleData = () => {
      const names = [
        'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
        'David Wilson', 'Jessica Miller', 'James Anderson', 'Ashley Taylor',
        'Christopher Moore', 'Amanda Jackson', 'Matthew White', 'Jennifer Lee'
      ];
      
      const roles = ['Student', 'Teacher', 'Staff', 'Admin'];
      const departments = [
        'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
        'Biology', 'English', 'History', 'Administration'
      ];

      const sampleRecords: AttendanceRecord[] = [];
      
      // Generate records for the last 30 days
      for (let day = 29; day >= 0; day--) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Random number of people attending each day (70-95% attendance)
        const attendeesCount = Math.floor(names.length * (0.7 + Math.random() * 0.25));
        const shuffledNames = [...names].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < attendeesCount; i++) {
          const hour = 8 + Math.floor(Math.random() * 3); // 8-10 AM
          const minute = Math.floor(Math.random() * 60);
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          sampleRecords.push({
            id: `${dateStr}-${i}`,
            name: shuffledNames[i],
            role: roles[Math.floor(Math.random() * roles.length)],
            department: departments[Math.floor(Math.random() * departments.length)],
            date: dateStr,
            time: timeStr,
            status: hour >= 9 ? 'Late' : 'Present'
          });
        }
      }
      
      return sampleRecords.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
    };

    const sampleData = generateSampleData();
    setRecords(sampleData);
    setFilteredRecords(sampleData);

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = sampleData.filter(r => r.date === today);
    const uniqueMembers = new Set(sampleData.map(r => r.name)).size;
    
    setStats({
      totalRecords: sampleData.length,
      todayRecords: todayRecords.length,
      uniqueMembers,
      averageAttendance: Math.round((sampleData.length / 30) * 10) / 10
    });
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(record => record.role === filterRole);
    }

    if (filterDate) {
      filtered = filtered.filter(record => record.date === filterDate);
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, filterRole, filterDate]);

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    
    // Add some styling
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFFFAA00" } }
      };
    }
    
    XLSX.writeFile(workbook, `attendance_records_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
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
                <Button
                  onClick={exportToExcel}
                  className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-smooth"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredRecords.length} of {records.length} records
              </p>
              {(searchTerm || filterRole !== 'all' || filterDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRole('all');
                    setFilterDate('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card className="glass-effect card-elevated">
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Complete attendance history with timestamps and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.slice(0, 50).map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/30 transition-smooth">
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{record.department}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono">{record.time}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'Present' ? 'default' : 'secondary'}
                            className={record.status === 'Present' ? 'bg-green-500' : 'bg-yellow-500'}
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No records found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredRecords.length > 50 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing first 50 records. Use filters to narrow down results or export to Excel for complete data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Records;