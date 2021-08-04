import { Component } from '@angular/core';
import { AccountNode } from "./tree/tree.component";
import { VAULTS } from "../vaults";

@Component( {
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
} )
export class AppComponent {
    public vaults: AccountNode[] = Object.assign( [], VAULTS );

    constructor() {
    }
}
