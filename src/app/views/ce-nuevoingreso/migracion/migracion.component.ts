import { AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, Validators,FormControl} from '@angular/forms';
import { ControlEstudiosService } from '../../control-estudios/control-estudios.service';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { NgxSpinnerService } from "ngx-spinner";
import { NotificacionService } from './../../../notificacion.service'

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ModalRevMigracionComponent } from '../modal-rev-migracion/modal-rev-migracion.component';

@Component({
  selector: 'app-migracion',
  templateUrl: './migracion.component.html',
  styleUrls: ['./migracion.component.scss']
})
export class MigracionComponent implements AfterViewInit {
  arrayDatos : any []= [];

  pnfs: any []= [];
  selectedOption: any;
  recibidas = new MatTableDataSource();
  pnfRecibidas = new MatTableDataSource();
  procesadas = new MatTableDataSource();
  displayedColumnsRecibidas: string[] = ['fecha_solicitud', 'id_estudiante', 'nombre_completo', 'tipo_revision', 'gestion'];
  displayedColumnsProcesadas: string[] = ['estatus', 'id_estudiante', 'nombre_completo','telefono' ,'pnf','usrproceso'];
  displayedColumnsPnf: string[] = ['radio','codigo','pnf'];
  hayResultadosRecibidas: boolean = false;
  sinResultadosRecibidas: boolean = false;

  hayResultadosProcesadas: boolean = false;
  sinResultadosProcesadas: boolean = false;

  fecha_solicitud: string;

  moding: any []= [];
  trayectos: any []= [];
  resolucion: any []= [];

  cedulaAuto!: string;

  trayecto!: string;
  mod_ingreso!: string;
  reso!: string;

  usrsice: string;

  usr={
    nac:null,
    cedula:null,
    nombre_completo:null,
    nombre_corto:null,
    fecnac:null,
    carnet:null,
    pnf:null,
    email: null,
    saludo: null,
    usrsice: null,
  }

  modalRef: BsModalRef; 

  valorCampo: any;

  @ViewChild('paginatorRecibidas') paginatorRecibidas: MatPaginator;
  @ViewChild('paginatorProcesadas') paginatorProcesadas: MatPaginator;
  //paginatorIntl: MatPaginatorIntl;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _formBuilder: FormBuilder,
    public controlestudiosService: ControlEstudiosService,
    private notifyService : NotificacionService,
    private SpinnerService: NgxSpinnerService,
    private modalService: BsModalService,
    ) {
      this.obtenerUsuarioActual();
    }

    rangeLabel = 'Mostrando ${start} – ${end} de ${length}';

    ngAfterViewInit() {
    this.paginatorRecibidas._intl.itemsPerPageLabel = 'Mostrando de ${start} – ${end} registros';
    this.paginatorRecibidas._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `Mostrando 0 de ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `Mostrando ${startIndex + 1} – ${endIndex} de ${length} registro(s)`;
    };
    
    this.recibidas.paginator = this.paginatorRecibidas;
    this.procesadas.paginator = this.paginatorProcesadas;
    this.findSolicitudesMigracion();
    this.findModIngreso();
    this.findTrayectos();
    this.findResolucion();  
}

findSolicitudesMigracion() {
  this.usr = JSON.parse(sessionStorage.getItem('currentUser')!); 
  this.SpinnerService.show();
  this.controlestudiosService.getSolicitudesRevisionMigra().subscribe(
    (data: any) => {
      this.hayResultadosRecibidas = false;
      this.sinResultadosRecibidas= false;
      this.hayResultadosProcesadas = false;
      this.sinResultadosProcesadas = false; 
      this.recibidas.data = data.recibidas;
      this.procesadas.data = data.procesadas;
    if (this.recibidas.data.length == 0) {
      this.sinResultadosRecibidas = this.recibidas.data.length == 0;
      this.hayResultadosRecibidas = false;
      this.SpinnerService.hide();
     } else{
      this.recibidas.paginator = this.paginatorRecibidas;
      this.recibidas.data = data.recibidas;
      this.pnfs = data.recibidas[0].pnf;
      this.hayResultadosRecibidas = this.recibidas.data.length > 0;
      this.SpinnerService.hide();
     }

     if (this.procesadas.data.length == 0) {
      this.sinResultadosProcesadas = this.procesadas.data.length == 0;
      this.hayResultadosProcesadas = false;
      this.SpinnerService.hide();
     } else{
      this.procesadas.paginator = this.paginatorProcesadas;
      this.procesadas.data = data.procesadas;
      this.hayResultadosProcesadas = this.procesadas.data.length > 0;
      this.SpinnerService.hide();
     }
    }
  );
}

findModIngreso(){
  this.controlestudiosService.getModIngreso().subscribe(
    (result: any) => {
      const opcionesFiltradas = [ '011']; // Aquí colocas los valores codelemento que deseas mostrar
      this.moding = result.filter((moding: { codelemento: string; }) => opcionesFiltradas.includes(moding.codelemento));
  }
  );
}

findTrayectos(){
  this.controlestudiosService.getTrayectos().subscribe(
    (result: any) => {
        this.trayectos = result;
  }
  );
}

findResolucion(){
  this.controlestudiosService.getResolucion().subscribe(
    (result: any) => {
        this.resolucion = result;
  }
  );
}

applyFilterRecibidas(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value;
  this.recibidas.filter = filterValue.trim().toLowerCase();

  if (this.recibidas.paginator) {
    this.recibidas.paginator.firstPage();
  }
}


applyFilterProcesadas(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value;
  this.procesadas.filter = filterValue.trim().toLowerCase();

  if (this.procesadas.paginator) {
    this.procesadas.paginator.firstPage();
  }
}

guardar(): void {
  this.SpinnerService.show(); 
      
  // Esta función se ejecutará cuando se haga clic en "Guardar Datos" en el último step
  // Puedes acceder a los datos de cada step utilizando this.step1Form.value, this.step2Form.value, etc.
  const datosStep1 = this.firstFormGroup.value;

    const datosCompletos = {
      step1: datosStep1,
    };
    const cedula = datosCompletos.step1.cedula;

    this.controlestudiosService.procesarAutopostulado(datosCompletos).subscribe(datos => {
      switch (datos['estatus']) {
        case 'ERROR':
              this.SpinnerService.hide(); 
              this.notifyService.showError2('Ha ocurrido un error, verifique nuevamente y si persiste comuníquese con sistemas.');
              //this.gestionAutopostulado.hide(); 
              this.firstFormGroup.reset();
              break;
        default:
          this.SpinnerService.hide(); 
          this.notifyService.showSuccess('Solicitud de autopostulación procesada');
          //this.gestionAutopostulado.hide(); 
          this.firstFormGroup.reset();
          this.findSolicitudesMigracion();
          this.enviarNotificacion(cedula);
          break;
      }
    });
}

setSelectedCedulaAuto(cedula: any) {
  this.cedulaAuto = cedula;
}

enviarNotificacion(cedula: any){
  this.SpinnerService.show(); 
  const user = {cedula};

    this.controlestudiosService.pushNotify(user).subscribe(datos => {
      switch (datos['estatus']) {
        case 'ERROR':
              this.SpinnerService.hide(); 
              this.notifyService.showError2('Ha ocurrido un error enviando el correo de notificación.');
              break;
        default:
          this.SpinnerService.hide();
          this.notifyService.showSuccess('Correo de notificación enviado');
          break;
      }
    });
  }

firstFormGroup = this._formBuilder.group({
  cedula: ['', Validators.required],
  mingreso:  [{value: ''}, Validators.required],
  trayecto:       [{value: '', }, Validators.required],
  reso:  [{value: '', }, Validators.required],
  optionPnf: ['', Validators.required],
  usrsice : ['', Validators.required],
});

obtenerUsuarioActual() {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  this.usrsice = currentUser.usrsice;
}

// abrirModalRevision(carnet: string) {
  
//   // Utiliza los parámetros en la llamada al servicio
//   this.controlestudiosService.findPersonaRdi({cedula: carnet}).subscribe(
//     (result: any) => {
//       const initialState = {
//         estudianteBase: result.estudiante,
//         detallesIncorrectos: result.detallesIncorrectos 
//         //carnet: this.cedulaActual
//       };
//       this.modalRef = this.modalService.show(ModalRevMigracionComponent, { 
//         initialState: initialState,
//         class: 'modal-xl custom-modal-scrollable',
//         ignoreBackdropClick: true,
//         keyboard: false
//       });

//       this.modalRef.content.actualizacionCompleta.subscribe(() => {
//         this.findSolicitudesMigracion();
//         this.findModIngreso();
//         this.findTrayectos();
//         this.findResolucion();  // La función que quieres ejecutar
//       });
//     },
//     error => {
//       // Manejo de error
//       console.error('Error al obtener datos de inscripción:', error);
//     }
//   );
// }

abrirModalRevision(carnet: string) {
  // Verifica si la solicitud está en gestión
  this.SpinnerService.show(); 
  this.controlestudiosService.checkEnGestion({ cedula: carnet }).subscribe(
    (result: any) => {
      if (result.en_gestion) {
        this.notifyService.showInfo(`Esta solicitud está siendo gestionada por: <strong>${result.gestor}</strong>`);
        this.SpinnerService.hide(); 
      } else {
        // Marca la solicitud como en gestión antes de abrir el modal
        this.marcarEnGestion(carnet, true);

        // Utiliza los parámetros en la llamada al servicio
        this.controlestudiosService.findPersonaRdi({ cedula: carnet }).subscribe(
          (result: any) => {
            const initialState = {
              estudianteBase: result.estudiante,
              detallesIncorrectos: result.detallesIncorrectos
            };
            this.modalRef = this.modalService.show(ModalRevMigracionComponent, {
              initialState: initialState,
              class: 'modal-xl custom-modal-scrollable',
              ignoreBackdropClick: true,
              keyboard: false
            });
            this.SpinnerService.hide(); 

            this.modalRef.content.actualizacionCompleta.subscribe(() => {
              this.findSolicitudesMigracion();
              this.findModIngreso();
              this.findTrayectos();
              this.findResolucion();
              // Desmarca la solicitud como en gestión cuando se completa la actualización
              //this.marcarEnGestion(carnet, false);
            });
          },
          error => {
            console.error('Error al obtener datos de inscripción:', error);
            // Desmarca la solicitud como en gestión en caso de error
            this.marcarEnGestion(carnet, false);
          }
        );
      }
    },
    error => {
      this.notifyService.showError2(`Error al verificar estado de gestión: ${error}`);
      console.error('Error al verificar estado de gestión:', error);
    }
  );
}

marcarEnGestion(carnet: string, enGestion: boolean) {
  const data = {
    cedula: carnet,
    en_gestion: enGestion,
    gestor: enGestion ? this.usrsice : null
  };

  this.controlestudiosService.marcarEnGestion(data).subscribe(
    () => {
      console.log('Solicitud marcada como en gestión:', enGestion);
    },
    error => {
      console.error('Error al marcar solicitud como en gestión:', error);
    }
  );
}



}
