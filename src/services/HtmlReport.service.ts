import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HtmlReportService {
  private baseUrl = environment.ReportUrl;
  private headers: HttpHeaders;

  constructor(private http: HttpClient) {
    this.headers = new HttpHeaders({
      AuthToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImRhbWluZHUifQ.B8BvnQhFGX7QMJzsSH8z5mJwss3YdpHpSBH7M9Zia4k',
    });
  }

  generateSalesSummaryReport(
    fromDate: string,
    toDate: string,
    branchID: string
  ): Observable<HttpResponse<string>> {
    const updatedBranchID = this.getBranchIdFromStorage() || branchID;

    const url = `${this.baseUrl}/GenerateSalesSummaryReport`;
    const params = { fromDate, toDate, branchID: updatedBranchID };

    return this.http.get(url, {
      params,
      headers: this.headers,
      observe: 'response',
      responseType: 'text',
    });
  }

  generateDailySalesReport(
    date: string,
    branchID: string
  ): Observable<HttpResponse<string>> {
    const updatedBranchID = this.getBranchIdFromStorage() || branchID;

    const url = `${this.baseUrl}/GenerateDailySalesReport`;
    const params = { date, branchID: updatedBranchID };

    return this.http.get(url, {
      params,
      headers: this.headers,
      observe: 'response',
      responseType: 'text',
    });
  }

  generateTopSellingReport(
    fromDate: string,
    toDate: string,
    branchID: string
  ): Observable<HttpResponse<string>> {
    const updatedBranchID = this.getBranchIdFromStorage() || branchID;

    const url = `${this.baseUrl}/GenerateTopMovingProductsReport`;
    const params = { fromDate, toDate, branchID: updatedBranchID };

    return this.http.get(url, {
      params,
      headers: this.headers,
      observe: 'response',
      responseType: 'text',
    });
  }

  generateLowestSellingReport(
    fromDate: string,
    toDate: string,
    branchID: string
  ): Observable<HttpResponse<string>> {
    const updatedBranchID = this.getBranchIdFromStorage() || branchID;

    const url = `${this.baseUrl}/GenerateLowMovingProductsReport`;
    const params = { fromDate, toDate, branchID: updatedBranchID };

    return this.http.get(url, {
      params,
      headers: this.headers,
      observe: 'response',
      responseType: 'text',
    });
  }

  generateStockReport(
    date: string,
    branchID: string
  ): Observable<HttpResponse<string>> {
    const updatedBranchID = this.getBranchIdFromStorage() || branchID;

    const url = `${this.baseUrl}/GenerateStockReport`;
    const params = { date, branchID: updatedBranchID };

    return this.http.get(url, {
      params,
      headers: this.headers,
      observe: 'response',
      responseType: 'text',
    });
  }
  
  private getBranchIdFromStorage(): string | null {
    try {
      return sessionStorage.getItem('BranchId');
    } catch (error) {
      console.error('Error accessing session storage:', error);
      return null;
    }
  }
}
