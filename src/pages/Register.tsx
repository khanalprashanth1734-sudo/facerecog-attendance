import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  CameraOff, 
  UserPlus, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw
} from "lucide-react";
import * as faceapi from "face-api.js";

interface RegisterFormData {
  name: string;
  class: string;
}

const Register = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    role: '',
    department: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsModelLoaded(true);
        toast({
          title: "Models Loaded",
          description: "Face recognition models ready for registration",
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
    }
  };

  // Capture photo and extract face descriptor
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !photoCanvasRef.current || !isModelLoaded) return;

    setIsCapturing(true);
    setError(null);

    try {
      // Detect face
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected. Please ensure your face is clearly visible and try again.');
        setIsCapturing(false);
        return;
      }

      // Capture the current frame
      const canvas = photoCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        // Draw the video frame (mirrored)
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        ctx.scale(-1, 1);
        
        // Convert to data URL
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoDataUrl);
        
        // Store face descriptor
        setFaceDescriptor(detection.descriptor);
        
        toast({
          title: "Photo Captured",
          description: "Face data extracted successfully",
        });
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('Error capturing photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Reset capture
  const resetCapture = () => {
    setCapturedPhoto(null);
    setFaceDescriptor(null);
  };

  // Handle form submission
  const handleRegister = async () => {
    if (!formData.name || !formData.role || !faceDescriptor) {
      setError('Please fill all fields and capture a photo.');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      // In a real application, this would save to a database
      const memberData = {
        id: Date.now().toString(),
        name: formData.name,
        role: formData.role,
        department: formData.department,
        photo: capturedPhoto,
        faceDescriptor: Array.from(faceDescriptor), // Convert to array for storage
        registeredAt: new Date().toISOString()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save to localStorage (in real app, save to database)
      const existingMembers = JSON.parse(localStorage.getItem('faceAttendMembers') || '[]');
      existingMembers.push(memberData);
      localStorage.setItem('faceAttendMembers', JSON.stringify(existingMembers));

      toast({
        title: "Registration Successful",
        description: `${formData.name} has been registered successfully!`,
      });

      // Reset form
      setFormData({ name: '', role: '', department: '' });
      setCapturedPhoto(null);
      setFaceDescriptor(null);
      stopCamera();

    } catch (error) {
      console.error('Error registering member:', error);
      setError('Failed to register member. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Register New Member
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Add a new member to the face recognition system by filling out their details and capturing their face data
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Registration Form */}
          <Card className="glass-effect card-elevated">
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
              <CardDescription>
                Enter the member's details below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="visitor">Visitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department/Class</Label>
                <Input
                  id="department"
                  placeholder="e.g., Computer Science, Class 11A"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>

              {/* Face Data Status */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label>Face Data</Label>
                  {faceDescriptor ? (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Captured
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Capture a clear photo of the member's face using the camera
                </p>
              </div>

              {/* Register Button */}
              <Button
                className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-smooth"
                onClick={handleRegister}
                disabled={!formData.name || !formData.role || !faceDescriptor || isRegistering}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Register Member
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Camera Section */}
          <Card className="glass-effect card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Face Capture
              </CardTitle>
              <CardDescription>
                {capturedPhoto ? "Photo captured successfully" : "Position face clearly in camera and capture"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {capturedPhoto ? (
                // Show captured photo
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={capturedPhoto} 
                      alt="Captured face" 
                      className="w-full rounded-lg border"
                    />
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Face Detected
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={resetCapture}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Photo
                  </Button>
                </div>
              ) : (
                // Show camera interface
                <div className="space-y-4">
                  <div className="relative bg-muted rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      width="400"
                      height="300"
                      autoPlay
                      muted
                      className="w-full h-auto"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full"
                      style={{ transform: 'scaleX(-1)' }}
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
                  <div className="flex space-x-2">
                    {!isCameraActive ? (
                      <Button 
                        onClick={startCamera}
                        disabled={!isModelLoaded}
                        className="flex-1"
                        variant="outline"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={capturePhoto}
                          disabled={isCapturing}
                          className="flex-1 gradient-primary text-primary-foreground hover:opacity-90 transition-smooth"
                        >
                          {isCapturing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Capturing...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              Capture
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={stopCamera}
                          variant="outline"
                        >
                          <CameraOff className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Hidden canvas for photo capture */}
              <canvas ref={photoCanvasRef} className="hidden" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;