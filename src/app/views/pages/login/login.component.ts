import { LoginService } from './login.service';
import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {FormBuilder, Validators,FormControl} from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner";
import { NotificacionService } from './../../../notificacion.service';
import {ModalDirective} from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  @ViewChild('myModal') public myModal: ModalDirective;
  usrsice: string;
  password: string;
  usr= null;
  usrlogueado: any []= [];

  constructor(private _formBuilder: FormBuilder,
              public loginService: LoginService,
              public router: Router,
              private SpinnerService: NgxSpinnerService,
              private notifyService : NotificacionService
    ) {
   
  }

  login() {
    this.SpinnerService.show(); 
    const userlogin = { usrsice: this.usrsice, password: this.password };
    this.loginService.login(userlogin).subscribe((data) => {
      this.usrlogueado = data;
          //console.log(this.aspirante)
          if (data['resultado']=='NOK'){
            this.SpinnerService.hide();
              this.notifyService.showError(data['mensaje']);
              this.router.navigateByUrl('/login');
          }
          else {
            if (data['resultado']=='MTTO_ESTUDIANTE'){
              this.SpinnerService.hide();
                this.notifyService.showInfo('Actualmente el SICE se encuentra en mantenimiento.');
                this.router.navigateByUrl('/login');
              
              //this.notifyService.showInfo('Usted ya cumplió con el proceso de autopostulación, debe esperar la notificación por correo.');
              this.router.navigateByUrl('/login');
            } else {
              if (data['resultado']=='OK'){
                this.notifyService.showSuccess('¡Inicio de sesión correcto!');
                  this.router.navigateByUrl('/dashboard');
                  sessionStorage.setItem('currentUser', JSON.stringify(this.usrlogueado)); 
                  this.SpinnerService.hide();
               
                }
            }
        }
  }
  
  )

}

  
  loginFormGroup = this._formBuilder.group({
    usrsice: ['', [Validators.required, Validators.pattern('^[VEP]{1}[0-9]{7,8}$')]],
    password: ['', Validators.required],
  
  });

}
