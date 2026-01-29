import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { IReport, ReportDto } from '../dto/Report.dto';

export interface SalesData {
  date: string;
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

type EntityResponseType = HttpResponse<ReportDto>;
type EntityArrayResponseType = HttpResponse<ReportDto[]>;

@Injectable()
export class ReportService {
  resourceUrl = environment.ReportUrl;

  headers = {
    AuthToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImRhbWluZHUifQ.B8BvnQhFGX7QMJzsSH8z5mJwss3YdpHpSBH7M9Zia4k',
  };

  constructor(private http: HttpClient) {}

  createReport(report: IReport): Observable<HttpResponse<ReportDto>> {
    return this.http.post<ReportDto>(
      `${this.resourceUrl}/create/report`,
      report,
      { observe: 'response', headers: this.headers }
    );
  }

  uploadFile(formData: FormData): Observable<HttpResponse<any>> {
    return this.http.post(
      `${this.resourceUrl}/upload/report`,
      formData,
      { observe: 'response' }
    );
  }

  updateReport(report: IReport): Observable<HttpResponse<ReportDto>> {
    return this.http.put<ReportDto>(
      `${this.resourceUrl}/update/report`,
      report,
      { observe: 'response', headers: this.headers }
    );
  }

  deleteReport(req?: any): Observable<HttpResponse<IReport>> {
    return this.http.delete<ReportDto>(
      `${this.resourceUrl}/delete/report`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findReport(req?: any): Observable<HttpResponse<IReport>> {
    return this.http.get<ReportDto>(
      `${this.resourceUrl}/find/report`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findAllReport(params: any): Observable<HttpResponse<ReportDto[]>> {
    return this.http.get<ReportDto[]>(
      `${this.resourceUrl}/findall/report`,
      { params, observe: 'response', headers: this.headers }
    );
  }

  downloadFile(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.resourceUrl}/download/report`,
      { observe: 'response', responseType: 'blob' }
    );
  }

  /**
   * New method to get sales data based on date range
   * This is currently a stub - implement actual API call when ready
   */
  getSalesData(fromDate: string, toDate: string): Observable<HttpResponse<SalesData[]>> {
    // For actual implementation, replace with real API endpoint
    return this.http.get<SalesData[]>(
      `${this.resourceUrl}/sales-data`,
      { 
        params: { fromDate, toDate },
        observe: 'response', 
        headers: this.headers 
      }
    );
  }

  fileUpload(formData: FormData): Observable<HttpResponse<any>> {
    return this.http.post(
      `FileMangerService/api/UploadToLocal`,
      formData,
      { observe: 'response' }
    );
  }
}