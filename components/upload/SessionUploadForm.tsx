'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Upload, X, Play, AlertCircle, CheckCircle, Loader2, Film, Wind, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  session_type: z.enum(['training', 'race', 'regatta', 'practice'], {
    required_error: 'Please select a session type',
  }),
  boat_class: z.enum(['cadet', 'ilca_4', 'ilca_6', 'ilca_7', 'tasar', '29er', '420', 'other'], {
    required_error: 'Please select a boat class',
  }),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
  date: z.string().optional(),
  duration_minutes: z.number().min(1).max(480).optional(),
  wind_speed_knots: z.number().min(0).max(50).optional(),
  wind_direction_degrees: z.number().min(0).max(360).optional(),
  weather_condition: z.enum(['light', 'moderate', 'fresh', 'strong', 'extreme']).optional(),
  air_temperature_celsius: z.number().min(-10).max(50).optional(),
  water_temperature_celsius: z.number().min(-5).max(40).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface UploadedFile {
  file: File;
  preview: string;
  uploadUrl?: string;
  filePath?: string;
  fileId?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function SessionUploadForm() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      session_type: 'training',
      boat_class: 'ilca_7',
      date: new Date().toISOString().split('T')[0],
      is_public: false,
      tags: [],
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.error('Rejected files:', rejectedFiles);
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          console.error(`File ${file.name}: ${error.message}`);
        });
      });
    }

    // Process accepted files
    for (const file of acceptedFiles) {
      // Check file size (5GB limit for GoPro videos)
      if (file.size > 5 * 1024 * 1024 * 1024) {
        setUploadedFiles(prev => [...prev, {
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'error',
          error: 'File size exceeds 5GB limit'
        }]);
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);

      const newFile: UploadedFile = {
        file,
        preview,
        progress: 0,
        status: 'pending'
      };

      setUploadedFiles(prev => [...prev, newFile]);

      // Start upload
      await uploadFile(newFile);
    }
  }, []);

  const uploadFile = async (uploadedFile: UploadedFile) => {
    try {
      // Update status to uploading
      setUploadedFiles(prev =>
        prev.map(f => f === uploadedFile ? { ...f, status: 'uploading' } : f)
      );

      // Get presigned URL
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: uploadedFile.file.name,
          fileSize: uploadedFile.file.size,
          fileType: uploadedFile.file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, filePath, fileId } = await response.json();

      // Create abort controller for this upload
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Upload file using XMLHttpRequest for progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadedFiles(prev =>
              prev.map(f => f === uploadedFile ? {
                ...f,
                progress,
                uploadUrl,
                filePath,
                fileId
              } : f)
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', uploadedFile.file.type);
        xhr.send(uploadedFile.file);
      });

      // Update status to completed
      setUploadedFiles(prev =>
        prev.map(f => f === uploadedFile ? { ...f, status: 'completed', progress: 100 } : f)
      );

    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev =>
        prev.map(f => f === uploadedFile ? {
          ...f,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f)
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    multiple: true,
    disabled: isSubmitting,
  });

  const removeFile = (index: number) => {
    const file = uploadedFiles[index];
    URL.revokeObjectURL(file.preview);
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (uploadedFiles.length === 0) {
      setSubmitError('Please upload at least one video file');
      return;
    }

    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) {
      setSubmitError('No files have been successfully uploaded');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError(null);

    try {
      // Create sessions for each completed file
      const sessionPromises = completedFiles.map(async (file) => {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            video_file_path: file.filePath,
            video_file_size: file.file.size,
            video_duration_seconds: null, // Will be extracted during analysis
            video_metadata: {
              originalName: file.file.name,
              type: file.file.type,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create session for ${file.file.name}`);
        }

        return response.json();
      });

      await Promise.all(sessionPromises);
      setSubmitStatus('success');

      // Reset form after successful submission
      setTimeout(() => {
        form.reset();
        setUploadedFiles([]);
        setSubmitStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Session creation error:', error);
      setSubmitStatus('error');
      setSubmitError(error instanceof Error ? error.message : 'Failed to create sessions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Upload Sailing Session</h1>
        <p className="text-muted-foreground">
          Upload your GoPro footage to get AI-powered analysis and coaching insights
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload Video</TabsTrigger>
              <TabsTrigger value="details">Session Details</TabsTrigger>
              <TabsTrigger value="conditions">Weather Conditions</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Video Upload
                  </CardTitle>
                  <CardDescription>
                    Upload your GoPro footage (.mp4, .mov, .avi - max 5GB per file)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    {isDragActive ? (
                      <p className="text-lg font-medium">Drop the files here...</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-medium">
                          Drag & drop video files here, or click to select
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Support for GoPro .mp4, .mov, .avi files up to 5GB
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="font-medium">Uploaded Files</h4>
                      {uploadedFiles.map((file, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="relative">
                                <video
                                  src={file.preview}
                                  className="w-16 h-16 object-cover rounded"
                                  muted
                                />
                                <Play className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white drop-shadow-md" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(file.file.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                {file.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin" />}
                                {file.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                                {file.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                {file.status === 'pending' && 'Pending...'}
                                {file.status === 'uploading' && 'Uploading...'}
                                {file.status === 'completed' && 'Upload complete'}
                                {file.status === 'error' && 'Upload failed'}
                              </span>
                              <span>{file.progress}%</span>
                            </div>
                            <Progress value={file.progress} className="h-2" />
                            {file.error && (
                              <p className="text-sm text-red-500">{file.error}</p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                  <CardDescription>
                    Tell us about your sailing session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Wednesday Evening Training" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your session a memorable title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What did you work on during this session?"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="session_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select session type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="race">Race</SelectItem>
                              <SelectItem value="regatta">Regatta</SelectItem>
                              <SelectItem value="practice">Practice</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="boat_class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Boat Class *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select boat class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cadet">Cadet</SelectItem>
                              <SelectItem value="ilca_4">ILCA 4</SelectItem>
                              <SelectItem value="ilca_6">ILCA 6</SelectItem>
                              <SelectItem value="ilca_7">ILCA 7</SelectItem>
                              <SelectItem value="tasar">Tasar</SelectItem>
                              <SelectItem value="29er">29er</SelectItem>
                              <SelectItem value="420">420</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Sydney Harbour" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 90"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes about the session..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="h-5 w-5" />
                    Weather Conditions
                  </CardTitle>
                  <CardDescription>
                    Record the weather conditions during your session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="wind_speed_knots"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wind Speed (knots)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 12"
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wind_direction_degrees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wind Direction (degrees)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 225"
                              min="0"
                              max="360"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="weather_condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wind Conditions</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select wind conditions" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Light (0-8 knots)</SelectItem>
                            <SelectItem value="moderate">Moderate (8-15 knots)</SelectItem>
                            <SelectItem value="fresh">Fresh (15-20 knots)</SelectItem>
                            <SelectItem value="strong">Strong (20-25 knots)</SelectItem>
                            <SelectItem value="extreme">Extreme (25+ knots)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="air_temperature_celsius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Air Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 22"
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="water_temperature_celsius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Water Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 18"
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {submitStatus === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your session has been uploaded and is ready for analysis.
              </AlertDescription>
            </Alert>
          )}

          {submitStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setUploadedFiles([]);
                setSubmitStatus('idle');
              }}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploadedFiles.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                'Create Session'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}