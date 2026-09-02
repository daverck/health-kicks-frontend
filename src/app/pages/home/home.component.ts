import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  readonly currentYear = new Date().getFullYear();

  readonly steps = [
    { title: 'Portez le device', text: 'Le bracelet Health Kicks capte les mouvements via ses capteurs IMU haute précision.' },
    { title: 'Détection intelligente', text: 'Un algorithme embarqué identifie les chutes et calcule un score de confiance.' },
    { title: 'Alerte cloud', text: "L'événement est transmis au backend via un webhook sécurisé et horodaté." },
    { title: 'Action immédiate', text: 'Depuis le dashboard, déclenchez une vibration haptique de confirmation ou de soin.' },
  ];
}
