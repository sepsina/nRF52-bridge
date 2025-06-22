import {
    Component,
    OnInit,
    signal,
    inject,
    effect,
    ChangeDetectionStrategy
} from '@angular/core';

import {
    DialogRef,
    DIALOG_DATA} from '@angular/cdk/dialog';

import { StorageService } from '../services/storage.service';
import { UtilsService } from '../services/utils.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragHandle} from '@angular/cdk/drag-drop';

import Chart from 'chart.js/auto'

import * as gConst from '../gConst';
import * as gIF from '../gIF'

const NO_TIME = 'time: --:--:--';
const NO_VALUE = 'value: --.-';

@Component({
    selector: 'app-graph',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './graph.html',
    styleUrls: ['./graph.scss'],
    host: {
        '[attr.id]': 'hostID',
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Graph implements OnInit {

    hostID = 'graph-dlg';

    selItem = {} as gIF.netItem_t;
    selIdx = -1;
    selTime = signal(NO_TIME);
    selValue = signal(NO_VALUE);

    duration = signal('');

    chart: any;

    utils = inject(UtilsService);
    storage = inject(StorageService);
    dialogRef = inject(DialogRef);
    dlgData = inject(DIALOG_DATA);

    chart_data = effect(()=>{
        const attr = this.storage.chartData();
        setTimeout(()=>{
            this.newData(attr);
        }, 0);
    })

    constructor() {
        // ---
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit() {

        this.selItem = this.dlgData.keyVal.value;

        this.createChart();
        this.setChartData();
    }

    /***********************************************************************************************
     * fn          createChart
     *
     * brief
     *
     */
    createChart() {

        this.chart = new Chart('canvas', {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        data: [],
                        fill: false,
                        borderColor: 'black',
                        pointHoverRadius: 6,
                        pointHitRadius: 20,
                        pointBorderColor: 'rgba(0, 0, 0, 0)',
                        pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                        pointHoverBackgroundColor: 'yellow',
                        pointHoverBorderColor: 'red'
                    },
                ]
            },
            options: {
                responsive: true,
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    x: {
                        border: {
                            color: 'lightgray'
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            autoSkip: false,
                            display: false,
                            maxRotation: 0,
                            font: {
                                size: 14,
                            }
                        }
                    },
                    y: {
                        position: 'right',
                        min: 0,
                        max: 1,
                        border: {
                            dash: [8, 4],
                            color: 'lightgray'
                        },
                        grid: {
                            color: 'lightgray',
                            display: true,
                        },
                        ticks:{
                            stepSize: 1,
                            font: {
                                size: 14,
                            }
                        },
                    }
                },
                animation: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        displayColors: false,
                    },
                },
                onClick: (event, elements, chart)=>{
                    if(elements[0]){
                        this.selIdx = elements[0].index;
                        const time = chart.data.labels![this.selIdx];
                        const value: any = chart.data.datasets[0].data[this.selIdx];
                        this.selTime.set(`time: ${time}`);
                        this.selValue.set(`value: ${value.toFixed(1)}`);
                    }
                    else {
                        this.selIdx = -1;
                        this.selTime.set(NO_TIME);
                        this.selValue.set(NO_VALUE);
                    }
                }
            },
        });
    }

    /***********************************************************************************************
     * fn          setChartData
     *
     * brief
     *
     */
    setChartData() {

        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];

        const len = this.selItem.timestamps.length;
        const end = this.selItem.timestamps[len-1];
        let minVal = 1e6;
        let maxVal = -1e6;
        let corrVal = 0;
        let offset = this.selItem.valCorr.offset;
        for(let i = 0; i < len; i++){
            corrVal = this.selItem.vals[i] + offset;
            switch(this.selItem.partNum){
                case gConst.SHT40_018_T:
                case gConst.SI7021_027_T:
                case gConst.HTU21D_005_T: {
                    if(this.selItem.valCorr.units == gConst.DEG_F){
                        corrVal = (corrVal * 9.0) / 5.0 + 32.0;
                    }
                    break;
                }
            }
            this.chart.data.datasets[0].data[i] = corrVal;
            this.chart.data.labels[i] = this.utils.secToTime(end - this.selItem.timestamps[i]);
            if(corrVal > maxVal){
                maxVal = corrVal;
            }
            if(corrVal < minVal){
                minVal = corrVal;
            }
        }
        const timeSpan = this.selItem.timestamps[len - 1] - this.selItem.timestamps[0];
        this.duration.set(`${this.utils.secToTime(timeSpan)}`);

        let step = 1;
        let max = Math.ceil(maxVal);
        if((max - maxVal) < 0.1){
            max++;
        }
        let min = max;
        while(min >= minVal){
            min--;
        }
        if(maxVal > minVal){
            step = Math.ceil((maxVal - minVal) / 4);
            max = Math.ceil(maxVal);
            if((max - maxVal) < 0.1){
                max += step;
            }
            min = max;
            while(min >= minVal){
                min -= step;
            }
        }
        this.chart.options.scales.y.max = max;
        this.chart.options.scales.y.min = min;
        this.chart.options.scales.y.ticks.stepSize = step;

        switch(this.selItem.partNum){
            case gConst.SI7021_027_T:
            case gConst.SHT40_018_T:
            case gConst.HTU21D_005_T: {
                this.chart.data.datasets[0].tension = 0.2;
                this.chart.data.datasets[0].borderColor = 'red';
                let unit = 'degC';
                if(this.selItem.valCorr.units == gConst.DEG_F){
                    unit = 'degF';
                }
                this.chart.options.plugins.tooltip.callbacks = {
                    title: (tooltipItem: any) => {
                        return tooltipItem[0].label;
                    },
                    label: (tooltipItem: any) => {
                        const yVal = tooltipItem.dataset.data[tooltipItem.dataIndex];
                        var tooltipText = '';
                        if(yVal != null) {
                            tooltipText = `${yVal.toFixed(1)} ${unit}`;
                        }
                        return tooltipText;
                    }
                }
                break;
            }
            case gConst.SI7021_027_RH:
            case gConst.SHT40_018_RH:
            case gConst.HTU21D_005_RH: {
                this.chart.data.datasets[0].tension = 0.2;
                this.chart.data.datasets[0].borderColor = 'green';
                this.chart.options.plugins.tooltip.callbacks = {
                    title: (tooltipItem: any) => {
                        return tooltipItem[0].label;
                    },
                    label: (tooltipItem: any) => {
                        const yVal = tooltipItem.dataset.data[tooltipItem.dataIndex];
                        var tooltipText = '';
                        if(yVal != null) {
                            tooltipText = `${yVal.toFixed(0)} %rh`;
                        }
                        return tooltipText;
                    }
                }
                break;
            }
            case gConst.ENS_015_AQ: {
                this.chart.options.scales.y.max = 5;
                this.chart.options.scales.y.min = 1;
                this.chart.options.scales.y.ticks.stepSize = 1;
                this.chart.data.datasets[0].borderColor = 'green';
                this.chart.options.plugins.tooltip.callbacks = {
                    title: (tooltipItem: any) => {
                        return tooltipItem[0].label;
                    },
                    label: (tooltipItem: any) => {
                        const yVal = tooltipItem.dataset.data[tooltipItem.dataIndex];
                        var tooltipText = '';
                        if(yVal != null) {
                            tooltipText = `aq - ${yVal.toFixed(0)}`;
                        }
                        return tooltipText;
                    }
                }
                break;
            }
            case gConst.SSR_009_RELAY: {
                this.chart.options.scales.y.max = 1;
                this.chart.options.scales.y.min = 0;
                this.chart.options.scales.y.ticks.stepSize = 1;
                this.chart.data.datasets[0].borderColor = 'black';
                this.chart.options.plugins.tooltip.callbacks = {
                    title: (tooltipItem: any) => {
                        return tooltipItem[0].label;
                    },
                    label: (tooltipItem: any) => {
                        const yVal = tooltipItem.dataset.data[tooltipItem.dataIndex];
                        let tooltipText = 'off';
                        if(yVal != null) {
                            if(yVal == 1){
                                tooltipText = 'on';
                            }
                        }
                        return tooltipText;
                    }
                }
                break;
            }
        }
        setTimeout(() => {
            this.chart?.update('none');
        }, 0);

    }
    /***********************************************************************************************
     * fn          close
     *
     * brief
     *
     */
    close() {
        this.dialogRef.close();
    }



    /***********************************************************************************************
     * fn          delSelPoint
     *
     * brief
     *
     */
    delSelPoint() {

        if(this.selIdx < 0){
            return;
        }
        this.selItem.vals.splice(this.selIdx, 1);
        this.selItem.timestamps.splice(this.selIdx, 1);
        this.selIdx = -1;
        this.selTime.set(NO_TIME);
        this.selValue.set(NO_VALUE);

        this.setChartData();
    }

    /***********************************************************************************************
     * fn          newData
     *
     * brief
     *
     */
    newData(item: gIF.netItem_t) {

        if(item.addr == this.selItem.addr){
            if(item.endPoint == this.selItem.endPoint){
                if(item.group == this.selItem.group){
                    if(item.type == this.selItem.type){
                        this.selIdx = -1;
                        this.selTime.set(NO_TIME);
                        this.selValue.set(NO_VALUE);

                        this.setChartData();
                    }
                }
            }
        }
    }

}
