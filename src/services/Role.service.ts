import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { RoleDto, IRole } from '../dto/Role.dto';

type EntityResponseType = HttpResponse<RoleDto>;
type EntityArrayResponseType = HttpResponse<RoleDto[]>;

// @ts-ignore
@Injectable()
export class RoleService {
  resourceUrl = environment.serverUrl;

  headers = {
    AuthToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImRhbWluZHUifQ.B8BvnQhFGX7QMJzsSH8z5mJwss3YdpHpSBH7M9Zia4k',
  };

  constructor(private http: HttpClient) {}

  createRole(role: IRole): Observable<HttpResponse<RoleDto>> {
    return this.http.post<RoleDto>(`${this.resourceUrl}/CreateRole`, role, {
      observe: 'response',
      headers: this.headers,
    });
  }

  uploadFile(formData: FormData): Observable<HttpResponse<any>> {
    return this.http.post(
      `${this.resourceUrl}/UploadRole`,
      formData,
      { observe: 'response' }
    );
  }

  updateRole(role: IRole): Observable<HttpResponse<RoleDto>> {
    return this.http.put<RoleDto>(
      `${this.resourceUrl}/UpdateRole`,
      role,
      { observe: 'response', headers: this.headers }
    );
  }

  deleteRole(req?: any): Observable<HttpResponse<IRole>> {
    return this.http.delete<RoleDto>(
      `${this.resourceUrl}/DeleteRole`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findRole(req?: any): Observable<HttpResponse<IRole>> {
    return this.http.get<RoleDto>(
      `${this.resourceUrl}/FindRole`,
      { params: req, observe: 'response', headers: this.headers }
    );
  }

  findAllRole(params: any): Observable<HttpResponse<RoleDto[]>> {
    return this.http.get<RoleDto[]>(
      `${this.resourceUrl}/FindallRole`,
      { params, observe: 'response', headers: this.headers }
    );
  }

  downloadFile(): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.resourceUrl}/download/role`,
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
