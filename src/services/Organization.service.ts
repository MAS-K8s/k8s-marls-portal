import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { OrganizationDto, IOrganization } from '../dto/Organization.dto';

type EntityResponseType = HttpResponse<OrganizationDto>;
type EntityArrayResponseType = HttpResponse<OrganizationDto[]>;

// @ts-ignore
@Injectable()
export class OrganizationService {
  resourceUrl = environment.OrganizeUrl;
  fileUploadUrl = '#';

  headers = {
    AuthToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImRhbWluZHUifQ.B8BvnQhFGX7QMJzsSH8z5mJwss3YdpHpSBH7M9Zia4k',
  };

  constructor(private http: HttpClient) {}

  createOrganization(
    organization: IOrganization
  ): Observable<HttpResponse<OrganizationDto>> {
    return this.http.post<OrganizationDto>(
      `${this.resourceUrl}/CreateOrganization`,
      organization,
      { observe: 'response', headers: this.headers }
    );
  }

  uploadFile(formData: FormData): Observable<HttpResponse<any>> {
    return this.http.post(
      `${this.resourceUrl}/upload/organization`,
      formData,
      { observe: 'response' }
    );
  }

  updateOrganization(
    organization: IOrganization
  ): Observable<HttpResponse<OrganizationDto>> {
    return this.http.put<OrganizationDto>(
      `${this.resourceUrl}/UpdateOrganization`,
      organization,
      { observe: 'response', headers: this.headers }
    );
  }

  deleteOrganization(req?: any): Observable<HttpResponse<IOrganization>> {
    return this.http.delete<OrganizationDto>(
      `${this.resourceUrl}/DeleteOrganization`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findOrganization(req?: any): Observable<HttpResponse<IOrganization>> {
    return this.http.get<OrganizationDto>(
      `${this.resourceUrl}/FindOrganization`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findAllOrganization(
    params: any
  ): Observable<HttpResponse<OrganizationDto[]>> {
    return this.http.get<OrganizationDto[]>(
      `${this.resourceUrl}/FindallOrganization`,
      { params, observe: 'response', headers: this.headers }
    );
  }

  downloadFile(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.resourceUrl}/download/organization`,
      { observe: 'response', responseType: 'blob' }
    );
  }

  fileUpload(formData: FormData): Observable<HttpResponse<any>> {
    // Add a unique timestamp parameter to avoid caching issues
    const timestamp = new Date().getTime();
    const url = `${this.fileUploadUrl}?t=${timestamp}`;
    
    // Use the specified API endpoint for file uploads
    return this.http.post(
      url,
      formData,
      { 
        observe: 'response',
        headers: this.headers,
        responseType: 'text' // Handle response as text since it might return a direct URL string
      }
    );
  }
  
  // Helper method to validate image URLs
  validateImageUrl(url: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const img = new Image();
      img.onload = () => {
        observer.next(true);
        observer.complete();
      };
      img.onerror = () => {
        observer.next(false);
        observer.complete();
      };
      img.src = url;
    });
  }
}