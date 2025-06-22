import {
    Component,
    ElementRef,
    AfterViewInit,
    OnInit,
    viewChild,
    inject,
    signal,
    ChangeDetectionStrategy
} from '@angular/core';

import {
    DialogRef,
    DIALOG_DATA
} from '@angular/cdk/dialog';

import { StorageService } from '../services/storage.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragHandle} from '@angular/cdk/drag-drop';

import * as gConst from '../gConst';
import * as gIF from '../gIF'


@Component({
    selector: 'app-set-corr',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './set-corr.html',
    styleUrls: ['./set-corr.scss'],
    host: {
        '[attr.id]': 'hostID'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetCorr implements AfterViewInit {

    hostID = 'corr-dlg';

    offsetRef = viewChild.required('offset', {read: ElementRef});

    allUnits = signal<gIF.units_t[]>([]);
    selUnit = {} as gIF.units_t;
    unitIdx = '';
    prevIdx = 0;
    title = signal('');

    valCorr = {} as gIF.valCorr_t;
    item = {} as gIF.netItem_t;

    m_unit_sel = signal('');
    m_offset = signal('');

    offset = 0;

    storage = inject(StorageService);
    dialogRef = inject(DialogRef);
    dlgData = inject(DIALOG_DATA);

    constructor() {
        // ---
    }

    /***********************************************************************************************
     * @fn          ngAfterViewInit
     *
     * @brief
     *
     */
    ngAfterViewInit(): void {

        this.item = this.dlgData.keyVal.value;
        this.title.set(this.item.name);

        this.valCorr = {...this.item.valCorr};
        let offset = this.valCorr.offset; // degC

        switch(this.item.group){
            case gIF.eGroup_t.E_GROUP_TEMPERATURE: {
                const units = [
                    {name: 'degC', units: gConst.DEG_C},
                    {name: 'degF', units: gConst.DEG_F}
                ];
                this.allUnits.set(units);
                if(this.item.valCorr.units == gConst.DEG_F){
                    this.prevIdx = 1;
                    this.unitIdx = '1';
                    this.selUnit = this.allUnits()[1];
                    offset = offset * 9.0 / 5.0; // degC to degF
                    offset = Math.round(offset * 10) / 10;
                }
                if(this.item.valCorr.units == gConst.DEG_C){
                    this.prevIdx = 0;
                    this.unitIdx = '0';
                    this.selUnit = this.allUnits()[0];
                }
                break;
            }
            case gIF.eGroup_t.E_GROUP_HUMIDITY: {
                const units = [
                    {name: '%', units: gConst.RH_UNIT}
                ];
                this.allUnits.set(units);
                this.unitIdx = '0';
                this.selUnit = this.allUnits()[0];
                break;
            }
        }
        this.offset = offset;
        this.m_offset.set(`${offset}`);
        this.m_unit_sel.set(this.unitIdx);

        setTimeout(() => {
            this.offsetRef().nativeElement.focus();
            this.offsetRef().nativeElement.select();
        }, 0);
    }

    /***********************************************************************************************
     * @fn          save
     *
     * @brief
     *
     */
    async save() {

        let offset = parseFloat(this.m_offset());

        if(this.selUnit.units == gConst.DEG_F){
            offset = offset * 5.0 / 9.0; // degF to degC
            offset = Math.round(offset * 10) / 10;
        }

        this.valCorr.units = this.selUnit.units;
        this.valCorr.offset = offset;

        console.log(this.valCorr);

        this.storage.setItemCorr(this.valCorr, this.dlgData.keyVal);
        this.dialogRef.close();
    }

    /***********************************************************************************************
     * @fn          close
     *
     * @brief
     *
     */
    close() {
        this.dialogRef.close();
    }

    /***********************************************************************************************
     * @fn          unitSelect
     *
     * @brief
     *
     */
    unitSelect(idx: string){

        this.m_unit_sel.set(idx);

        const i = parseInt(idx);
        this.selUnit = this.allUnits()[i];
        const prevUnits = this.allUnits()[this.prevIdx];
        this.prevIdx = i;
        let offset = parseFloat(this.m_offset());

        if(this.selUnit.units == gConst.DEG_F){
            if(prevUnits.units == gConst.DEG_C){
                offset = offset * 9.0 / 5.0; // degC to degF
                offset = Math.round(offset * 10) / 10;
            }
        }
        if(this.selUnit.units == gConst.DEG_C){
            if(prevUnits.units == gConst.DEG_F){
                offset = offset * 5.0 / 9.0; // degF to degC
                offset = Math.round(offset * 10) / 10;
            }
        }
        this.offset = offset;
        this.m_offset.set(`${offset}`);
    }

     /***********************************************************************************************
     * fn          onOffsetChange
     *
     * brief
     *
     */
    onOffsetChange(newVal: string){

        this.m_offset.set(newVal);
    }

    /***********************************************************************************************
     * fn          onOffsetBlur
     *
     * brief
     *
     */
    onOffsetBlur(){

        let offset = parseFloat(this.m_offset());

        if(Number.isNaN(offset)){
            this.m_offset.set(`${this.offset}`);
            return;
        }
        offset = Math.round(offset * 10) / 10;
        console.log(`new offset: ${offset}`);
        this.offset = offset;

        this.m_offset.set(`${offset}`);
    }


}
