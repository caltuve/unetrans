import { Component,ViewChild } from '@angular/core';
import { ControlEstudiosService } from '../../control-estudios/control-estudios.service';
import { NgForm  } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from "ngx-spinner";
import { NotificacionService } from './../../../notificacion.service'

@Component({
  selector: 'app-consultar-datos',
  templateUrl: './consultar-datos.component.html',
  styleUrls: ['./consultar-datos.component.scss']
})
export class ConsultarDatosComponent {
  displayedColumns: string[] = ['estatus','carnet', 'ult_per_ins', 'cohorte', 'annio', 'cedula','nombre_persona','pnf'];
  dataSource = new MatTableDataSource();
  hayResultados: boolean = false;
  sinResultados: boolean = false;
  
  public visible = false;

  

  carnet!: string;
  cedula!: string;
  nombre!: string;
  resultados!: string[];

  @ViewChild('formSearchPersona') formSearchPersona!: NgForm;
  constructor(public controlestudiosService: ControlEstudiosService,
              private SpinnerService: NgxSpinnerService,
              private notifyService : NotificacionService
) {}


  searchPersona(formSearchPersona: NgForm) {
    this.SpinnerService.show(); 
    this.controlestudiosService.findPersona(formSearchPersona.value).subscribe(
      (result: any) => {
          this.hayResultados = false;
          this.sinResultados = false;
          this.dataSource.data = result;
          if (this.dataSource.data.length == 0) {
            this.SpinnerService.hide();
            this.sinResultados = this.dataSource.data.length ==0
            this.hayResultados = false;
            this.formSearchPersona.reset();
          }
          else{
            this.notifyService.showSuccess('Consulta de datos de estudiante');
            this.SpinnerService.hide();
            this.hayResultados = this.dataSource.data.length >0
            this.formSearchPersona.reset();
          }   
    
    }
    );
  }
}