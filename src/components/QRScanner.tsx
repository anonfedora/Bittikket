"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import jsQR from "jsqr";

interface QRScannerProps {
  onScan: (data: { ticketId: string; eventId: string }) => void;
  onError: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then((permission) => {
        setPermissionStatus(permission.state);
        permission.onchange = () => {
          setPermissionStatus(permission.state);
        };
      }).catch((err) => {
         console.error("Error querying camera permission:", err);
         setErrorMessage("Could not check camera permissions.");
         setPermissionStatus('denied');
         onError("Could not check camera permissions.");
      });
    } else {
      console.error("Camera permissions cannot be checked in this browser.");
      setPermissionStatus('denied');
      onError("Camera permissions cannot be checked.");
    }

    return () => {
      
    };
  }, [onError]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    const startScanner = () => {
       if (scannerRef.current) {
           scannerRef.current.clear();
           scannerRef.current = null;
       }

       if (permissionStatus === 'granted' || permissionStatus === 'prompt') {
           scanner = new Html5QrcodeScanner(
             "qr-reader",
             {
               fps: 10,
               qrbox: { width: 250, height: 250 },
             },
             false
           );

           scanner.render(
             (decodedText) => {
               try {
                 const data = JSON.parse(decodedText);
                 if (data.ticketId && data.eventId) {
                   onScan(data);
                 } else {
                   setErrorMessage("Invalid QR code format from camera.");
                   onError("Invalid QR code format from camera.");
                 }
               } catch (parseError) {
                 setErrorMessage("Invalid QR code data from camera.");
                 onError("Invalid QR code data from camera.");
               }
             },
             (error) => {
                console.error("Live scanner error:", error);
             }
           );
           scannerRef.current = scanner;
           setErrorMessage(null);
       } else if (permissionStatus === 'denied') {
            setErrorMessage("Camera access denied. Please enable camera permissions in your browser settings.");
            onError("Camera access denied.");
       }
    };

    const stopScanner = () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      setErrorMessage(null);
    };

    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };

  }, [isScanning, onScan, onError, permissionStatus]);

  const toggleScanner = () => {
    if (!isScanning && permissionStatus === 'denied') {
         setErrorMessage("Camera access denied. Cannot start scanner.");
         onError("Camera access denied.");
         return;
    }
    setIsScanning(!isScanning);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (isScanning) {
      setIsScanning(false);
    }

    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) {
            setErrorMessage("Canvas element not available for image decoding.");
            onError("Canvas element not available.");
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setErrorMessage("Could not get canvas 2D context.");
            onError("Could not get canvas context.");
            return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        try {
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            try {
                const data = JSON.parse(code.data);
                if (data.ticketId && data.eventId) {
                  onScan(data);
                  setErrorMessage(null);
                } else {
                  setErrorMessage("Invalid QR code format in image.");
                  onError("Invalid QR code format in image.");
                }
            } catch (parseError) {
                setErrorMessage("Invalid QR code data in image.");
                onError("Invalid QR code data in image.");
            }
          } else {
            setErrorMessage("No QR code found in the image.");
            onError("No QR code found in the image.");
          }
        } catch (decodeError) {
            console.error("jsQR decode error:", decodeError);
            setErrorMessage(`Error decoding QR code from image: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
            onError(`Error decoding QR code from image: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
        }
      };
      img.onerror = () => {
        setErrorMessage("Failed to load image for decoding.");
        onError("Failed to load image.");
      };
      if (e.target?.result && typeof e.target.result === 'string') {
         img.src = e.target.result;
      } else {
         setErrorMessage("Could not read image file as Data URL.");
         onError("Could not read image file.");
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setErrorMessage("Failed to read image file.");
      onError("Failed to read image file.");
    };

    reader.readAsDataURL(file);

    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
     if (fileInputRef.current) {
         fileInputRef.current.click();
     }
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {permissionStatus === 'denied' && errorMessage && (
         <div className="text-red-500 text-center text-sm">{errorMessage}</div>
      )}

      <div className="relative aspect-square w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden">
        {!isScanning || permissionStatus === 'denied' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <CameraOff className="h-12 w-12 text-white" />
            {!isScanning && permissionStatus !== 'denied' && !errorMessage && (
                <span className="text-white ml-2">Press 'Start Scanning' or 'Upload' below</span>
            )}
             {!isScanning && permissionStatus === 'denied' && errorMessage && (
                <span className="text-white ml-2 text-center">{errorMessage}</span>
            )}
             {!isScanning && permissionStatus === 'prompt' && !errorMessage && (
                 <span className="text-white ml-2 text-center">Press 'Start Scanning' below to request camera access.</span>
             )}
          </div>
        ) : (
          <div id="qr-reader" className="w-full h-full" />
        )}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={toggleScanner}
          variant="outline"
          className="flex items-center gap-2"
          disabled={permissionStatus === 'denied'}
        >
          {isScanning ? (
            <>
              <CameraOff className="h-4 w-4" />
              Stop Scanning
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Start Scanning
            </>
          )}
        </Button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <Button
           onClick={triggerFileUpload}
           variant="outline"
           className="flex items-center gap-2"
           disabled={false}
        >
            Upload QR Code Image
        </Button>
      </div>
       {errorMessage && permissionStatus !== 'denied' && (
           <div className="text-red-500 text-center text-sm">{errorMessage}</div>
       )}
    </div>
  );
} 