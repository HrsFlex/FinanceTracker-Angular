import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { logoAnimation } from '../animations';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.css'],
  animations: [logoAnimation],
})
export class SplashComponent implements OnInit {
  animationState = 'hidden';

  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.animationState = 'visible';
      setTimeout(() => {
        this.animationState = 'hidden';
        setTimeout(() => {
          sessionStorage.setItem('hasLoaded', 'true');
          this.router.navigate(['/dashboard']).then((success) => {
            console.log(
              'Navigation to dashboard:',
              success ? 'successful' : 'failed'
            );
          });
        }, 500);
      }, 2000);
    }, 0);
  }
}
