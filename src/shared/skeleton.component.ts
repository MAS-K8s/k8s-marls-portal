import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div [ngSwitch]="type" class="w-full">
      <!-- Table Skeleton -->
      <ng-container *ngSwitchCase="'table'">
        <div class="w-full overflow-x-auto">
          <p-table>
            <ng-template pTemplate="header">
              <tr>
                <th *ngFor="let col of columns">
                  <p-skeleton height="2rem" class="w-full"></p-skeleton>
                </th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body">
              <tr *ngFor="let _ of generateArray(rows)">
                <td *ngFor="let col of columns">
                  <p-skeleton height="1.5rem" class="w-full"></p-skeleton>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </ng-container>

      <!-- List Skeleton -->
      <ng-container *ngSwitchCase="'list'">
        <div class="space-y-4">
          <div *ngFor="let _ of generateArray(items)" class="flex items-center space-x-4">
            <p-skeleton shape="circle" size="4rem"></p-skeleton>
            <div class="flex-1">
              <p-skeleton width="100%" height="1.5rem" class="mb-2"></p-skeleton>
              <p-skeleton width="75%" height="1rem"></p-skeleton>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Card Skeleton -->
      <ng-container *ngSwitchCase="'card'">
        <div class="space-y-4">
          <p-skeleton width="100%" height="200px"></p-skeleton>
          <div class="space-y-2">
            <p-skeleton width="100%" height="1.5rem"></p-skeleton>
            <p-skeleton width="75%" height="1rem"></p-skeleton>
          </div>
        </div>
      </ng-container>

      <!-- Form Skeleton -->
      <ng-container *ngSwitchCase="'form'">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div *ngFor="let _ of generateArray(fields)" class="space-y-2">
            <p-skeleton width="100%" height="3rem"></p-skeleton>
          </div>
        </div>
        <div class="flex justify-end space-x-2 mt-4">
          <p-skeleton width="100px" height="2.5rem"></p-skeleton>
          <p-skeleton width="100px" height="2.5rem"></p-skeleton>
        </div>
      </ng-container>
    </div>
  `,
  imports: [Skeleton, CommonModule, Table]
})
export class SkeletonComponent {
  @Input() type: 'table' | 'list' | 'card' | 'form' = 'table';
  @Input() rows: number = 5;
  @Input() columns: any[] = [];
  @Input() items: number = 3;
  @Input() fields: number = 4;

  generateArray(count: number): number[] {
    return Array.from({ length: count });
  }
}
