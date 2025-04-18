import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const payload = { email: this.email, password: this.password };

    this.http.post<any>('http://localhost:3000/api/login', payload).subscribe({
      next: (res) => {
        const token = res.token;
        localStorage.setItem('token', token);

        // 🔑 Decode token to get the role and store it
        const payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('role', payload.role);

        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage = 'Invalid email or password';
      }
    });
  }
}
