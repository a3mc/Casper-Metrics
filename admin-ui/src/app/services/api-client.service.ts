import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const httpOptions = {
    headers: new HttpHeaders( { 'Content-Type': 'application/json' } )
};

@Injectable()
export class ApiClientService {
    private _baseUrl = 'http://3.124.189.139:3002/api/'; 

    constructor(
        private _httpClient: HttpClient
    ) {
    }

    public post( endpoint: any, body: any ) {
        let url = this._baseUrl + endpoint;
        return this._httpClient.post<any>( url, body, httpOptions );
    }

    public patch( endpoint: any, body: any ) {
        let url = this._baseUrl + endpoint;
        return this._httpClient.patch<any>( url, body, httpOptions );
    }

    public get( endpoint: any, params: any[] = null ) {
        let url = this._baseUrl + endpoint;

        if ( endpoint.match( /^https/ ) ) {
            url = endpoint;
        }

        // Check for query string parameters
        let parameters = new HttpParams();
        if ( params && params.length > 0 ) {
            for ( let param in params ) {
                // Check if the parameter is an array
                if ( params[param].value instanceof Array ) {
                    for ( let arrayItem in params[param].value ) {
                        parameters = parameters.append( params[param].name + '[]', params[param].value[arrayItem] );
                    }
                } else {
                    parameters = parameters.append( params[param].name, params[param].value );
                }
            }
        }

        let _options: any = {
            params: parameters
        };

        return this._httpClient.get( url, _options );
    }

    public put( endpoint: any, body: any ): Observable<any> {
        let url = this._baseUrl + endpoint;

        return this._httpClient.put<any>( url, body, httpOptions );
    }

    public delete( endpoint: any ): Observable<any> {
        let url = this._baseUrl + endpoint;

        return this._httpClient.delete<any>( url );
    }

}
