import { Component, OnInit, ViewChild } from '@angular/core';
import { take } from 'rxjs/operators';
import { ApiClientService } from '../services/api-client.service';
import { AccountNode, TreeComponent } from '../tree/tree.component';
import { VAULTS } from "../../vaults";
import { ActivatedRoute } from "@angular/router";
import * as moment from 'moment';

export interface Message {
    type?: string;
    text: string
}

export interface TransfersResponse {
    totalItems: number,
    approvedItems: number;
    data: any[];
}

@Component( {
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss']
} )
export class AccountComponent implements OnInit {
    @ViewChild( TreeComponent ) tree;
    public vaults: AccountNode[] = Object.assign( [], VAULTS );
    public account: AccountNode;
    public activeVault: AccountNode;
    public isGenesisAccount = false;
    public smallAmount = 1000;
    public data: AccountNode;
    public allTransfers: any[] = [];
    public transfers: any[] = [];
    public selectedTransfers: any[];
    public transfersSum = 0;
    public tab = 'previous';
    public allSelected = false;
    public message: Message;
    public isSaving = false;
    public showTable = false;
    public page = 1;
    public totalItems = 0;
    public perPage = 50;
    public totalApproved = 0;
    public allTransferSum = 0;

    private _connectedTransactions;

    constructor(
        private _apiClientService: ApiClientService,
        private route: ActivatedRoute,
    ) {
    }

    ngOnInit(): void {
        this.page = 0;
        this.totalApproved = 0;
        this.totalItems = 0;
        this.route.paramMap.subscribe( ( params ) => {
            this.reset();
            this.vaults.forEach( vault => {
                vault.to = vault.from;
                vault.toHash = vault.fromHash;
                if ( vault.from === params.get( 'address' ) ) {
                    this.activeVault = vault;
                    this.showTree();
                }
            } );
            if( !params.keys.length ) {
                this.approvedTransfers();
            }
        } );
    }

    public pageChanged( page ): void {
        this.page = page;
        if ( this.tab === 'inbound' ) {
            this.setInbound();
        }
        if ( this.tab === 'outbound' ) {
            this.setOutbound();
        }
        if ( this.tab === 'approved' ) {
            this.approvedTransfers();
        }
    }

    public perPageChanged(): void {
        this.page = 1;
        this.pageChanged( this.page );
    }

    public showTree(): void {
        this.data = null;
        this._apiClientService.get(
            'transfers'
        )
            .pipe( take( 1 ) )
            .subscribe( ( result: any ) => {

                this.allTransfers = result.data;

                let children = result.data.filter( transfer => transfer.from === this.activeVault.from );
                if ( children?.length ) {
                    this.activeVault.children = this._getChildren( children );
                    this.activeVault.children.forEach( transfer => {
                        const innerChildren = result.data.filter(
                            childTransfer => childTransfer.fromHash === transfer.toHash
                        );
                        if ( innerChildren?.length ) {
                            transfer.children = this._getChildren( innerChildren );
                        }
                    } )
                }
                this.data = Object.assign( {}, this.activeVault );
            } );
    }

    public approvedTransfers() {
        this._apiClientService.get(
            'transfers?approved=1' + '&perPage=' + this.perPage + '&page=' + this.page
        )
            .pipe( take( 1 ) )
            .subscribe( ( result: any ) => {
                this.totalItems = result.totalItems.count;
                this.totalApproved = result.approvedSum;
                this.allTransfers = result.data;
                this.allTransferSum = result.totalSum;
                this.editTransfers( this.allTransfers, 'approved' )
            } );

    }

    public selectNode( nodePair ): void {
        if ( !nodePair[0] || !nodePair[1] ) return;
        this.totalItems = 0;
        this.totalApproved = 0;
        this.page = 0;
        if ( nodePair[0] === nodePair[1] ) {
            const vault = this.vaults.find( vault => vault.fromHash === nodePair[0] );
            this.setInbound( vault );
        } else {
            this.selectedTransfers = this.allTransfers.filter( transfer =>
                transfer.fromHash === nodePair[0] && transfer.toHash === nodePair[1]
            );
            this.editTransfers( this.selectedTransfers, 'previous' );
        }
    }

    public unselectNode(): void {
        this.tree.unselect();
    }

    public selectOnlyNode( fromTo ): void {
        this.tree.selectOnlyNode( fromTo );
    }

    public selectNodes( fromTo ): void {
        this.tree.selectNodes( fromTo );
    }

    private _getChildren( children ) {

        return children.reduce(
            ( a, b ) => {
                let sum = children.filter( i => i.toHash === b.toHash )
                    .reduce(
                        ( a2, b2 ) => a2 + Math.round( ( Number( b2.amount ) ) / 1000000000 ),
                        0
                    );

                const partiallyApproved = children.filter( i => i.toHash === b.toHash ).some( i => i.approved );
                const approved = children.filter( i => i.toHash === b.toHash ).every( i => i.approved );

                if ( !a.some( i => i.toHash === b.toHash ) ) {

                    a.push( {
                        name: b.name,
                        value: sum,
                        from: b.from,
                        fromHash: b.fromHash,
                        to: b.to,
                        toHash: b.toHash,
                        approved: !!approved,
                        partiallyApproved: !approved && !!partiallyApproved,
                    } );
                }
                return a;
            },
            []
        ).filter( child => child.value > this.smallAmount );
    }

    public setFromPrevious(): void {
        this.selectNodes( [this.account.fromHash, this.account.toHash] );
        this.editTransfers( this._connectedTransactions, 'previous' );
    }

    public setInbound( account = null ): void {
        if ( account ) {
            this.account = account;
            this.isGenesisAccount = true;
        } else if ( !this.account ) {
            this.isGenesisAccount = false;
        }
        this.tab = 'inbound';
        this.selectOnlyNode( [this.account.fromHash, this.account.toHash] );
        this._apiClientService.get(
            'transfers?toHash=' + this.account.toHash + '&perPage=' + this.perPage + '&page=' + this.page
        )
            .pipe( take( 1 ) )
            .subscribe( ( result: any ) => {
                this.totalItems = result.totalItems.count;
                this.totalApproved = result.approvedSum;
                this.allTransferSum = result.totalSum;
                this.editTransfers( result.data, 'inbound' );
            } );
    }

    public setOutbound(): void {
        this.selectOnlyNode( [this.account.fromHash, this.account.toHash] );
        this.tab = 'outbound';
        this._apiClientService.get(
            'transfers?fromHash=' + this.account.toHash + '&perPage=' + this.perPage + '&page=' + this.page
        )
            .pipe( take( 1 ) )
            .subscribe( ( result: any ) => {
                this.totalItems = result.totalItems.count;
                this.totalApproved = result.approvedSum;
                this.allTransferSum = result.totalSum;
                this.editTransfers( result.data, 'outbound' );
            } );
    }

    public countSelected(): number {
        return ( this.tab !== 'previous' ? this.totalApproved : 0 ) +
            this.transfers.filter( transfer => transfer.selected )
                .reduce( ( a, b ) => a + b.amount / 1000000000, 0 );
    }

    public countApproved(): number {
        return ( this.tab !== 'previous' ? this.totalApproved : 0 )
            + this.transfers.filter( transfer => transfer.approved )
            .reduce( ( a, b ) => a + b.amount / 1000000000, 0 );
    }

    public selectAll(): void {
        if ( !this.transfers.every( transfer => transfer.selected ) ) {
            this.transfers.forEach( transfer => {
                transfer.selected = true;
            } );
            this.allSelected = true;
        } else {
            this.transfers.forEach( transfer => {
                transfer.selected = false;
            } );
            this.allSelected = false;
        }
    }

    public reset(): void {
        this._connectedTransactions = [];
        this.transfers = [];
        this.account = null;
        this.isGenesisAccount = false;
        this.showTable = false;
    }

    public editTransfers( transfers, tab ): void {
        this.isSaving = false;
        if ( !transfers && !tab ) {
            this.reset();
            return;
        }
        this.showTable = true;
        transfers.sort( this._compare );
        if ( !tab ) {
            tab = 'previous';
        }

        if ( tab === 'previous' ) {
            this.isGenesisAccount = false;
            this._connectedTransactions = transfers;
            this.account = transfers[0];
        }

        this.tab = tab;
        this.message = null;
        this.transfers = transfers;
        this.transfers.forEach( transfer => {
            transfer.selected = transfer.approved;
            this.totalApproved -= transfer.approved ? transfer.amount / 1000000000 : 0;
            if ( this.totalApproved < 0 ) {
                this.totalApproved = 0;
            }
        } );
        this.allSelected = this.transfers.every( transfer => transfer.selected );
        this.transfersSum = transfers.reduce( ( a, b ) => a + b.amount / 1000000000, 0 );
    }

    public setName( transfer ): void {

    }

    public copied( event ): void {
        event.event.className = 'far fa-clipboard text-success';
        setTimeout( () => {
            event.event.className = 'far fa-clipboard';
        }, 3000 );
    }

    public save(): void {
        this.isSaving = true;
        const approved: string = this.transfers.filter( transfer => transfer.selected ).map(
            transfer => transfer.id
        ).join( ',' );
        const declined: string = this.transfers.filter( transfer => !transfer.selected ).map(
            transfer => transfer.id
        ).join( ',' );
        this._apiClientService.post( 'transfers/approve?approvedIds=' + approved +
            '&declinedIds=' + declined, {} )
            .subscribe(
                ( result ) => {
                    this.message = {
                        type: 'success',
                        text: 'Saved successfully.',
                    }
                    this.isSaving = false;
                    this.transfers.forEach( transfer => {
                        transfer.approved = transfer.selected;
                    } );
                    this.showTree();
                },
                ( error ) => {
                    this.message = {
                        type: 'error',
                        text: 'Error updating unlock records.',
                    }
                    this.isSaving = false;
                    console.error( error );
                } );
    }

    public cancel(): void {
        this.transfers = [];
        this.showTable = false;
        this.unselectNode();
    }

    private _compare( a, b ) {
        if ( moment( a.timestamp ).isBefore( b.blockHeight ) ) {
            return -1;
        }
        if ( moment( a.timestamp ).isAfter( b.blockHeight ) ) {
            return 1;
        }
        return 0;
    }
}
