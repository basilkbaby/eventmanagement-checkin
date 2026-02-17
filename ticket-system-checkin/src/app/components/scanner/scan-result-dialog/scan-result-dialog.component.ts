// components/scan-result-dialog/scan-result-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-scan-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog">
      <div class="icon" [class.success]="!data.isRawData" [class.error]="data.isRawData">
        <mat-icon>{{ data.isRawData ? 'error' : 'check_circle' }}</mat-icon>
      </div>
      
      <h2>{{ data.isRawData ? 'Scan Error' : 'QR Code Scanned!' }}</h2>
      
      @if (data.message) {
        <p class="message">{{ data.message }}</p>
      }
      
      <div class="data-box">
        <p class="label">Scanned Data:</p>
        <div class="data">{{ data.scannedData }}</div>
      </div>
      
      <div class="actions">
        <button class="continue-btn" (click)="onContinue()">
          <mat-icon>refresh</mat-icon>
          Continue Scanning
        </button>
        
        @if (!data.isRawData) {
          <button class="proceed-btn" (click)="onProceed()">
            <mat-icon>arrow_forward</mat-icon>
            Proceed
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .dialog {
      padding: 24px;
      max-width: 100%;
      text-align: center;
    }

    .icon {
      margin-bottom: 16px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      &.success mat-icon {
        color: #4caf50;
      }

      &.error mat-icon {
        color: #f44336;
      }
    }

    h2 {
      margin: 0 0 8px 0;
      font-size: 1.3rem;
      font-weight: 500;
    }

    .message {
      color: #666;
      font-size: 14px;
      margin: 0 0 16px 0;
    }

    .data-box {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      text-align: left;
    }

    .label {
      font-size: 12px;
      color: #888;
      margin: 0 0 8px 0;
    }

    .data {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      font-size: 14px;
      word-break: break-all;
      max-height: 200px;
      overflow: auto;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;

      button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;

        &:hover {
          opacity: 0.9;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .continue-btn {
        background: #f0f0f0;
        color: #333;
      }

      .proceed-btn {
        background: #4caf50;
        color: white;
      }
    }

    @media (max-width: 480px) {
      .actions {
        flex-direction: column;
      }
    }
  `]
})
export class ScanResultDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ScanResultDialogComponent>
  ) {}

  onContinue() {
    this.dialogRef.close('continue');
  }

  onProceed() {
    this.dialogRef.close('navigate');
  }
}