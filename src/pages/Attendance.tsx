import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Camera, 
  CameraOff, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Scan
} from "lucide-react";
import * as faceapi from "face-api.js";

interface AttendanceRecord {
  name: string;
  timestamp: string;
  confidence: number;
  status: 'success' | 'unknown';
}

const Attendance = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<AttendanceRecord | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const { toast } = useToast();

  // Load students from database
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*');
        
        if (error) throw error;
        setStudents(data || []);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };

    loadStudents();
  }, []);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsModelLoaded(true);
        toast({
          title: "Models Loaded",
          description: "Face recognition models loaded successfully",
        });
      } catch (error) {
        console.error('Error loading models:', error);
        setError('Failed to load face recognition models');
      }
    };

    loadModels();
  }, [toast]);

  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        toast({
          title: "Camera Started",
          description: "Camera is now active for face detection",
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      setIsDetecting(false);
      setCurrentDetection(null);
    }
  };

  // Detect faces
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;

    setIsDetecting(true);
    
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      const canvas = canvasRef.current;
      const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
      faceapi.matchDimensions(canvas, displaySize);

      if (detection) {
        // Clear previous drawings
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Draw detection box
        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        faceapi.draw.drawDetections(canvas, [resizedDetection]);
        faceapi.draw.drawFaceLandmarks(canvas, [resizedDetection]);

        // Match against registered students
        let bestMatch = null;
        let bestDistance = Infinity;
        
        for (const student of students) {
          if (student.face_descriptor_json) {
            try {
              const storedDescriptor = new Float32Array(JSON.parse(student.face_descriptor_json));
              const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
              
              if (distance < bestDistance && distance < 0.6) { // Threshold for recognition
                bestDistance = distance;
                bestMatch = student;
              }
            } catch (error) {
              console.error('Error parsing face descriptor:', error);
            }
          }
        }
        
        if (bestMatch) {
          const confidence = Math.max(0, 1 - bestDistance);
          const attendanceRecord: AttendanceRecord = {
            name: bestMatch.name,
            timestamp: new Date().toLocaleString(),
            confidence,
            status: 'success'
          };
          
          setCurrentDetection(attendanceRecord);
          
            // Check if student already has attendance record for today
            try {
              const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
              
              const { data: existingRecords, error: checkError } = await supabase
                .from('attendance_records')
                .select('id')
                .eq('student_id', bestMatch.id)
                .gte('timestamp', `${today}T00:00:00`)
                .lt('timestamp', `${today}T23:59:59`);

              if (checkError) {
                console.error('Error checking existing attendance:', checkError);
                return;
              }

              if (existingRecords && existingRecords.length > 0) {
                // Student already has attendance for today
                toast({
                  title: "Already Recorded",
                  description: `${bestMatch.name} attendance already recorded today`,
                  variant: "default"
                });
                return;
              }

              // Check if student is late (after 8:30 AM)
              const now = new Date();
              const cutoffTime = new Date();
              cutoffTime.setHours(8, 30, 0, 0); // 8:30 AM
              
              const isLate = now > cutoffTime;
              
              // Get current late count for this student
              const { data: latestRecord } = await supabase
                .from('attendance_records')
                .select('late_count')
                .eq('student_name', bestMatch.name)
                .order('created_at', { ascending: false })
                .limit(1);
                
              const currentLateCount = latestRecord?.[0]?.late_count || 0;
              const newLateCount = isLate ? currentLateCount + 1 : currentLateCount;

              // Save attendance to database (only if no existing record)
              const { error: insertError } = await supabase
                .from('attendance_records')
                .insert({
                  student_id: bestMatch.id,
                  student_name: bestMatch.name,
                  student_class: bestMatch.class,
                  confidence: confidence,
                  status: 'present',
                  is_late: isLate,
                  late_count: newLateCount
                });

              if (insertError) {
                console.error('Error saving attendance:', insertError);
              } else {
                // Check if student should be added to late_comers table
                if (newLateCount > 3) {
                  const { data: existingLateComer } = await supabase
                    .from('late_comers')
                    .select('id')
                    .eq('student_name', bestMatch.name)
                    .eq('student_class', bestMatch.class);
                    
                  if (!existingLateComer?.length) {
                    // Add to late_comers table
                    await supabase
                      .from('late_comers')
                      .insert({
                        student_name: bestMatch.name,
                        student_class: bestMatch.class,
                        total_late_count: newLateCount
                      });
                  } else {
                    // Update existing late_comer record
                    await supabase
                      .from('late_comers')
                      .update({ total_late_count: newLateCount })
                      .eq('student_name', bestMatch.name)
                      .eq('student_class', bestMatch.class);
                  }
                }

                // Update recent attendance (keep only 35 most recent)
                setRecentAttendance(prev => [attendanceRecord, ...prev.slice(0, 34)]);
                
                toast({
                  title: "Attendance Recorded",
                  description: `${attendanceRecord.name} - ${attendanceRecord.timestamp}${isLate ? ' (Late)' : ''}`,
                  variant: isLate ? "destructive" : "default"
                });
              }
            } catch (error) {
              console.error('Error saving attendance:', error);
            }
        } else {
          setCurrentDetection({
            name: "Unknown Person",
            timestamp: new Date().toLocaleString(),
            confidence: 0,
            status: 'unknown'
          });
        }
      } else {
        setCurrentDetection(null);
        // Clear canvas if no face detected
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } catch (error) {
      console.error('Error detecting faces:', error);
      setError('Error during face detection');
    } finally {
      setIsDetecting(false);
    }
  };

  // Auto-detect faces when camera is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCameraActive && isModelLoaded) {
      interval = setInterval(detectFaces, 1000); // Check every second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraActive, isModelLoaded]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <Scan className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Live Attendance
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Position yourself in front of the camera for automatic face recognition and attendance marking
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera Section */}
          <div className="lg:col-span-2">
            <Card className="glass-effect card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Face Recognition Camera
                </CardTitle>
                <CardDescription>
                  {isModelLoaded ? "Models loaded - ready for detection" : "Loading face recognition models..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Video Stream */}
                  <div className="relative bg-muted rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      width="640"
                      height="480"
                      autoPlay
                      muted
                      className="w-full h-auto"
                      style={{ transform: 'scaleX(-1)' }} // Mirror effect
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full"
                      style={{ transform: 'scaleX(-1)' }} // Mirror effect
                    />
                    
                    {/* Loading Overlay */}
                    {!isModelLoaded && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Loading AI models...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* No Camera Overlay */}
                    {!isCameraActive && isModelLoaded && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <CameraOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Camera not active</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex justify-center space-x-4 mt-4">
                    {!isCameraActive ? (
                      <Button 
                        onClick={startCamera}
                        disabled={!isModelLoaded}
                        className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopCamera}
                        variant="destructive"
                      >
                        <CameraOff className="h-4 w-4 mr-2" />
                        Stop Camera
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detection Results */}
          <div className="space-y-6">
            {/* Current Detection */}
            <Card className="glass-effect card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Current Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isDetecting && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                )}
                
                {currentDetection ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{currentDetection.name}</span>
                      <Badge variant={currentDetection.status === 'success' ? 'default' : 'secondary'}>
                        {currentDetection.status === 'success' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {currentDetection.status === 'success' ? 'Recognized' : 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {currentDetection.timestamp}
                    </div>
                    <div className="text-sm">
                      Confidence: {(currentDetection.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  !isDetecting && isCameraActive && (
                    <p className="text-muted-foreground text-sm">No face detected</p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card className="glass-effect card-elevated">
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>Latest successful recognitions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAttendance.length > 0 ? (
                    recentAttendance.map((record, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border-l-2 border-primary"
                      >
                        <div>
                          <div className="font-medium">{record.name}</div>
                          <div className="text-xs text-muted-foreground">{record.timestamp}</div>
                        </div>
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Recorded
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No attendance records yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;