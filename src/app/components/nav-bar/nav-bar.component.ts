import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {

  constructor(public userService: UserService, public router: Router) { }

}
