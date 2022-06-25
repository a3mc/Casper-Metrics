/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.6601428571428571, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.994, 500, 1500, "/era?id="], "isController": false}, {"data": [0.998, 500, 1500, "/era/total?eraId="], "isController": false}, {"data": [0.584, 500, 1500, "/price"], "isController": false}, {"data": [0.374, 500, 1500, "/transfersByEraId?eraId= limit=1"], "isController": false}, {"data": [0.966, 500, 1500, "/block/total?blockHeight="], "isController": false}, {"data": [0.342, 500, 1500, "/transfersByEraId?eraId= limit=100"], "isController": false}, {"data": [0.0, 500, 1500, "/block/circulating?blockHeight="], "isController": false}, {"data": [0.602, 500, 1500, "/health"], "isController": false}, {"data": [0.615, 500, 1500, "/era/circulating?eraId="], "isController": false}, {"data": [0.973, 500, 1500, "/era?timestamp="], "isController": false}, {"data": [0.669, 500, 1500, "/validators"], "isController": false}, {"data": [0.994, 500, 1500, "/era?blockHeight="], "isController": false}, {"data": [0.702, 500, 1500, "/block?blockHeight="], "isController": false}, {"data": [0.429, 500, 1500, "/transfersByEraId?eraId= limit=10"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 7000, 0, 0.0, 1932.6094285714262, 99, 13593, 487.0, 7561.700000000002, 10139.75, 10544.99, 207.88168562349657, 954.647048915303, 30.625310894485196], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["/era?id=", 500, 0, 0.0, 229.08799999999997, 100, 1022, 247.5, 316.80000000000007, 357.69999999999993, 627.97, 128.5016705217168, 94.60659414353637, 17.288243301850425], "isController": false}, {"data": ["/era/total?eraId=", 500, 0, 0.0, 239.68799999999996, 99, 547, 245.5, 365.90000000000003, 437.6499999999999, 491.9200000000001, 166.66666666666666, 36.251627604166664, 23.8876953125], "isController": false}, {"data": ["/price", 500, 0, 0.0, 689.1179999999998, 310, 1132, 672.5, 1028.8000000000002, 1070.95, 1120.99, 216.26297577854672, 47.72991457612457, 27.87764922145329], "isController": false}, {"data": ["/transfersByEraId?eraId= limit=1", 500, 0, 0.0, 2515.182000000001, 329, 12490, 924.5, 7599.9, 7704.9, 7841.87, 36.292371343543586, 30.007340699172534, 5.732989652137621], "isController": false}, {"data": ["/block/total?blockHeight=", 500, 0, 0.0, 314.5560000000002, 102, 547, 324.0, 474.60000000000014, 527.8499999999999, 544.0, 450.04500450045003, 97.57186656165617, 68.93687415616562], "isController": false}, {"data": ["/transfersByEraId?eraId= limit=100", 500, 0, 0.0, 4221.450000000006, 225, 13593, 5804.0, 7293.100000000001, 8120.099999999999, 12774.95, 32.750376629331235, 950.7773353065436, 5.237437671939477], "isController": false}, {"data": ["/block/circulating?blockHeight=", 500, 0, 0.0, 10018.719999999998, 7847, 10708, 10285.5, 10527.0, 10552.9, 10678.97, 46.66791114429718, 10.029772668937838, 7.421929688958372], "isController": false}, {"data": ["/health", 500, 0, 0.0, 910.7240000000011, 301, 1593, 906.5, 1355.0, 1431.6, 1578.8700000000001, 224.7191011235955, 47.84146769662921, 29.187148876404493], "isController": false}, {"data": ["/era/circulating?eraId=", 500, 0, 0.0, 2357.732000000006, 301, 8861, 508.0, 7607.0, 8042.099999999999, 8831.97, 42.268999915462, 9.102530063826189, 6.305923868247527], "isController": false}, {"data": ["/era?timestamp=", 500, 0, 0.0, 219.30000000000007, 99, 1033, 152.0, 320.0, 563.6499999999999, 1012.0, 133.19126265316993, 96.78972637519979, 21.461482751731488], "isController": false}, {"data": ["/validators", 500, 0, 0.0, 683.1159999999995, 402, 1289, 534.5, 1175.9, 1211.95, 1250.96, 217.48586341887776, 5406.775874021314, 29.097229773814703], "isController": false}, {"data": ["/era?blockHeight=", 500, 0, 0.0, 207.32200000000003, 101, 622, 215.5, 296.90000000000003, 319.84999999999997, 517.96, 125.53351744915892, 92.63392857142857, 18.248699551217676], "isController": false}, {"data": ["/block?blockHeight=", 500, 0, 0.0, 559.4699999999998, 127, 821, 527.5, 730.0, 746.95, 785.7800000000002, 324.04406999351914, 248.77850575178226, 47.737640756642904], "isController": false}, {"data": ["/transfersByEraId?eraId= limit=10", 500, 0, 0.0, 3891.066000000002, 101, 12888, 3468.0, 7238.500000000001, 7656.499999999999, 12722.96, 32.88608260983952, 174.51629197086294, 5.22702444669166], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 7000, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
