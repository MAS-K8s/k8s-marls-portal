import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { DashboardDto, IDashboard } from '../dto/Dashboard.dto';

type EntityResponseType = HttpResponse<DashboardDto>;

@Injectable()
export class DashboardService {
  resourceUrl = environment.ReportUrl;
  resourceUrli = environment.InventoryUrl;

  headers = {
    AuthToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImRhbWluZHUifQ.B8BvnQhFGX7QMJzsSH8z5mJwss3YdpHpSBH7M9Zia4k',
  };

  constructor(private http: HttpClient) {}

  getDashboardData(branchId: string): Observable<HttpResponse<DashboardDto>> {
    return this.http.get<DashboardDto>(
      `${this.resourceUrl}/DashboardApi`,
      { params: { branchId }, observe: 'response', headers: this.headers }
    );
  }

  // findAllInventoryHistoryPaginated(
  //   params: any
  // ): Observable<HttpResponse<{ count: number; inventoryHistorys: InventoryHistoryDto[] }>> {
  //   return this.http.get<{ count: number; inventoryHistorys: InventoryHistoryDto[] }>(
  //     `${this.resourceUrli}/FindallInventoryHistory/pg/search`,
  //     { params, observe: 'response', headers: this.headers }
  //   );
  // }
}