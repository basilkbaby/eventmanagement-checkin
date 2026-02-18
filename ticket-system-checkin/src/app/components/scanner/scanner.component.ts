import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import {
  BarcodeFormat,
  DecodeHintType
} from '@zxing/library';
import { QrService } from '../../services/qr.service';
import { ScanResultDialogComponent } from './scan-result-dialog/scan-result-dialog.component';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ZXingScannerModule
  ],
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private dialog = inject(MatDialog);
  private qrService = inject(QrService);

  isScanning = true;
  error = '';

  availableDevices: MediaDeviceInfo[] = [];
  currentDevice?: MediaDeviceInfo;

  // QR only = much faster
formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];

  // Aggressive decode hints
decodeHints: Map<DecodeHintType, any> = new Map();

  // Mobile-optimized constraints
  videoConstraints: MediaTrackConstraints = {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 }
  };

  private scanLock = false;

  async ngOnInit() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter(d => d.kind === 'videoinput');

      if (!this.availableDevices.length) {
        this.error = 'No camera found';
        return;
      }

      // Prefer back camera
      this.currentDevice =
        this.availableDevices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        ) || this.availableDevices[0];

    } catch (err) {
      console.error(err);
      this.error = 'Failed to access camera';
    }

    this.decodeHints.set(DecodeHintType.TRY_HARDER, true);
this.decodeHints.set(DecodeHintType.POSSIBLE_FORMATS, this.formats);
  }

  onScanSuccess(result: string) {

    // Prevent multiple triggers
    if (this.scanLock) return;
    this.scanLock = true;

    this.isScanning = false;

    if (navigator.vibrate) navigator.vibrate(50);

    setTimeout(() => {
      this.showResult(result);
    }, 100);
  }

  onScanError() {
    // Ignore normal scan errors
  }

  switchCamera() {
    if (this.availableDevices.length < 2) return;

    const currentIndex = this.availableDevices.findIndex(
      d => d.deviceId === this.currentDevice?.deviceId
    );

    const nextIndex = (currentIndex + 1) % this.availableDevices.length;
    this.currentDevice = this.availableDevices[nextIndex];
  }

  private showResult(data: string) {

    const params = this.qrService.parseQRUrl(data);
    console.log('Parsed QR params:', params);
    //alert(JSON.stringify(params));
    if (params) {
      this.router.navigate(['/confirm'], {
        queryParams: params,
        replaceUrl: true
      });
    } else {
      this.dialog.open(ScanResultDialogComponent, {
        data: {
          scannedData: data,
          isRawData: true,
          message: 'Invalid QR code format'
        }
      }).afterClosed().subscribe(() => {
        this.isScanning = true;
      });
    }

    // const dialogRef = this.dialog.open(ScanResultDialogComponent, {
    //   data: { scannedData: data },
    //   width: '90%',
    //   maxWidth: '400px'
    // });

    // dialogRef.afterClosed().subscribe(action => {
    //   this.scanLock = false;

    //   if (action === 'again') {
    //     this.isScanning = true;
    //   } else if (action === 'navigate') {
    //     this.processQRData(data);
    //   } else {
    //     this.isScanning = true;
    //   }
    // });
  }

  private processQRData(data: string) {
    const params = this.qrService.parseQRUrl(data);
    console.log('Parsed QR params:', params);
    alert(JSON.stringify(params));
    if (params) {
      this.router.navigate(['/confirm'], {
        queryParams: params,
        replaceUrl: true
      });
    } else {
      this.dialog.open(ScanResultDialogComponent, {
        data: {
          scannedData: data,
          isRawData: true,
          message: 'Invalid QR code format'
        }
      }).afterClosed().subscribe(() => {
        this.isScanning = true;
      });
    }
  }

  retry() {
    this.error = '';
    this.isScanning = true;
    this.scanLock = false;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.isScanning = false;
  }
}
