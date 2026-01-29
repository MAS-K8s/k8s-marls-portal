import {
    HttpClient,
    HttpHeaders,
    HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoleConfig } from '../app/access-control/roleConfig';

@Injectable({
  providedIn: 'root'
})
export class RoleConfigService {
   constructor(private http: HttpClient) {}
  private roleConfigSubject = new BehaviorSubject<RoleConfig>({});
  roleConfig$ = this.roleConfigSubject.asObservable();

  setRoleConfig(config: RoleConfig) {
    this.roleConfigSubject.next(config);
  }

  

  getRoleConfig() {
    return this.roleConfigSubject.value;
  }
     SendFirstLoginEmail(req: any): Observable<HttpResponse<any>> {
        return this.http.post<any>(
            `#`,
            req
        );
    }
}
