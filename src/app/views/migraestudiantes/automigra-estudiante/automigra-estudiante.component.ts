import { Component, AfterViewInit, OnInit, ViewChild} from '@angular/core';
import { NgForm, FormBuilder, FormGroup, Validators,FormControl, ValidationErrors, AbstractControl} from '@angular/forms';
import { MigrastudentService } from '../migrastudent.service';
import {MatTableDataSource} from '@angular/material/table';
import { EstadoI, MunicipioI, ParroquiaI } from '../../control-estudios/crear-nuevo/model.interface'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Router } from '@angular/router';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import { NgxSpinnerService } from "ngx-spinner";
import { NotificacionService } from './../../../notificacion.service'
import {ModalDirective} from 'ngx-bootstrap/modal';

import { Observable, of , Subject, merge   } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

function promedioValidator(control: AbstractControl): {[key: string]: any} | null {
  const valor = control.value;
  const numero = parseFloat(valor);
  if (isNaN(numero)) {
    return { 'invalidNumber': true };
  }
  if (numero < 10.00 || numero > 20.00) {
    return { 'outOfRange': true };
  }
  // Esto es opcional, dependiendo de si necesitas validar el formato XX.XX exactamente.
  const partes = valor.split(',');
  if (partes.length === 2 && partes[1].length !== 2) {
    return { 'invalidFormat': true };
  }
  return null;
}

interface Colegio {
  cod_ce: string;
  nombre: string;
}

@Component({
  selector: 'app-automigra-estudiante',
  templateUrl: './automigra-estudiante.component.html',
  styleUrls: ['./automigra-estudiante.component.scss']
})
export class AutomigraEstudianteComponent implements OnInit, AfterViewInit {
  
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  fiveFormGroup: FormGroup;

  listPlantel: Colegio[] = []; // Asume que tienes esta lista inicializada
  filteredPlanteles: Observable<Colegio[]>;

  private plantelUpdated = new Subject<void>();
  
  @ViewChild('myModalColegios') public myModalColegios: ModalDirective;
  dataSource = new MatTableDataSource();
  displayedColumns: string[] = ['nombre'];

  materias = new MatTableDataSource();
  displayedColumnsUniCurricular: string[] = ['seleccion','periodo','trayecto','código', 'nombre', 'créditos','seccion'];
  
  estudiante: any;

  aspirante: any ;
  minDate1!: Date;
  maxDate1!: Date;
  minDate2!: Date;
  maxDate2!: Date;
  minDate3!: Date;
  maxDate3!: Date;
  nacs: any []= [];
  genero: any []= [];
  edocivil: any []= [];
  gruposan: any []= [];
  etnia: any []= [];
  indresp: any []= [];
  indresp2: string= ''; 
  indresp3: string= ''; 
  discapacidad: any []= [];
  discapacidad2: string= '';
  tipoconstruccionvalue: string= '';
  pass: string;
  confpass:string;
  usrsice:string;
  tipovia: any []= [];
  tiponucleo: any []= [];
  tipoconstruccion: any []= [];
  carreras: any []= [];
  opermovil: any []= [];
  operres: any []= [];
  
  listEstadosNacimiento!: EstadoI[]
  estadoSelectedNacimiento!: string
  listMunicipiosNacimiento!: MunicipioI[]
  municipioSelectedNacimiento!: string
  listParroquiasNacimiento!: ParroquiaI[]
  parroquiaSelectedNacimiento!: string

  listEstadosResidencia!: EstadoI[]
  estadoSelectedResidencia!: string
  listMunicipiosResidencia!: MunicipioI[]
  municipioSelectedResidencia!: string
  listParroquiasResidencia!: ParroquiaI[]
  parroquiaSelectedResidencia!: string


  listEstadosEducacionMedia!: EstadoI[]
  estadoSelectedEducacionMedia!: string
  listMunicipiosEducacionMedia!: MunicipioI[]
  municipioSelectedEducacionMedia!: string
  listParroquiasEducacionMedia!: ParroquiaI[]
  parroquiaSelectedEducacionMedia!: string

  bachiller: any []= [];
  moding: any []= [];
  turnos: any []= [];
  trayectos: any []= [];
  procedencia: any []= [];
  parentesco: any []= [];
  sectortrab: any []= [];

  questsec: any[] = [];
  questsec1: any[] = [];
  questsec2: any[] = [];
  questsec3: any[] = [];
  sede: string ='001';
  //turno: string='X';
  //mingresoopsu: string='001';
  //mingresopostula: string='011'
  plantel = '';

  selectedValue!: string;

  annoegreso!: Date;

  /*LISTADO DE VARIABLES PARA ALMANCENAR LOS VALORES EN BD*/
  //STEP 1
  nac!: string;
  cedula!: number;
  fecnac!: Date;
  primer_nombre!: string;
  segundo_nombre!: string;
  primer_apellido!: string;
  segundo_apellido!: string;

  quest1: string;
  quest2: string;
  quest3: string;

  hayResultadosPlanteles: boolean = false;
  sinResultadosPlanteles: boolean = false;

  constructor(private _formBuilder: FormBuilder,
    public aspiranteService: MigrastudentService,
    private SpinnerService: NgxSpinnerService,
    private notifyService : NotificacionService,
    public router: Router,
    ) 
    { 
      this.aspirante = this.aspiranteService.datosAspirante;
      this.materias = this.aspiranteService.materiasAspirante;
      
      sessionStorage.setItem('currentUser', JSON.stringify(this.aspirante)); 
      sessionStorage.setItem('materiasAspirante', JSON.stringify(this.aspiranteService.materiasAspirante)); 
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const currentDay = new Date().getDate();
      this.minDate1 = new Date(currentYear - 90, currentMonth, currentDay);
      this.maxDate1 = new Date(currentYear - 14, currentMonth, currentDay);
      this.minDate2 = new Date(currentYear - 69, currentMonth, currentDay);
      this.maxDate2 = new Date(currentYear , currentMonth, currentDay);
      this.minDate3 = new Date(currentYear - 90, currentMonth, currentDay);
      this.maxDate3 = new Date(currentYear - 14, currentMonth, currentDay);
      
    }

    ngOnInit() {
      this.initForm()
      this.setupSniValidationBasedOnModIngreso();
      this.setupValidations();
      this.findNac();
      this.findGen();
      this.findEdoCivil();
      this.findGrupoSan();
      this.findEtnia();
      this.findIndResp();
      this.findDiscapacidad();
      //this.findEstados();
      this.findTipoVia();
      this.findTipoNucleo();
      this.findTipoConstruccion();
      this.findCarreras();
      this.findOperMovil();
      this.findOperRes();
      this.findBachiller();
      this.findModIngreso();
      this.findTurnos();
      this.findTrayectos();
      this.findZonaPTransporte();
      this.findParentescoEmer();
      this.findSectorTrabajo();
      this.findQuestSec();
      
      const nombrePlantelChanges = this.thirdFormGroup.get('nombreplantel')!.valueChanges;

// Combinando usando merge.
this.filteredPlanteles = merge(nombrePlantelChanges, this.plantelUpdated.asObservable())
  .pipe(
    startWith(''),
    map(value => {
      // Asumiendo que value puede ser tanto el valor del input como una señal de que la lista debe actualizarse.
      // Aquí debes implementar la lógica específica para filtrar o reiniciar la lista de planteles.
      // Por ejemplo, si value es un string, filtra; si no, devuelve toda la lista.
      return typeof value === 'string' ? this._filter(value) : this.listPlantel.slice();
    }),
  );

  this.fiveFormGroup.get('quest1')?.valueChanges.subscribe(value => {
    this.filterQuestions();
  });

  this.fiveFormGroup.get('quest2')?.valueChanges.subscribe(value => {
    this.filterQuestions();
  });

  this.fiveFormGroup.get('quest3')?.valueChanges.subscribe(value => {
    this.filterQuestions();
  });

      }

      ngAfterViewInit() {
        this.findEstadosNacimiento();
        this.findEstadosResidencia();
        this.findEstadosEducacionMedia();
      }


      initForm() {
        this.firstFormGroup = this._formBuilder.group({
          nac: [{value: this.aspirante?.nac, disabled: true}],
          cedula: [{value: this.aspirante?.cedula, disabled: true}],
          fec_nac: ['', Validators.required],
          primer_nombre: [{value: this.aspirante?.primer_nombre, disabled: true}],
          segundo_nombre: [{value: this.aspirante?.segundo_nombre, disabled: true}],
          primer_apellido: [{value: this.aspirante?.primer_apellido, disabled: true}],
          segundo_apellido: [{value: this.aspirante?.segundo_apellido, disabled: true}],
          genero: ['', Validators.required],
          edo_civil: ['', Validators.required],
          gruposan: ['', Validators.required],
          estadoNacimiento: ['', Validators.required],
          municipioNacimiento: ['', Validators.required],
          parroquiaNacimiento: ['', Validators.required],
          etnia: ['', Validators.required],
          discapacidad: ['', Validators.required],
          conapdis: [''],
          trabajo: ['', Validators.required],
          sectortrabajo: [''],
          hijos: ['', Validators.required],
          canthijos: [''],
          // Completa para otros campos según sea necesario
        });

        this.secondFormGroup = this._formBuilder.group({
          estado: ['', Validators.required],
          municipio: ['', Validators.required],
          parroquia: ['', Validators.required],
          tipovia: ['', Validators.required],
          nombrevia: ['', Validators.compose([Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]) ],
          tiponucleo: ['', Validators.required],
          nombrenucleo: ['', Validators.compose([Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]) ],
          tipoconstruccion: ['', Validators.required],
          nombreconstruccion: ['', Validators.compose([Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]) ],
          piso: [null,Validators.compose([Validators.nullValidator, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]) ],
          apto: [null,Validators.compose([Validators.nullValidator, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]) ],
          nrocasa: [null,Validators.compose([Validators.nullValidator, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]) ],
        
        
          opermovil: ['', Validators.required],
          nummovil: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(7)]],
          operres: [null, Validators.nullValidator],
          numres: [null, Validators.compose([Validators.nullValidator, Validators.minLength(7), Validators.maxLength(7)]) ],
          operemer:['', Validators.required],
          numemer: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(7)]],
          parenemer:['', Validators.required],
          nombreemer:['', Validators.compose([Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]) ],
          emailppal:  [{value: this.aspirante?.email, disabled: true}],
          emailalter: [null, Validators.compose([Validators.nullValidator, Validators.email])  ],
         
        });

        this.thirdFormGroup = this._formBuilder.group({
          tbachiller: ['', Validators.required],
          fechagradobachiller: ['', Validators.required],
          sni: [null, [Validators.min(1)]],
          indbachiller: ['', [Validators.required, this.numberValidator, this.rangeValidator, this.formatValidator]],
          estadoplantel: ['', Validators.required],
          municipioplantel: [{value: '', disabled: true}, Validators.required],
          parroquiaplantel: [{value: '', disabled: true}, Validators.required],
          nombreplantel: [{value: '', disabled: true}, [Validators.required, this.plantelValidator.bind(this)]], 
          nombreies: [null], // Inicialmente sin validadores
          tituloies: [null], // Inicialmente sin validadores
          mencionies: [null], // Inicialmente sin validadores
          fechagradoies: [null] // Inicialmente sin validadores
         
        });

        this.fourthFormGroup = this._formBuilder.group({
          cohorte:  [{value: this.aspirante?.cohorte, disabled: true}],
          carnet:  [{value: this.aspirante?.carnet, disabled: true}],
          turno:     [{value: 'X', disabled: true}, Validators.required],
          mingreso: [{value: this.aspirante?.mod_ingreso, disabled: true}],
          pnf:       [{value: this.aspirante?.codigo_pnf, disabled: true}],
          trayecto: [{value: this.aspirante?.trayecto?.toString() || '', disabled: true}],
          zonaprocedencia: ['', Validators.required],        
          
         });

         this.fiveFormGroup = this._formBuilder.group({  
          usrsice:[{value: this.aspirante?.usrsice, disabled: true}],
          pass:['', Validators.required],
          confpass:['', Validators.required],
          quest1:['', Validators.required],
          quest2:['', Validators.required],
          quest3:['', Validators.required],
          answ1:['', Validators.required],
          answ2:['', Validators.required],
          answ3:['', Validators.required],
         });
        
        this.setupFormChanges();

        // Si el usuario ya tiene un usuario SICE, ajusta el formulario acordemente
  if (this.aspirante.usuario_sice === 'S') {
    this.validacion1 = true;
    this.validacion2 = true;
    this.validacion3 = true;
    this.validacion4 = true;
    this.validacion5 = true;
    this.validacion6 = true;
    this.fiveFormGroup.get('usrsice')?.setValue(this.aspirante.usrsice); // Suponiendo que quieres establecer este valor
    
    // Marcar todos los otros campos como válidos sin necesidad de entrada del usuario
    const controlsToSkip = ['pass', 'confpass', 'quest1', 'quest2', 'quest3', 'answ1', 'answ2', 'answ3'];
    controlsToSkip.forEach(controlName => {
      // Puedes simplemente limpiar los validadores si no necesitas que el usuario los llene
      this.fiveFormGroup.get(controlName)?.clearValidators();
      this.fiveFormGroup.get(controlName)?.updateValueAndValidity();
    });
  }
      }

      setupFormChanges() {
        this.firstFormGroup.get('discapacidad')?.valueChanges.subscribe(value => {
          const conapdisControl = this.firstFormGroup.get('conapdis');
          if (value && value !== '99') {
            // Si discapacidad tiene un valor y es diferente de '99', conapdis es requerido
            conapdisControl?.setValidators([Validators.required, Validators.min(1)]);
          } else {
            conapdisControl?.setValue(null);
            // Si discapacidad no cumple la condición, no se requiere conapdis
            conapdisControl?.clearValidators();
          }
          conapdisControl?.updateValueAndValidity(); // Actualizar la validez del control conapdis
        });
        this.firstFormGroup.get('trabajo')?.valueChanges.subscribe(value => {
          const sectortrabajoControl = this.firstFormGroup.get('sectortrabajo');
          if (value && value !== '2') {
            // Si trabajo tiene un valor y es diferente de '2', sectortrabajo es requerido
            sectortrabajoControl?.setValidators([Validators.required]);
            sectortrabajoControl?.updateValueAndValidity(); // Importante actualizar el estado de validez
          } else {
            // Si trabajo no cumple la condición, sectortrabajo no es requerido y se establece su valor a null
            sectortrabajoControl?.setValue(null);
            sectortrabajoControl?.clearValidators();
            sectortrabajoControl?.updateValueAndValidity(); // Importante actualizar el estado de validez
          }
        });
        this.firstFormGroup.get('hijos')?.valueChanges.subscribe(value => {
          const canthijosControl = this.firstFormGroup.get('canthijos');
          if (value && value !== '2') {
            // Si trabajo tiene un valor y es diferente de '2', sectortrabajo es requerido
            canthijosControl?.setValidators([Validators.required]);
            canthijosControl?.updateValueAndValidity(); // Importante actualizar el estado de validez
          } else {
            // Si trabajo no cumple la condición, sectortrabajo no es requerido y se establece su valor a null
            canthijosControl?.setValue(null);
            canthijosControl?.clearValidators();
            canthijosControl?.updateValueAndValidity(); // Importante actualizar el estado de validez
          }
        });


        this.thirdFormGroup.get('estadoplantel')?.valueChanges.subscribe(value => {
          if (value) {
            this.thirdFormGroup.get('municipioplantel')?.enable();
            this.onEstadoselectedEducacionMedia(value);
          } else {
            this.thirdFormGroup.get('municipioplantel')?.disable();
          }
          // Asegúrate de restablecer los valores cada vez que cambie el estado
          this.thirdFormGroup.get('municipioplantel')?.reset();
          this.thirdFormGroup.get('parroquiaplantel')?.reset();
          this.thirdFormGroup.get('nombreplantel')?.reset();
        });
    
        this.thirdFormGroup.get('municipioplantel')?.valueChanges.subscribe(value => {
          if (value) {
            this.thirdFormGroup.get('parroquiaplantel')?.enable();
            this.onMunicipioselectedEducacionMedia(value);
          } else {
            this.thirdFormGroup.get('parroquiaplantel')?.disable();
          }
          this.thirdFormGroup.get('parroquiaplantel')?.reset();
          this.thirdFormGroup.get('nombreplantel')?.reset();
        });

         // Suscripción a cambios en 'parroquiaplantel'
          this.thirdFormGroup.get('parroquiaplantel')?.valueChanges.subscribe(value => {
            if (value) {
              this.thirdFormGroup.get('nombreplantel')?.enable();
              this.onParroquiaselectedEducacionMedia(value);
            } else {
              this.thirdFormGroup.get('nombreplantel')?.disable();
            }
            // Opcionalmente restablece 'nombreplantel' si la parroquia cambia
            this.thirdFormGroup.get('nombreplantel')?.reset();
          });
      }

      


      setupSniValidationBasedOnModIngreso() {
        const sniControl = this.thirdFormGroup.get('sni');
        if (this.aspirante.mod_ingreso === '001') {
          // Si mod_ingreso es '001', sni es requerido
          sniControl?.setValidators([Validators.required, Validators.min(1)]);
        } else {
          // Si mod_ingreso no es '001', sni no es requerido pero tiene un mínimo
          sniControl?.setValidators([Validators.min(1)]);
        }
        sniControl?.updateValueAndValidity();
      }

      setupValidations() {
        if (this.aspirante.trayecto === '3') {
          this.thirdFormGroup.get('nombreies')?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(10)]);
          this.thirdFormGroup.get('tituloies')?.setValidators([Validators.required]);
          this.thirdFormGroup.get('mencionies')?.setValidators([Validators.required]);
          this.thirdFormGroup.get('fechagradoies')?.setValidators([Validators.required]);
        } else {
          this.thirdFormGroup.get('nombreies')?.clearValidators();
          this.thirdFormGroup.get('tituloies')?.clearValidators();
          this.thirdFormGroup.get('mencionies')?.clearValidators();
          this.thirdFormGroup.get('fechagradoies')?.clearValidators();
        }
        
        this.thirdFormGroup.get('nombreies')?.updateValueAndValidity();
        this.thirdFormGroup.get('tituloies')?.updateValueAndValidity();
        this.thirdFormGroup.get('mencionies')?.updateValueAndValidity();
        this.thirdFormGroup.get('fechagradoies')?.updateValueAndValidity();
      }


      private _filter(name: string): Colegio[] {
        const filterValue = name.toLowerCase();
        return this.listPlantel.filter(option => option.nombre.toLowerCase().includes(filterValue));
      }

      displayFn(colegio: Colegio): string {
        return colegio ? colegio.nombre : '';
      }

findNac(){
  this.aspiranteService.getNac().subscribe(
    (result: any) => {
        this.nacs = result;
  }
  );
}

findGen(){
  this.aspiranteService.getGen().subscribe(
    (result: any) => {
        this.genero = result;
  }
  );
}


findEdoCivil(){
  this.aspiranteService.getEdoCivil().subscribe(
    (result: any) => {
        this.edocivil = result;
  }
  );
}

findGrupoSan(){
  this.aspiranteService.getGrupoSan().subscribe(
    (result: any) => {
        this.gruposan = result;
  }
  );
}

findEtnia(){
  this.aspiranteService.getEtnia().subscribe(
    (result: any) => {
        this.etnia = result;
  }
  );
}

findIndResp(){
  this.aspiranteService.getIndResp().subscribe(
    (result: any) => {
        this.indresp = result;
  }
  );
}

findDiscapacidad(){
  this.aspiranteService.getDiscapacidad().subscribe(
    (result: any) => {
        this.discapacidad = result;
        //console.log(this.discapacidad);
  }
  );
}

private findEstadosNacimiento(){
  this.aspiranteService.getEstados().subscribe(data=>{
    this.listEstadosNacimiento = data
  })
}

private findEstadosResidencia(){
  this.aspiranteService.getEstados().subscribe(data=>{
    this.listEstadosResidencia = data
  })
}

onEstadoselectedNacimiento(selectedEstadoId: any){
  this.aspiranteService.getMunicipioOfSelectedEstado(selectedEstadoId).subscribe(
    data=>{
      this.listMunicipiosNacimiento = data
    }
  )
}

onMunicipioselectedNacimiento(selectedMunicipioId: any){
  this.aspiranteService.getParroquiaOfSelectedMunicipio(selectedMunicipioId).subscribe(
    data=>{
      this.listParroquiasNacimiento = data
    }
  )
}

onEstadoselectedResidencia(selectedEstadoId: any){
  this.aspiranteService.getMunicipioOfSelectedEstado(selectedEstadoId).subscribe(
    data=>{
      this.listMunicipiosResidencia = data
    }
  )
}

onMunicipioselectedResidencia(selectedMunicipioId: any){
  this.aspiranteService.getParroquiaOfSelectedMunicipio(selectedMunicipioId).subscribe(
    data=>{
      this.listParroquiasResidencia = data
    }
  )
}


private findEstadosEducacionMedia(){
  this.aspiranteService.getEstados().subscribe(data=>{
    this.hayResultadosPlanteles = false;
    this.sinResultadosPlanteles= false;
    this.estadoSelectedEducacionMedia = '';
    this.municipioSelectedEducacionMedia = '';
      this.parroquiaSelectedEducacionMedia = '';
    this.listEstadosEducacionMedia = data
  })
}

onEstadoselectedEducacionMedia(selectedEstadoId: any){
  this.aspiranteService.getMunicipioOfSelectedEstado(selectedEstadoId).subscribe(
    data=>{
      this.hayResultadosPlanteles = false;
      this.sinResultadosPlanteles= false;
      this.municipioSelectedEducacionMedia = '';
      this.parroquiaSelectedEducacionMedia = '';
      this.listMunicipiosEducacionMedia = data
    }
  )
}

onMunicipioselectedEducacionMedia(selectedMunicipioId: any){
  this.aspiranteService.getParroquiaOfSelectedMunicipio(selectedMunicipioId).subscribe(
    data=>{
      this.parroquiaSelectedEducacionMedia = '';
      this.hayResultadosPlanteles = false;
      this.sinResultadosPlanteles= false;
      this.listParroquiasEducacionMedia = data
    }
  )
}

onParroquiaselectedEducacionMedia(selectedParroquiaId: any){
  this.SpinnerService.show();
  this.aspiranteService.getPlantelOfSelectedParroquia(selectedParroquiaId).subscribe(
    data=>{
      this.hayResultadosPlanteles = false;
      this.sinResultadosPlanteles= false;
      this.dataSource.data = data;
      if (this.dataSource.data.length == 0) {
        this.sinResultadosPlanteles = this.dataSource.data.length == 0;
        this.hayResultadosPlanteles = false;
        this.SpinnerService.hide();
       } else{
        this.dataSource.data = data;
        this.listPlantel = data
        this.hayResultadosPlanteles = this.dataSource.data.length > 0;
        this.SpinnerService.hide();
        this.plantelUpdated.next();
       }
      //console.log(data)
    }
  )
}

findTipoVia(){
  this.aspiranteService.getTipovia().subscribe(
    (result: any) => {
        this.tipovia = result;
  }
  );
}

findTipoNucleo(){
  this.aspiranteService.getTipoNucleo().subscribe(
    (result: any) => {
        this.tiponucleo = result;
  }
  );
}

findTipoConstruccion(){
  this.aspiranteService.getTipoConstruccion().subscribe(
    (result: any) => {
        this.tipoconstruccion = result;
  }
  );
}

findCarreras(){
  this.aspiranteService.getCarreras().subscribe(
    (result: any) => {
        this.carreras = result;
  }
  );
}

findOperMovil(){
  this.aspiranteService.getOperMovil().subscribe(
    (result: any) => {
        this.opermovil = result;
  }
  );
}

findOperRes(){
  this.aspiranteService.getOperRes().subscribe(
    (result: any) => {
        this.operres = result;
  }
  );
}

findBachiller(){
  this.aspiranteService.getBachiller().subscribe(
    (result: any) => {
        this.bachiller = result;
  }
  );
}

findModIngreso(){
  this.aspiranteService.getModIngreso().subscribe(
    (result: any) => {
        this.moding = result;
  }
  );
}

findTurnos(){
  this.aspiranteService.getTurnos().subscribe(
    (result: any) => {
        this.turnos = result;
  }
  );
}

findTrayectos(){
  this.aspiranteService.getTrayectos().subscribe(
    (result: any) => {
        this.trayectos = result;
  }
  );
}

findZonaPTransporte(){
  this.aspiranteService.getZonaPTransporte().subscribe(
    (result: any) => {
        this.procedencia = result;
  }
  );
}

findParentescoEmer(){
  this.aspiranteService.getParentescoEmer().subscribe(
    (result: any) => {
        this.parentesco = result;
  }
  );
}

findSectorTrabajo(){
  this.aspiranteService.getSectorTrabajo().subscribe(
    (result: any) => {
        this.sectortrab = result;
  }
  );
}

/* Validaciones para el campo de indice de bachillerato*/

numberValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (isNaN(value)) {
    return { invalidNumber: true };
  }
  return null;
}

rangeValidator(control: AbstractControl): ValidationErrors | null {
  const value = parseFloat(control.value);
  if (value < 10 || value > 20) {
    return { outOfRange: true };
  }
  return null;
}

formatValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  const regex = /^\d{2}\.\d{2}$/;
  if (!regex.test(value)) {
    return { invalidFormat: true };
  }
  return null;
}

onInputChange(event: any) {
  const input = event.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
  let numericValue = parseFloat(input) / 100; // Move decimal to appropriate place

  if (isNaN(numericValue)) {
    numericValue = 0;
  }

  const formattedInput = numericValue.toFixed(2); // Ensure two decimal places
  this.thirdFormGroup.patchValue({ indbachiller: formattedInput }, { emitEvent: false });

  // Set cursor position to the end
  setTimeout(() => {
    event.target.selectionStart = event.target.value.length;
    event.target.selectionEnd = event.target.value.length;
  }, 0);
}

plantelValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return { required: true };
  }
  const valid = this.listPlantel.some(colegio => colegio.nombre === value.nombre);
  return valid ? null : { invalidPlantel: true };
}

onInputChangeSni(event: any) {
  const input = event.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
  this.thirdFormGroup.patchValue({ sni: input }, { emitEvent: false });
}


findQuestSec() {
  this.aspiranteService.getQuestSec().subscribe((result: any) => {
    this.questsec = result;
    this.filterQuestions();
  });
}

filterQuestions() {
  const quest1 = this.fiveFormGroup.get('quest1')?.value;
  const quest2 = this.fiveFormGroup.get('quest2')?.value;

  this.questsec1 = this.questsec;
  this.questsec2 = this.questsec.filter(q => q.descripcion !== quest1);
  this.questsec3 = this.questsec.filter(q => q.descripcion !== quest1 && q.descripcion !== quest2);
}

crearPersona(f: any) {
  this.aspiranteService.createPerson(f.value).subscribe(datos => {
    if (datos['resultado']=='NOK' || datos['resultado']!=='OK') {
    }else {
     
    }
  });
}


guardar(): void {
  this.SpinnerService.show(); 
      
  // Esta función se ejecutará cuando se haga clic en "Guardar Datos" en el último step
  // Puedes acceder a los datos de cada step utilizando this.step1Form.value, this.step2Form.value, etc.
  const datosStep1 = this.firstFormGroup.getRawValue();
    const datosStep2 = this.secondFormGroup.getRawValue();
    const datosStep3 = this.thirdFormGroup.getRawValue();
// Transforma el valor de 'nombreplantel' de objeto Colegio a solo 'cod_ce'
if (datosStep3.nombreplantel && typeof datosStep3.nombreplantel === 'object') {
  datosStep3.nombreplantel = datosStep3.nombreplantel.cod_ce;
}
    const datosStep4 = this.fourthFormGroup.getRawValue();
    const datosStep5 = this.fiveFormGroup.getRawValue();

    const datosCompletos = {
      step1: datosStep1,
      step2: datosStep2,
      step3: datosStep3,
      step4: datosStep4,
      step5: datosStep5,
    };
    const cedula = datosCompletos.step1.cedula;

    this.aspiranteService.createPersonMigracion(datosCompletos).subscribe(datos => {
      if (datos['resultado']=='OK') {
        //this.obtenerYDescargarPDF(cedula);
        this.SpinnerService.hide();
        //this.notifyService.showInfo('Se ha iniciado la descarga del reporte de migración.');
        this.notifyService.showSuccess('Proceso de migración finalizado, ya puedes iniciar sesión en SICE.');
        this.router.navigateByUrl('/login');
      
      }else {
        this.SpinnerService.hide();
        this.notifyService.showWarning('Ha ocurrido un error, notifíquelo al correo: soportesice@unetrans.edu.ve indicando su cédula de identidad.');
        this.router.navigateByUrl('/login-migraestudiante');       
      }
    });
}

findEstudianteAspirante(cedula: { value: string; readonly: boolean; } | null | undefined){

  const user = {cedula};

    this.aspiranteService.getEstudianteAspirante(user).subscribe(
      (result: any) => {

        //this.estudiante = result;
        this.estudiante = Object.values(result);
        this.generatedPDFFile();
        this.createEtiqueta();
      }
    );
  }

  obtenerYDescargarPDF(cedula: number) {
    const user = { cedula };
  
    this.aspiranteService.getEstudianteAspirante(user).subscribe(data => {
      if (data && data.length > 0) {
        // Asumiendo que `data` es un array y que usamos el primer elemento
        const estudiante = data[0];
        const documentDefinition = this.getDocumentDefinition(estudiante);
        pdfMake.createPdf(documentDefinition as any).download(`Ficha_Estudiantil_${cedula}.pdf`);
      }
    });
  }


  getDocumentDefinition(data: any) {
    return {
      pageSize: 'LETTER',
      pageMargins: [40, 60, 40, 60], // Margen: izquierda, arriba, derecha, abajo
      content: [
        { text: 'Reporte del Estudiante', style: 'header' },
        '\n', // Espacio entre secciones
        {
          text: [
            { text: 'Información Personal\n', style: 'subheader' },
            `Nacionalidad: ${data.nac}\n`,
            `Cédula: ${data.ced_pas}\n`,
            `Nombres: ${data.nombres}\n`,
            `Apellidos: ${data.apellidos}\n`,
            `Sexo: ${data.sexo}\n`,
            `Fecha de Nacimiento: ${data.fnac}\n`,
            `Estado Civil: ${data.edocivil}\n`,
            `Grupo Sanguíneo: ${data.cod_gsanguineo}\n`,
            `Etnia: ${data.etnia}\n`,
            `Discapacidad: ${data.discapacidad}\n`,
            `Conapdis: ${data.conapdis}\n`,
          ],
        },
        '\n',
        {
          text: [
            { text: 'Información de Contacto\n', style: 'subheader' },
            `Estado de Residencia: ${data.edores}\n`,
            `Municipio de Residencia: ${data.munires}\n`,
            `Parroquia de Residencia: ${data.parrores}\n`,
            `Dirección de Habitación: ${data.direccion_hab}\n`,
            `Teléfono Celular: ${data.tlf_cel}\n`,
            `Teléfono de Habitación: ${data.tlf_hab}\n`,
            `Teléfono de Emergencia: ${data.tlf_emergencia} (${data.parentesco_emergencia})\n`,
            `Contacto de Emergencia: ${data.nombcontacto}\n`,
            `Correo Electrónico: ${data.email}\n`,
            `Correo Electrónico Alternativo: ${data.email_alt}\n`,
          ],
        },
        '\n',
        {
          text: [
            { text: 'Información Académica\n', style: 'subheader' },
            `Plantel de Procedencia: ${data.plantel} (${data.edoplantel}, ${data.munplantel}, ${data.parplantel})\n`,
            `Mención: ${data.mencion}\n`,
            `Índice Académico: ${data.indice}\n`,
            `SNI/RUSNIES: ${data.sni}\n`,
            `Fecha de Graduación Educ. Media: ${data.gradoedumedia}\n`,
            `IES de Procedencia: ${data.nombies}\n`,
            `Título IES: ${data.tituloies}\n`,
            `Fecha de Graduación IES: ${data.gradoies}\n`,
            `Mención IES: ${data.mencionies}\n`,
          ],
        },
        '\n',
        {
          text: [
            { text: 'Información Universitaria\n', style: 'subheader' },
            `Carnet: ${data.carnet}\n`,
            `Programa Nacional de Formación (PNF): ${data.pnf}\n`,
            `Sede: ${data.sede}\n`,
            `Modalidad de Ingreso: ${data.mod_ingreso}\n`,
            `Trayecto de Ingreso: ${data.trayecto_ing}\n`,
          ],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20], // Margen: izquierda, arriba, derecha, abajo
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 5], // Espacio antes de cada subencabezado
        },
      },
    };

  }


  validacion1: boolean;
  validacion2: boolean;
  validacion3: boolean;
  validacion4: boolean;
  validacion5: boolean;
  validacion6: boolean;

  validarContrasena() {
    this.validacion1 = this.pass.length >= 8; // Validar que tenga al menos 8 caracteres
    this.validacion2 = /[+-.!_*$#]/.test(this.pass); // Validar que tenga alguno de los caracteres especiales
    this.validacion4 = /\d/.test(this.pass); // Validar que haya al menos un número
    this.validacion5 = /[A-Z]/.test(this.pass); // Validar que haya al menos una letra mayúscula
    this.validacion6 = !this.pass.includes(this.aspirante.usrsice) && !this.pass.includes(this.aspirante.cedula);  // Validar que la contraseña no sea igual a la cédula de identidad ni el usuario
    this.validarConfirmacion();
  }

  validarConfirmacion() {
    this.validacion3 = this.pass !== null && this.confpass !== null && this.pass === this.confpass;
  }

selectedPlantel = this._formBuilder.group({
  
 });

 //Generación del PDF si todo esta OK
 public generatedPDFFile() {


  const doc = new jsPDF('p', 'pt', 'letter');

  // Obtener los valores del JSON
  const nacionalidad = this.estudiante[0].nac;
  const cedula = this.estudiante[0].ced_pas;
  const nombres = this.estudiante[0].nombres;
  const apellidos = this.estudiante[0].apellidos;
  const sexo = this.estudiante[0].sexo;
  const fnac = this.estudiante[0].fecnac;
  const edocivil = this.estudiante[0].edocivil;
  const gsanguineo = this.estudiante[0].gsanguineo;
  const edonac = this.estudiante[0].edonac;
  const muninac = this.estudiante[0].muninac;
  const parronac = this.estudiante[0].parronac;
  const etnia = this.estudiante[0].etnia;
  const discapacidad = this.estudiante[0].discapacidad;
  const conapdis = this.estudiante[0].conapdis
  const edores = this.estudiante[0].edores;
  const munires = this.estudiante[0].munires;
  const parrores = this.estudiante[0].parrores;
  const direccion_hab = this.estudiante[0].direccion_hab;
  const tlf_cel = this.estudiante[0].tlf_cel;
  const tlf_hab = this.estudiante[0].tlf_hab;
  const tlf_emergencia = this.estudiante[0].tlf_emergencia;
  const parentesco_emergencia = this.estudiante[0].parentesco_emergencia;
  const nombcontacto = this.estudiante[0].nombcontacto;
  const email = this.estudiante[0].email;
  const email_alt = this.estudiante[0].email_alt;
  const edoplantel = this.estudiante[0].edoplantel;
  const munplantel = this.estudiante[0].munplantel;
  const parplantel = this.estudiante[0].parplantel;
  const plantel = this.estudiante[0].plantel;
  const mencion = this.estudiante[0].mencion;
  const indice = this.estudiante[0].indice.toString();
  const sni = this.estudiante[0].sni_rusnies;
  const gradoedumedia = this.estudiante[0].fechagrado;
  const nombies = this.estudiante[0].nombies;
  const tituloies = this.estudiante[0].tituloies;
  const gradoies = this.estudiante[0].fechagradoies;
  const carnet = this.estudiante[0].carnet.toString();
  const pnf = this.estudiante[0].pnf;
  const sede = this.estudiante[0].sede;
  const mod_ingreso = this.estudiante[0].mod_ingreso;
  const trayecto_ing = this.estudiante[0].trayecto_ing;
  const mencionies = this.estudiante[0].mencionies;

  
  // Agregar encabezado en cada página
  const headerImg = new Image();
  headerImg.src = 'assets/img/brand/cintillo_unetrans_082023.png';
  
  //doc.addPage();
  doc.addImage(headerImg, 'PNG', 42, 10, 1052/2, 87/2);
  
  doc.setDrawColor(0);
  doc.setFillColor(255, 255, 255);
  doc.setFontSize(12);
  
  // Resto del código para agregar contenido al PDF...
// Título
doc.setFontSize(12);
doc.setFont('Arial', 'bold');
doc.text('Ficha de Registro Estudiantil', doc.internal.pageSize.getWidth() / 2, 76, { align: 'center' });

// Contenido
doc.setFontSize(10);

//Primera línea
doc.setFont('Arial','bold');
doc.text(`1. Datos de identidad del estudiante`, 55, 100);
const item1 = 'Cédula:';
const value1 = `${nacionalidad}-${cedula}`;
const item2 = 'Nombres:';
const value2 = `${nombres}`;
const item3 = 'Apellidos:';
const value3 = `${apellidos}`;
const item1Width = doc.getTextWidth(item1);
const value1Width = doc.getTextWidth(value1);
const item2Width = doc.getTextWidth(item2);
const value2Width = doc.getTextWidth(value2);
const item3Width = doc.getTextWidth(item3);
doc.setFont('Arial', 'bold');
doc.text(item1, 67, 113);
doc.text(item2, 67 + item1Width + 2 + value1Width + 10, 113);
doc.text(item3, 67 + item1Width + 2 + value1Width + 10 + item2Width + 2 + value2Width + 10, 113);
doc.setFont('Arial', 'normal');
doc.text(value1, 67 + item1Width + 2, 113);
doc.text(value2, 67 + item1Width + 2 + value1Width + 10 + item2Width + 2, 113);
doc.text(value3, 67 + item1Width + 2 + value1Width + 10 + item2Width + 2 + value2Width + 10 + item3Width +2, 113);


//Segunda línea
const item4 = 'Estado civil:';
const value4 = `${edocivil}`;
const item5 = 'Fecha de nacimiento:';
const value5 = `${fnac}`;
const item6 = 'Género:';
const value6 = `${sexo}`;
const item7 = 'Tipo de sangre:';
const value7 = `${gsanguineo}`;
const item4Width = doc.getTextWidth(item4);
const value4Width = doc.getTextWidth(value4);
const item5Width = doc.getTextWidth(item5);
const value5Width = doc.getTextWidth(value5);
const item6Width = doc.getTextWidth(item6);
const value6Width = doc.getTextWidth(value6);
const item7Width = doc.getTextWidth(item7);

doc.setFont('Arial', 'bold');
doc.text(item4, 67, 126);
doc.text(item5, 67 + item4Width + 4 + value4Width + 10, 126);
doc.text(item6, 67 + item4Width + 4 + value4Width + 10 + item5Width + 4 + value5Width + 10, 126);
doc.text(item7, 67 + item4Width + 4 + value4Width + 10 + item5Width + 4 + value5Width + 10 + item6Width + 4 + value6Width + 10, 126);
doc.setFont('Arial', 'normal');
doc.text(value4, 67 + item4Width + 4, 126);
doc.text(value5, 67 + item4Width + 4 + value4Width + 10 + item5Width + 6, 126);
doc.text(value6, 67 + item4Width + 4 + value4Width + 10 + item5Width + 6 + value5Width + 10 + item6Width + 4, 126);
doc.text(value7, 67 + item4Width + 4 + value4Width + 10 + item5Width + 6 + value5Width + 10 + item6Width + 4 + value6Width + 10 + item7Width + 4 , 126);

//Tercera línea
const item8Width = doc.getTextWidth(edonac);
const value8Width = doc.getTextWidth(muninac);
doc.setFont('Arial','bold');
doc.text(`Ubicación geográfica del lugar de nacimiento:`, 67, 143);
doc.text(`Estado:`, 67, 156);
doc.text(`Municipio:`, 67 + item8Width + 30, 156);
doc.text(`Parroquia:`, 67 + item8Width + 30 + value8Width + 30, 156);
doc.setFont('Arial','normal');
doc.text(edonac, 67, 169);
doc.text(muninac, 67 + item8Width + 30, 169);
doc.text(parronac, 67 + item8Width + 30 + value8Width + 30, 169);


//Cuarta línea
const item9Width = doc.getTextWidth(etnia);
const value10Width = doc.getTextWidth(discapacidad);
doc.setFont('Arial','bold');
doc.text(`Información complementaria:`, 67, 186);
doc.text(`Etnia:`, 67, 199);
doc.text(`Discapacidad:`, 67 + item9Width + 20, 199);
if (conapdis == null) {
} else {doc.text(`Nro CONAPDIS:`, 67 + item9Width + 20 + value10Width +20, 199);}
doc.setFont('Arial','normal');
doc.text(etnia, 67, 212);
doc.text(discapacidad, 67 + item9Width + 20, 212);
if (conapdis == null) {
} else {
const conapdis2 = this.estudiante[0].conapdis.toString();
doc.text(conapdis2, 67 + item9Width + 20 + value10Width +20, 212);
}

//Quinta línea
const item11Width = doc.getTextWidth(edores);
const value12Width = doc.getTextWidth(munires);
doc.setFont('Arial','bold');
doc.text(`2. Datos de residencia y contacto`, 55, 229);
doc.text(`Ubicación geográfica residencial:`, 67, 242);
doc.text(`Estado:`, 67, 255);
doc.text(`Municipio:`, 67 + item11Width + 30, 255);
doc.text(`Parroquia:`, 67 + item11Width + 30 + value12Width + 30, 255);
doc.setFont('Arial','normal');
doc.text(edores, 67, 268);
doc.text(munires, 67 + item11Width + 30, 268);
doc.text(parrores, 67 + item11Width + 30 + value12Width + 30, 268);

//Sexta línea
const item13 = 'Direccción completa:';
const item13Width = doc.getTextWidth(item13);
doc.setFont('Arial','bold');
doc.text(item13, 67, 281);
doc.setFont('Arial','normal');
doc.text(direccion_hab, 67 + item13Width + 9, 281);

//Séptima línea
doc.setFont('Arial','bold');
doc.text(`Datos de contacto:`, 67, 294);
const item14 = 'Teléfono móvil:';
const value14 = `${tlf_cel}`; 
const item15 = 'Teléfono residencial:';
const value15 = `${tlf_hab}`; 
const item16 = 'Email:';
const value16 = `${email}`; 

const item14Width = doc.getTextWidth(item14);
const value14Width = doc.getTextWidth(value14);
const item15Width = doc.getTextWidth(item15);
const value15Width = doc.getTextWidth(value15);
const item16Width = doc.getTextWidth(item16);

doc.setFont('Arial','bold');
doc.text(item14, 67, 307);
if (tlf_hab == null) {
doc.text(item16, 67 + item14Width + 5 + value14Width + 10, 307);
} else {
doc.text(item15, 67 + item14Width + 5 + value14Width + 10, 307);
doc.text(item16, 67 + item14Width + 5 + value14Width + 10 + item15Width + 5 + value15Width + 10 , 307);
}
doc.setFont('Arial','normal');
doc.text(value14, 67 + item14Width + 5, 307);

if (tlf_hab == null) {
doc.text(value16, 67 + item14Width + 5 + value14Width + 10 + item16Width + 3, 307);
} else {
doc.text(value15, 67 + item14Width + 5 + value14Width + 10 + item15Width + 5, 307);
doc.text(value16, 67 + item14Width + 5 + value14Width + 10 + item15Width + 5 + value15Width + 10 + item16Width + 3, 307);
}

//Octava línea
const item17 = 'Teléfono de emergencia:';
const value17 = `${tlf_emergencia}`; 
const item18 = 'Contacto de emergencia:';
const value18 = `${nombcontacto} - ${parentesco_emergencia}`; 

const item17Width = doc.getTextWidth(item17);
const value17Width = doc.getTextWidth(value17);
const item18Width = doc.getTextWidth(item18);

doc.setFont('Arial', 'bold');
doc.text(item17, 67, 320);
doc.text(item18, 67 + item17Width + 7 + value17Width + 10, 320);
doc.setFont('Arial', 'normal');
doc.text(value17, 67 + item17Width + 7, 320);
doc.text(value18, 67 + item17Width + 7 + value17Width + 10 + item18Width + 9, 320);


//Novena línea
const item19Width = doc.getTextWidth(edoplantel);
const value19Width = doc.getTextWidth(munplantel);

doc.setFont('Arial','bold');
doc.text(`3. Datos académicos`, 55, 337);
doc.text(`Educación Media General:`, 67, 350);
doc.text(`Ubicación geográfica del plantel:`, 67, 363);
doc.text(`Estado:`, 67, 376);
doc.text(`Municipio:`, 67 + item19Width + 30, 376);
doc.text(`Parroquia:`, 67 + item19Width + 30 + value19Width + 30, 376);
doc.setFont('Arial','normal');
doc.text(edoplantel, 67, 389);
doc.text(munplantel, 67 + item19Width + 30, 389);
doc.text(parplantel, 67 + item19Width + 30 + value19Width + 30, 389);
doc.setFont('Arial','bold');
doc.text(`Nombre del plantel: `, 67, 402);
doc.setFont('Arial','normal');
doc.text(plantel, 157, 402);


//Décima línea
const item20 = 'Título/Mención:';
const value20 = `${mencion}`;
const item21 = 'Fecha de grado:';
const value21 = `${gradoedumedia}`;
const item22 = 'Índice:';
const value22 = `${indice}`;
const item23 = 'N° SNI:';
const value23 = `${sni}`;
const item20Width = doc.getTextWidth(item20);
const value20Width = doc.getTextWidth(value20);
const item21Width = doc.getTextWidth(item21);
const value21Width = doc.getTextWidth(value21);
const item22Width = doc.getTextWidth(item22);
const value22Width = doc.getTextWidth(value22);
const item23Width = doc.getTextWidth(item23);

doc.setFont('Arial', 'bold');
doc.text(item20, 67, 415);
doc.text(item21, 67 + item20Width + 6 + value20Width + 10, 415);
doc.text(item22, 67 + item20Width + 6 + value20Width + 10 + item21Width + 8 + value21Width + 10, 415);
doc.text(item23, 67 + item20Width + 6 + value20Width + 10 + item21Width + 8 + value21Width + 10 + item22Width + 4 + value22Width + 10, 415);
doc.setFont('Arial', 'normal');
doc.text(value20, 67 + item20Width + 6, 415);
doc.text(value21, 67 + item20Width + 6 + value20Width + 10 + item21Width + 8, 415);
doc.text(value22, 67 + item20Width + 6 + value20Width + 10 + item21Width + 8 + value21Width + 10 + item22Width + 4, 415);
doc.text(value23, 67 + item20Width + 6 + value20Width + 10 + item21Width + 8 + value21Width + 10 + item22Width + 4 + value22Width + 10 + item23Width + 4 , 415);

if (nombies == null) {
//Se muestran directamente los datos del paso 4 si no tiene datos universitarios

doc.setFont('Arial','bold');
doc.text(`4. Datos de inscripción en la UNETRANS`, 55, 432);
const item24 = 'N° de Carnet:';
const value24 = `${carnet}`;
const item25 = 'Trayecto de ingreso:';
const value25 = `${trayecto_ing}`;
const item26 = 'Modo de ingreso:';
const value26 = `${mod_ingreso}`;
const item27 = 'Sede:';
const value27 = 'Central' //`${sede}`;
const item28 = 'PNF:';
const value28 = `${pnf}` 
const item24Width = doc.getTextWidth(item24);
const value24Width = doc.getTextWidth(value24);
const item25Width = doc.getTextWidth(item25);
const value25Width = doc.getTextWidth(value25);
const item26Width = doc.getTextWidth(item26);
const value26Width = doc.getTextWidth(value26);
const item27Width = doc.getTextWidth(item27);
const value27Width = doc.getTextWidth(value27);
const item28Width = doc.getTextWidth(item28);
const value28Width = doc.getTextWidth(value28);

doc.setFont('Arial', 'bold');
doc.text(item24, 67, 445);
doc.text(item25, 67 + item24Width + 2 + value24Width + 10, 445);
doc.text(item26, 67 + item24Width + 2 + value24Width + 10 + item25Width + 4 + value25Width + 10, 445);
// linea que muestra en pnf y la sede (titulos en negrita)
doc.text(item28, 67, 458);
doc.text(item27, 67 + item28Width + 2 + value28Width + 10, 458);

doc.setFont('Arial', 'normal');
doc.text(value24, 67 + item24Width + 2, 445);
doc.text(value25, 67 + item24Width + 2 + value24Width + 10 + item25Width + 4, 445);
doc.text(value26, 67 + item24Width + 2 + value24Width + 10 + item25Width + 4 + value25Width + 10 + item26Width + 4, 445);
// linea que muestra en pnf y la sede
doc.text(value28, 67 + item28Width + 2, 458);
doc.text(value27, 67 + item28Width + 2 + value28Width + 10 + item27Width + 3, 458);

doc.setFontSize(10);
doc.setFont('Arial', 'bold');
doc.text('Requisitos para formalizar el proceso de inscripción', doc.internal.pageSize.getWidth() / 2, 495, { align: 'center' });
doc.setFontSize(8);
doc.setFont('Arial', 'bold');
doc.text('SÓLO PARA SER LLENADO POR CONTROL DE ESTUDIOS', doc.internal.pageSize.getWidth() / 2, 508, { align: 'center' });

//tabla de requisitos
var body = [
[1, 'Una (1) copia ampliada de la cédula de identidad al 150% sin recortar','', 6, 'Constancia de inscripcion en el Sistema Nacional de Ingreso.'],
[2, 'Una (1) copia de la Partida de Nacimiento. ','',7, 'Una (1) copia de la inscripción del Registro Militar, sin recortar.'],
[3, 'Una (1) Foto tipo carnet fondo blanco. ','',8, 'Una (1) copia del tipeaje sanguíneo.'],
[4, 'Una (1) copia simple del Título de Bachiller','',9, 'Cuatro (4) fundas plásticas'],
[5, 'Una (1) copia de las Notas Certificadas con sus timbre fiscal (Del 1er al 5to año).','',10, 'Una (1) carpeta manila tamaño OFICIO, con gancho.']
]
// New Header and Footer Data Include the table
let margin = doc.internal.pageSize.getWidth() / 2;
autoTable(doc,{
body: body,
startY: 520,
head:[['N°','Documento', '','N°','Documento', '']],
headStyles :{lineWidth: 1,fillColor: [0, 62, 133],textColor: [255,255,255], fontSize: 7,
},
bodyStyles :{ fontSize: 6,
},
margin: {left: 60, right: margin},
theme: 'grid',
columnStyles: {
0: {
 halign: 'center',
 valign: 'middle',
 cellWidth: 20,
 fillColor: [232, 252, 245],
},
1: {
 halign: 'left',
 valign: 'middle',
 cellWidth: 230,
 fillColor: [232, 252, 245],
},
2: {
 halign: 'center',
 cellWidth: 20,
 fillColor: [232, 252, 245],
},
3: {
 halign: 'center',
 valign: 'middle',
 cellWidth: 20,
 fillColor: [232, 252, 245],
},
4: {
 halign: 'left',
 valign: 'middle',
 cellWidth: 190,
 fillColor: [232, 252, 245],
},
5: {
 halign: 'center',
 cellWidth: 20,
 fillColor: [232, 252, 245],
},
},
})
doc.setFontSize(9);
doc.setFont('Arial','normal');
doc.text('NOTA: Al momento de formalizar la inscripción debe consignar la documentación en ORIGINAL para su verificación', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 150, { align: 'center' });
doc.text(`____________________________`, 80, doc.internal.pageSize.getHeight() - 60);
doc.text(`____________________________`, 250, doc.internal.pageSize.getHeight() - 60);
doc.text(`____________________________`, 420, doc.internal.pageSize.getHeight() - 60);
doc.setFont('Arial','bold');
doc.text(`Firma del participante`, 100, doc.internal.pageSize.getHeight() - 50);
doc.text(`Personal de Control de Estudios`, 250, doc.internal.pageSize.getHeight() - 50);
doc.text(`Fecha consignación`, 446, doc.internal.pageSize.getHeight() - 50);

} else {

//Décima línea
const item29 = 'Institución de Educ. Univ.:';
const value29 = `${nombies}`;
const item30 = 'Título:';
const value30 = `${tituloies} (${mencionies})`;
const item31 = 'Fecha de grado:';
const value31 = `${gradoies}`;
const item29Width = doc.getTextWidth(item29);
const value29Width = doc.getTextWidth(value29);
const item30Width = doc.getTextWidth(item30);
const value30Width = doc.getTextWidth(value30);
const item31Width = doc.getTextWidth(item31);

doc.setFont('Arial','bold');
doc.text(`Educación Universitaria:`, 67, 432);
doc.setFont('Arial', 'bold');
doc.text(item29, 67, 445);
doc.text(item30, 67 + item29Width + 10 + value29Width + 5, 445);
doc.text(item31, 67 + item29Width + 10 + value29Width + 5 + item30Width + 8 + value30Width + 10, 445);
doc.setFont('Arial', 'normal');
doc.text(value29, 67 + item29Width + 10, 445);
doc.text(value30, 67 + item29Width + 10 + value29Width + 5 + item30Width + 8, 445);
doc.text(value31, 67 + item29Width + 10 + value29Width + 5 + item30Width + 8 + value30Width + 10 + item31Width + 8, 445);

doc.setFont('Arial','bold');
doc.text(`4. Datos de inscripción en la UNETRANS`, 55, 462);
const item24 = 'N° de Carnet:';
const value24 = `${carnet}`;
const item25 = 'Trayecto de ingreso:';
const value25 = `${trayecto_ing}`;
const item26 = 'Modo de ingreso:';
const value26 = `${mod_ingreso}`;
const item27 = 'Sede:';
const value27 = 'Central' //`${sede}`;
const item28 = 'PNF:';
const value28 = `${pnf}` 
const item24Width = doc.getTextWidth(item24);
const value24Width = doc.getTextWidth(value24);
const item25Width = doc.getTextWidth(item25);
const value25Width = doc.getTextWidth(value25);
const item26Width = doc.getTextWidth(item26);
const value26Width = doc.getTextWidth(value26);
const item27Width = doc.getTextWidth(item27);
const value27Width = doc.getTextWidth(value27);
const item28Width = doc.getTextWidth(item28);
const value28Width = doc.getTextWidth(value28);

doc.setFont('Arial', 'bold');
doc.text(item24, 67, 475);
doc.text(item25, 67 + item24Width + 2 + value24Width + 10, 475);
doc.text(item26, 67 + item24Width + 2 + value24Width + 10 + item25Width + 4 + value25Width + 10, 475);
// linea que muestra en pnf y la sede (titulos en negrita)
doc.text(item28, 67, 488);
doc.text(item27, 67 + item28Width + 2 + value28Width + 10, 488);

doc.setFont('Arial', 'normal');
doc.text(value24, 67 + item24Width + 2, 475);
doc.text(value25, 67 + item24Width + 2 + value24Width + 10 + item25Width + 4, 475);
doc.text(value26, 67 + item24Width + 2 + value24Width + 10 + item25Width + 4 + value25Width + 10 + item26Width + 4, 475);
// linea que muestra en pnf y la sede
doc.text(value28, 67 + item28Width + 2, 488);
doc.text(value27, 67 + item28Width + 2 + value28Width + 10 + item27Width + 3, 488);

doc.setFontSize(10);
doc.setFont('Arial', 'bold');
doc.text('Requisitos para formalizar el proceso de inscripción', doc.internal.pageSize.getWidth() / 2, 525, { align: 'center' });
doc.setFontSize(8);
doc.setFont('Arial', 'bold');
doc.text('SÓLO PARA SER LLENADO POR CONTROL DE ESTUDIOS', doc.internal.pageSize.getWidth() / 2, 538, { align: 'center' });

//tabla de requisitos
var body = [
[1, 'Una (1) copia ampliada de la cédula de identidad al 150% sin recortar','', 6, 'Constancia de inscripcion en el Sistema Nacional de Ingreso.'],
[2, 'Una (1) copia de la Partida de Nacimiento. ','',7, 'Una (1) copia de la inscripción del Registro Militar, sin recortar.'],
[3, 'Una (1) Foto tipo carnet fondo blanco. ','',8, 'Una (1) copia del tipeaje sanguíneo.'],
[4, 'Una (1) copia simple del Título de Bachiller','',9, 'Cuatro (4) fundas plásticas'],
[5, 'Una (1) copia de las Notas Certificadas con sus timbre fiscal (Del 1er al 5to año).','',10, 'Una (1) carpeta manila tamaño OFICIO, con gancho.']
]
// New Header and Footer Data Include the table
let margin = doc.internal.pageSize.getWidth() / 2;
autoTable(doc,{
body: body,
startY: 550,
head:[['N°','Documento', '','N°','Documento', '']],
headStyles :{lineWidth: 1,fillColor: [0, 62, 133],textColor: [255,255,255], fontSize: 7,
},
bodyStyles :{ fontSize: 6,
},
margin: {left: 60, right: margin},
theme: 'grid',
columnStyles: {
0: {
 halign: 'center',
 valign: 'middle',
 cellWidth: 20,
 fillColor: [232, 252, 245],
},
1: {
 halign: 'left',
 valign: 'middle',
 cellWidth: 230,
 fillColor: [232, 252, 245],
},
2: {
 halign: 'center',
 cellWidth: 20,
 fillColor: [232, 252, 245],
},
3: {
 halign: 'center',
 valign: 'middle',
 cellWidth: 20,
 fillColor: [232, 252, 245],
},
4: {
 halign: 'left',
 valign: 'middle',
 cellWidth: 190,
 fillColor: [232, 252, 245],
},
5: {
 halign: 'center',
 cellWidth: 20,
 fillColor: [232, 252, 245],
},
},
})
doc.setFontSize(9);
doc.setFont('Arial','normal');
doc.text('NOTA: Al momento de formalizar la inscripción debe consignar la documentación en ORIGINAL para su verificación', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 120, { align: 'center' });
doc.text(`____________________________`, 80, doc.internal.pageSize.getHeight() - 60);
doc.text(`____________________________`, 250, doc.internal.pageSize.getHeight() - 60);
doc.text(`____________________________`, 420, doc.internal.pageSize.getHeight() - 60);
doc.setFont('Arial','bold');
doc.text(`Firma del participante`, 100, doc.internal.pageSize.getHeight() - 50);
doc.text(`Personal de Control de Estudios`, 250, doc.internal.pageSize.getHeight() - 50);
doc.text(`Fecha consignación`, 446, doc.internal.pageSize.getHeight() - 50);

}






// // Pie de página
// doc.setFontSize(9);
// doc.setFont('Arial', 'bold');
// doc.text('FORMATO UNETRANS-DACE-01.', 20, doc.internal.pageSize.getHeight() - 20);
// doc.addPage();

// doc.addImage(headerImg, 'PNG', 42, 10, 1052/2, 87/2);
  
//     doc.setDrawColor(0);
//     doc.setFillColor(255, 255, 255);
//     doc.setFontSize(12);


// Pie de página
doc.setFontSize(6);
doc.setFont('Arial', 'bold');
doc.text('FORMATO UNETRANS-DACE-01.', 20, doc.internal.pageSize.getHeight() - 20);
  
  // Guardar el archivo PDF
  doc.save(`ficha_registro_ingreso_${cedula}.pdf`);

}

createEtiqueta() {
  const doc = new jsPDF('p', 'pt', 'letter');
  // Agregar encabezado en cada página
  const headerImg = new Image();
  headerImg.src = 'assets/img/brand/cintillo_unetrans_082023.png';
  
  //doc.addPage();
  doc.addImage(headerImg, 'PNG', 42, 10, 1052/2, 87/2);
  


  const nacionalidad = this.estudiante[0].nac;
  const cedula = this.estudiante[0].ced_pas;
  const carnet = this.estudiante[0].carnet.toString();
  const nombres = this.estudiante[0].nombres;
  const apellidos = this.estudiante[0].apellidos;
  const pnf = this.estudiante[0].pnf;
  const mod_ingreso = this.estudiante[0].mod_ingreso;
  const nombre_corto = this.estudiante[0].nombre_corto;



  doc.setFontSize(10);
doc.setFont('Arial', 'bold');
doc.text('Etiquetas para expediente estudiantil', doc.internal.pageSize.getWidth() / 2, 76, { align: 'center' });
doc.setFont('Arial', 'normal');
var text = "Debes imprimir y recortar las etiquetas para ser pegadas en la parte frontal de la carpeta (rectangulo grande) y en la pestaña de la carpeta (rectangulo pequeño).";
var splitText = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 108);
doc.text(splitText, 55, 100);
//doc.text(`Debes imprimir y recortar las etiquetas para ser pegadas en la parte frontal de la carpeta`, 55, 100);
//doc.text(`(rectangulo grande) y en la pestaña de la carpeta (rectangulo pequeño).`, 55, 113);

  // Establecer las coordenadas y dimensiones del cuadrado
  const x = 55;
  const y = 130;
  const width = 380;
  const height = 120;

  // Dibujar el cuadrado con líneas punteadas
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([1, 1], 0);
  doc.rect(x, y, width, height, 'D');

  // Escribir texto dentro del cuadrado
  const textX = x + 5;
  const textY = y + 16;
  doc.setFontSize(12);
  doc.setFont('Arial', 'bold');
  doc.text('Expediente estudiantil UNETRANS', width -135, textY, { align: 'center' });
  doc.setFont('Arial', 'normal');
  doc.text(`Carnet: ${carnet}     Cédula: ${nacionalidad}-${cedula}`, textX, textY+18);
  doc.text(`Nombres: ${nombres}`, textX, textY + 36);
  doc.text(`Apellidos: ${apellidos}`, textX, textY + 54);
  doc.text(`PNF: ${pnf}`, textX, textY + 72);
  doc.text(`Ingreso: ${mod_ingreso}`, textX, textY + 90);

  // Dibujar la línea para el carnet y nombre
  const lineStartX = x;
  const lineStartY = y+10 + height + 10;
  const lineEndX = x + width;
  
  //doc.setLineDash([]);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([1, 1], 0);
  const width2 = 412;
  const height2 = 28;
  doc.rect(lineStartX, lineStartY, width2, height2, 'D');


  // Escribir el texto del carnet y nombre
  const lineTextX = lineStartX + 5;
  
  doc.text(`Carnet: ${carnet}  Cédula: ${nacionalidad}-${cedula}  Estudiante: ${nombre_corto}`, lineTextX-2, lineStartY +16);
  
  doc.setFontSize(10);
  doc.setFont('Arial', 'normal');
  var text = "Para poder completar tu proceso de inscripción debes consignar los documentos en original y copia así como la carpeta con las etiquetas ya pegadas, deberás asistir a entregar el expediente el día que seas convocado.";
  var splitText = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 108);
  doc.text(splitText, 55, 350);

  doc.setFontSize(10);
  doc.setFont('Arial', 'bold');
  var text = "NOTA: no perforar los documentos, los mismos deben ser revisados previamente por el personal de Control de Estudios";
  var splitText = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 108);
  doc.text(splitText, 55, 380);

  // Pie de página
doc.setFontSize(6);
doc.setFont('Arial', 'bold');
doc.text('FORMATO UNETRANS-DACE-02.', 20, doc.internal.pageSize.getHeight() - 20);
   // Guardar el archivo
   doc.save(`etiquetas_${cedula}.pdf`);
}




}