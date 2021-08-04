import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';

export interface AccountNode {
    name: string;
    value: number;
    toHash?: string;
    to?: string;
    fromHash?: string;
    from?: string;
    approved?: boolean;
    partiallyApproved?: boolean;
    children?: Array<AccountNode>;
}

@Component( {
    selector: 'app-tree',
    templateUrl: './tree.component.html',
    styleUrls: ['./tree.component.scss']
} )
export class TreeComponent implements OnInit {
    @ViewChild( 'chart', { static: true } ) private chartContainer: ElementRef;
    @Output( 'selectedNode' ) selectedNode = new EventEmitter<any>();

    @Input( 'data' )
    set data( value: AccountNode ) {
        this._data = Object.assign( {}, value );
        this.renderTreeChart();
    };

    public root: any;
    public height: number;
    public width: number;

    private _data: AccountNode;
    private tree: any;
    private svg: any;
    private treeData: any;
    private margin: any = { top: 1000, bottom: 0, left: 120, right: 0 };
    private duration: number = 0;
    private nodeWidth: number = 5;
    private nodeHeight: number = 5;
    private horizontalSeparationBetweenNodes: number = 4;
    private verticalSeparationBetweenNodes: number = 25;
    private nodes: any[];
    private links: any;

    constructor() {
    }

    ngOnInit(): void {
    }

    public renderTreeChart() {
        if ( !this._data.name ) return;
        this.root = d3.hierarchy( this._data, ( d ) => {
            return d.children;
        } );

        let element: any = this.chartContainer.nativeElement;
        this.width = element.offsetWidth - this.margin.left - this.margin.right;
        this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

        this.svg = d3.select( element ).append( 'svg' )
            .attr( 'width', element.offsetWidth )
            .attr( 'height', element.offsetHeight )
            .append( 'g' )
            .attr( 'transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')' );

        this.tree = d3.tree()
            .size( [this.height, this.width] )
            .nodeSize( [this.nodeWidth + this.horizontalSeparationBetweenNodes, this.nodeHeight + this.verticalSeparationBetweenNodes] )
            .separation( ( a, b ) => {
                return a.parent == b.parent ? 4 : 8
            } );

        this.root.x0 = this.height / 2;
        this.root.y0 = 10;
        this.updateChart( this.root );

        setTimeout( () => {
            // @ts-ignore
            const svgHeight = 100 + document.querySelector( '.tree svg g' ).getBBox().height;
            this.height = svgHeight;
            document.querySelector( '.tree svg g' ).setAttribute( 'transform', 'translate(120,' + svgHeight / 2 + ')' );
            // @ts-ignore
            document.querySelector( '.tree svg' ).style.height = ( svgHeight + 100 ) + 'px';
        }, 100 );
    }

    private _click( event: any, d: any ) {
        const fromTo = event.target.parentNode.className.baseVal.split( ' ' )[1]
            .substr( 5 ).split( ';' );

        this.selectNodes( fromTo );
        this.selectedNode.emit( fromTo );
    }

    public selectNodes( fromTo ): void {
        this.svg.selectAll( 'circle' )
            .style( 'opacity', 0.5 )
            .style( 'fill', ( d ) => {
                return d.data.approved ? '#38eb5b' : ( d.data.partiallyApproved ? '#c6eb38' : '#fff' );
            } );

        this.svg.select( 'circle.to' + fromTo[0] )
            .style( 'opacity', 1 );

        this.svg.select( 'circle.from' + fromTo[0] + '.to' + fromTo[1] )
            .style( 'fill', 'rgb(76, 174, 255)' )
            .style( 'opacity', 1 );

        this.svg.selectAll( 'path' )
            .style( 'opacity', 0.5 )
            .style( 'stroke', '#ccc' );

        this.svg.selectAll( 'text' )
            .style( 'opacity', 0.5 );

        this.svg.selectAll( '.' + fromTo[0] + '_' + fromTo[1] )
            .style( 'stroke', '#4a9ee4' )
            .style( 'opacity', 1 );
    }

    public unselect(): void {
        this.svg.selectAll( 'circle' )
            .style( 'fill', ( d ) => {
                return d.data.approved ? '#38eb5b' : ( d.data.partiallyApproved ? '#c6eb38' : '#fff' );
            } )
            .style( 'opacity', 1 );

        this.svg.selectAll( 'path' )
            .style( 'opacity', 1 )
            .style( 'stroke', '#ccc' );

        this.svg.selectAll( 'text' )
            .style( 'opacity', 1 );
    }

    public selectOnlyNode( fromTo ): void {
        this.svg.selectAll( '.' + fromTo[0] + '_' + fromTo[1] )
            .style( 'stroke', '#ccc' )
            .style( 'opacity', 0.5 );

        if ( fromTo[0] !== fromTo[1] ) {
            this.svg.selectAll( 'circle' )
                .style( 'opacity', 0.5 );

            this.svg.select( 'circle.from' + fromTo[0] + '.to' + fromTo[1] )
                .style( 'opacity', 1 );
        }
    }

    private updateChart( source ) {
        let i = 0;
        this.treeData = this.tree( this.root );
        this.nodes = this.treeData.descendants();
        this.links = this.treeData.descendants().slice( 1 );
        this.nodes.forEach( ( d ) => {
            d.y = d.depth * 180
        } );

        let node = this.svg.selectAll( 'g.node' )
            .attr( 'id', ( d ) => {
                return d.id || ( d.id = ++i );
            } )
            .data( this.nodes, ( d ) => {
                return d.id || ( d.id = ++i );
            } );

        let nodeEnter = node.enter().append( 'g' )
            .attr( 'class', ( d ) => {
                return 'node _node' + d.data.fromHash + ';' + d.data.toHash;
            } )
            .attr( 'transform', ( d ) => {
                return 'translate(' + source.x0 + ',' + source.y0 + ')';
            } )
            .on( 'click', ( event, d ) => {
                this._click( event, d );
            } );

        nodeEnter.append( 'circle' )
            .attr( 'class', ( d ) => {
                return 'to' + d.data.toHash + ' from' + d.data.fromHash
            } )
            .attr( 'r', 0.0000010 )
            .style( 'fill', ( d ) => {
                return d._children ? 'lightsteelblue' : '#fff';
            } );

        nodeEnter.append( 'text' )
            .attr( 'dy', '.35em' )
            .attr( 'x', ( d ) => {
                return d.depth > 0 ? 15 : -15;
            } )
            .attr( 'text-anchor', ( d ) => {
                return d.depth > 0 ? 'start' : 'end';
            } )
            .style( 'font', '11px sans-serif' )
            .style( 'text-shadow', ' 1px 1px 2px #c4c4c4' )
            .html( ( d ) => {
                if ( d.data.name ) {
                    return d.data.name;
                }
                if ( d.data.to ) {
                    return d.data.to.substr( 0, 4 ) + '&hellip;' + d.data.to.substr( -4, 4 );
                }

                return '#' + d.data.toHash.substr( 14, 4 ) + '&hellip;' +
                    d.data.toHash.substr( -4, 4 );
            } );

        nodeEnter.append( 'text' )
            .attr( 'dy', '.35em' )
            .attr( 'x', ( d ) => {
                return -15;
            } )
            .attr( 'text-anchor', ( d ) => {
                return 'end';
            } )
            .style( 'font-family', 'sans-serif' )
            .style( 'font-size', '11px' )
            .style( 'font-weight', 'bold' )
            .style( 'text-shadow', ' 1px 1px 2px #c4c4c4' )
            .style( 'fill', '#19781e' )
            .html( ( d ) => {
                const value = d.data.value;
                if ( !value ) return '';
                if ( value < 1000 ) {
                    return '+' + value.toFixed( ( Math.round( value / 10 ) !== value / 10 ) ? 1 : 0 );
                }
                if ( value < 100000 ) {
                    return '+' + ( value / 1000 ).toFixed(
                        Math.round( value / 10000 ) !== Math.round( value / 1000 ) / 10 ? 1 : 0
                    ) + 'K';
                }
                return '+' + ( value / 1000000 ).toFixed(
                    Math.round( value / 100000 ) !== Math.round( value / 10000 ) / 10 ? 1 : 0
                ) + 'M';
            } );

        let nodeUpdate = nodeEnter.merge( node );

        nodeUpdate.transition()
            .duration( this.duration )
            .attr( 'transform', ( d ) => {
                return 'translate(' + d.y + ',' + d.x + ')';
            } );

        nodeUpdate.select( 'circle' )
            .attr( 'r', 10 )
            .style( 'stroke-width', '2px' )
            .style( 'stroke', 'steelblue' )
            .style( 'fill', ( d ) => {
                return d.data.approved ? '#38eb5b' : ( d.data.partiallyApproved ? '#c6eb38' : '#fff' );
            } )
            .attr( 'cursor', 'pointer' );

        let nodeExit = node.exit().transition()
            .duration( this.duration )
            .attr( 'transform', ( d ) => {
                return 'translate(' + source.y + ',' + source.x + ')';
            } )
            .remove();

        nodeExit.select( 'circle' )
            .attr( 'r', 1e-6 );

        nodeExit.select( 'text' )
            .style( 'fill-opacity', 1e-6 );

        let link = this.svg.selectAll( 'path.link' )
            .data( this.links, ( d ) => {
                return d.id;
            } );

        let linkEnter = link.enter().insert( 'path', 'g' )
            .attr( 'class', function ( d ) {
                return d.data.fromHash + '_' + d.data.toHash
            } )
            .style( 'fill', 'none' )
            .style( 'stroke', '#ccc' )
            .style( 'stroke-width', '2px' )
            .attr( 'd', function ( d ) {
                let o = { x: source.x0, y: source.y0 };
                return diagonal( o, o );
            } );

        let linkUpdate = linkEnter.merge( link );

        linkUpdate.transition()
            .duration( this.duration )
            .attr( 'd', ( d ) => {
                return diagonal( d, d.parent );
            } );

        let linkExit = link.exit().transition()
            .duration( this.duration )
            .attr( 'd', function ( d ) {
                let o = { x: source.x, y: source.y };
                return diagonal( o, o );
            } )
            .remove();

        this.nodes.forEach( ( d ) => {
            d.x0 = d.x;
            d.y0 = d.y;
        } );

        function diagonal( s, d ) {
            let path = `M ${ s.y } ${ s.x }
                  C ${ ( s.y + d.y ) / 2 } ${ s.x },
                  ${ ( s.y + d.y ) / 2 } ${ d.x },
                  ${ d.y } ${ d.x }`;
            return path;
        }
    }

}
