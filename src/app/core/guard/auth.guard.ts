import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { USERNAME_AG } from './../../helper/constants';

@Injectable({ providedIn: 'root' })

export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate() {
    if (localStorage.getItem(USERNAME_AG)) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
