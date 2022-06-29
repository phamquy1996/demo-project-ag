import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { personList } from './../../helper/api';
import { USERNAME_AG } from './../../helper/constants';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  login(username: string): void {
    localStorage.setItem(USERNAME_AG, username);
    this.router.navigate(['/']);
  }

  getUserName(): string | null {
    if (localStorage.getItem(USERNAME_AG)) {
      return localStorage.getItem(USERNAME_AG);
    }
    return '';
  }

  isCheckLogin(): Boolean {
    if (localStorage.getItem(USERNAME_AG)) {
      return true;
    }
    return false;
  }

  getData(): Observable<any[]> {
    const url = personList;
    return this.http.get<any>(url).pipe(map((response) => response.results));
  }

  logout(): void {
    localStorage.removeItem(USERNAME_AG);
    this.router.navigate(['/login']);
  }
}
