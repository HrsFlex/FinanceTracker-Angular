import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../interfaces/models/user.js';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  USER: string = 'user';
  constructor(private router: Router) {}

  addUser(name: string) {
    const user: User = {
      id: uuidv4(),
      name: name,
    };
    localStorage.setItem(this.USER, JSON.stringify(user));
  }

  getUser(): User {
    return JSON.parse(localStorage.getItem(this.USER) || '{}') as User;
  }

  deleteUserAccount() {
    localStorage.removeItem(this.USER);
    this.router.navigateByUrl('');
  }

  isLoggedin() {
    return Object.keys(this.getUser()).length > 0;
  }
}
