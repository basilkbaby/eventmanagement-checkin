// services/qr.service.ts
import { Injectable } from '@angular/core';
import { BrowserQRCodeReader, Result } from '@zxing/library';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  private codeReader: BrowserQRCodeReader;

  constructor() {
    this.codeReader = new BrowserQRCodeReader();
  }

  async scanFromVideo(videoElement: HTMLVideoElement): Promise<string | null> {
    if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      return null;
    }

    try {
      // Method 1: Use decodeFromVideoElement (simpler)
      const result = await this.codeReader.decodeFromVideoElement(videoElement);
      return result.getText();
    } catch (error) {
      // Method 2: Fallback to canvas approach
      return this.scanFromVideoCanvas(videoElement);
    }
  }

  private async scanFromVideoCanvas(videoElement: HTMLVideoElement): Promise<string | null> {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      return null;
    }

    // Set canvas dimensions to match video
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw video frame to canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    try {
      // Convert canvas to image element
      const image = new Image();
      image.src = canvas.toDataURL('image/png');
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      
      // Decode QR from image
      const result = await this.codeReader.decodeFromImageElement(image);
      return result.getText();
    } catch (error) {
      console.debug('QR scan failed:', error);
      return null;
    }
  }

  async scanFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
    try {
      // Convert canvas to image element
      const image = new Image();
      image.src = canvas.toDataURL('image/png');
      
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        setTimeout(() => reject(new Error('Image load timeout')), 1000);
      });
      
      const result = await this.codeReader.decodeFromImageElement(image);
      return result.getText();
    } catch (error) {
      console.debug('Canvas scan failed:', error);
      return null;
    }
  }

  parseQRUrl(qrData: string): any {
    try {
      // Check if it's a URL
      if (qrData.startsWith('http')) {
        const url = new URL(qrData);
        
        // Check if it's our booking URL
        if (url.hostname === 'booking.v4entertainments.co.uk') {
          const params = new URLSearchParams(url.search);
          
          return {
            orderId: params.get('orderId'),
            ticketId: params.get('ticketId'),
            code: params.get('code')
          };
        }
        
        // Also support direct check-in URLs
        if (url.hostname === 'checkin.v4entertainments.co.uk') {
          const params = new URLSearchParams(url.search);
          
          return {
            orderId: params.get('orderId'),
            ticketId: params.get('ticketId'),
            code: params.get('code')
          };
        }
      }

      // Check if it's a direct parameter string
      const params = new URLSearchParams(qrData);
      if (params.has('orderId') && params.has('ticketId') && params.has('code')) {
        return {
          orderId: params.get('orderId'),
          ticketId: params.get('ticketId'),
          code: params.get('code')
        };
      }

      // Check if it's JSON encoded data
      if (qrData.startsWith('{') || qrData.startsWith('[')) {
        try {
          const data = JSON.parse(qrData);
          if (data.orderId && data.ticketId && data.code) {
            return data;
          }
        } catch {
          // Not valid JSON
        }
      }

      return null;
    } catch (error) {
      console.error('QR parsing error:', error);
      return null;
    }
  }
}