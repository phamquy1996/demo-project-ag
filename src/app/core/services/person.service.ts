import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { personList } from './../../helper/api';

@Injectable({
  providedIn: 'root',
})

export class PersonService {
  constructor(private http: HttpClient, private router: Router) {}

  getData(): Observable<any[]> {
    const url = personList;
    return this.http.get<any>(url).pipe(map((response) => response.results));
  }
}
