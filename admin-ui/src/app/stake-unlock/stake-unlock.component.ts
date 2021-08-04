import { Component, OnInit } from '@angular/core';
import { Message } from "../account/account.component";
import { ApiClientService } from "../services/api-client.service";

@Component( {
    selector: 'app-stake-unlock',
    templateUrl: './stake-unlock.component.html',
    styleUrls: ['./stake-unlock.component.scss']
} )
export class StakeUnlockComponent implements OnInit {

    public readonly locked = 3535670616;
    public unlock90 = 0;
    public unlock365 = 0;
    public message: Message;
    public isSaving = false;

    constructor(
        private _apiClientService: ApiClientService
    ) {
    }

    ngOnInit(): void {
        this._apiClientService.get( 'validators-unlock' )
            .subscribe(
                ( result: ArrayBuffer ) => {
                    this.unlock365 = result[0].unlock365 / 1000000000;
                    this.unlock90 = result[0].unlock90 / 1000000000;
                }
            );
    }

    public save(): void {
        this.isSaving = true;
        this._apiClientService.post( 'validators-unlock?amount=' + this.unlock365, null )
            .subscribe(
                () => {
                    this.message = {
                        type: 'success',
                        text: 'Updated successfully.'
                    }
                    this.isSaving = false;
                },
                ( error ) => {
                    this.message = {
                        type: 'error',
                        text: 'Error updating genesis stake.'
                    }
                    this.isSaving = false;
                    console.log( error );
                }
            );
    }

}
