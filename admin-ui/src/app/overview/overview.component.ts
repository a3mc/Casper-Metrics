import { Component, OnInit } from '@angular/core';
import { ApiClientService } from "../services/api-client.service";
import { take } from "rxjs/operators";

@Component( {
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss']
} )
export class OverviewComponent implements OnInit {

    public circulatingSupply = 0;
    public totalSupply = 0;
    public validatorsWeight = 0;

    constructor(
        private _apiClientService: ApiClientService,
    ) {
    }

    ngOnInit(): void {
        this._apiClientService.get( 'era' )
            .pipe( take( 1 ) )
            .subscribe( ( result: any ) => {
                this.circulatingSupply = result[0].circulatingSupply;
                this.totalSupply = result[0].totalSupply;
                this.validatorsWeight = result[0].validatorsWeights;
            } );
    }

}
