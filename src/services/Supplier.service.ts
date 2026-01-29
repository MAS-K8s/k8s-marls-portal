import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { SupplierDto, ISupplier } from '../dto/Supplier.dto';

type EntityResponseType = HttpResponse<SupplierDto>;
type EntityArrayResponseType = HttpResponse<SupplierDto[]>;

// @ts-ignore
@Injectable()
export class SupplierService {
  resourceUrl = environment.SupplierUrl;

  headers = {
    AuthToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImRhbWluZHUifQ.B8BvnQhFGX7QMJzsSH8z5mJwss3YdpHpSBH7M9Zia4k',
  };

  constructor(private http: HttpClient) {}

  createSupplier(supplier: ISupplier): Observable<HttpResponse<SupplierDto>> {
    return this.http.post<SupplierDto>(
      `${this.resourceUrl}/CreateSupplier`,
      supplier,
      { observe: 'response', headers: this.headers }
    );
  }

  uploadFile(formData: FormData): Observable<HttpResponse<any>> {
    return this.http.post(
      `${this.resourceUrl}/upload/supplier`,
      formData,
      { observe: 'response' }
    );
  }

  updateSupplier(supplier: ISupplier): Observable<HttpResponse<SupplierDto>> {
    return this.http.put<SupplierDto>(
      `${this.resourceUrl}/UpdateSupplier`,
      supplier,
      { observe: 'response', headers: this.headers }
    );
  }

  deleteSupplier(req?: any): Observable<HttpResponse<ISupplier>> {
    return this.http.delete<SupplierDto>(
      `${this.resourceUrl}/DeleteSupplier`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findSupplier(req?: any): Observable<HttpResponse<ISupplier>> {
    return this.http.get<SupplierDto>(
      `${this.resourceUrl}/FindSupplier`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findAllSupplier(params: any): Observable<HttpResponse<SupplierDto[]>> {
    return this.http.get<SupplierDto[]>(
      `${this.resourceUrl}/FindallSupplier`,
      { params, observe: 'response', headers: this.headers }
    );
  }

  findAllSupplierPaginated(
    params: any
  ): Observable<HttpResponse<{ count: number; suppliers: SupplierDto[] }>> {
    return this.http.get<{ count: number; suppliers: SupplierDto[] }>(
      `${this.resourceUrl}/FindallSupplier/pg/search`,
      { params, observe: 'response', headers: this.headers }
    );
  }

  downloadFile(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.resourceUrl}/download/supplier`,
      { observe: 'response', responseType: 'blob' }
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
