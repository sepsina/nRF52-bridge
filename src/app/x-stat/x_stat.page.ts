import {
    Component,
    AfterViewInit,
    signal,
    inject,
    ChangeDetectionStrategy
} from '@angular/core';

import {
    DialogRef,
    DIALOG_DATA
} from '@angular/cdk/dialog';

import { StorageService } from '../services/storage.service';
import { UtilsService } from '../services/utils.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragHandle} from '@angular/cdk/drag-drop';

import * as gConst from '../gConst';
import * as gIF from '../gIF'

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './x_stat.page.html',
    styleUrls: ['./x_stat.page.scss'],
    host: {
        '[attr.id]': 'hostID',
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditStats implements AfterViewInit{

    hostID = 'x-stat-dlg';

    minSetPoint = 5
    maxSetPoint = 50;

    m_stat_sel = signal('0');
    m_set_point = signal('20');
    m_used_sel = signal('0');
    m_free_sel = signal('0');

    thermostatDesc = signal<gIF.descVal_t[]>([]);
    usedDesc = signal<gIF.descVal_t[]>([]);
    freeDesc = signal<gIF.descVal_t[]>([]);

    selThermostat = {} as gIF.thermostat_t;
    thermostats = signal<gIF.thermostat_t[]>([]);

    on_off_all: gIF.on_off_actuator_t[] = [];
    on_off_used = signal<gIF.on_off_actuator_t[]>([]);
    on_off_free = signal<gIF.on_off_actuator_t[]>([]);

    selUsed = {} as gIF.on_off_actuator_t;
    selFree = {} as gIF.on_off_actuator_t;

    validStat = true;

    storage = inject(StorageService);
    utils = inject(UtilsService);
    dialogRef = inject(DialogRef);
    dlgData = inject(DIALOG_DATA);

    constructor() {
         // ---
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngAfterViewInit(){

        let netItems: gIF.netItem_t[] = [...this.storage.itemMap().values()];

        const t_stats = [];

        for(const item of netItems){
            if(item.group === gIF.eGroup_t.E_GROUP_TEMPERATURE){
                let thermostat = {} as gIF.thermostat_t;
                thermostat.name = item.name;
                thermostat.partNum = item.partNum;
                thermostat.addr = item.addr;
                thermostat.endPoint = item.endPoint;
                thermostat.hysteresis = gConst.THERMOSTAT_HYSTERESIS;
                thermostat.actuators = [];
                const key = this.storage.thermostatKey(item.addr, item.endPoint);
                const nvThermostat: gIF.thermostat_t = this.storage.nvThermostatsMap.get(key);
                if(nvThermostat){
                    thermostat.setPoint = nvThermostat.setPoint;
                    thermostat.prevSetPoint = nvThermostat.prevSetPoint;
                    thermostat.workPoint = nvThermostat.workPoint;
                    thermostat.actuators = [...nvThermostat.actuators];
                }
                else {
                    thermostat.setPoint = 20.0;
                    thermostat.prevSetPoint = 0;
                    thermostat.workPoint = 20.0;
                    thermostat.actuators = [];
                }
                t_stats.push(thermostat);
            }
            if(item.group == gIF.eGroup_t.E_GROUP_ON_OFF){
                if(item.type === gIF.eType_t.E_TYPE_ACUATOR){
                    let on_off_actuator = {} as gIF.on_off_actuator_t;
                    on_off_actuator.valid = true;
                    on_off_actuator.name = item.name;
                    on_off_actuator.partNum = item.partNum;
                    on_off_actuator.addr = item.addr;
                    on_off_actuator.endPoint = item.endPoint;
                    this.on_off_all.push(on_off_actuator);
                }
            }
        }

        this.storage.delAllThermostat();

        if(t_stats.length > 0){
            this.validStat = true;
            this.thermostats.set(t_stats);
            for(const stat of t_stats){
                this.storage.storeThermostat(stat);
            }
        }
        else {
            this.validStat = false;
            this.thermostats.set([
                gConst.invalidStat
            ]);
            this.on_off_all = [];
        }
        this.statSelect('0');
    }

    /***********************************************************************************************
     * fn          statSelected
     *
     * brief
     *
     */
    statSelect(idx: string){

        this.m_stat_sel.set(idx);

        const i = parseInt(idx);
        this.selThermostat = this.thermostats()[i];

        this.setThermostat(this.selThermostat);
        this.setThermostatDesc(this.selThermostat);

        this.m_set_point.set(`${this.selThermostat.setPoint}`);
    }

    /***********************************************************************************************
     * fn          setThermostat
     *
     * brief
     *
     */
    setThermostat(thermostat: gIF.thermostat_t){

        let used_actuators: gIF.on_off_actuator_t[] = [];
        let free_actuators: gIF.on_off_actuator_t[] = [...this.on_off_all];

        for(const actuator of thermostat.actuators){
            let idx = free_actuators.length;
            while(idx--){
                if(free_actuators[idx].addr === actuator.addr){
                    if(free_actuators[idx].endPoint === actuator.endPoint){
                        const used = free_actuators.splice(idx, 1)[0];
                        used_actuators.push(used);
                    }
                }
            }
        }
        this.on_off_used.set(used_actuators);
        this.on_off_free.set(free_actuators);

        this.setActuators();
        if(this.validStat == true){
            this.saveActuators(thermostat, used_actuators);
        }
    }

    /***********************************************************************************************
     * fn          setActuators
     *
     * brief
     *
     */
    setActuators(){

        if(this.on_off_used().length == 0){
            this.on_off_used.set([
                gConst.dummyOnOff
            ]);
        }
        if(this.on_off_free().length == 0){
            this.on_off_free.set([
                gConst.dummyOnOff
            ]);
        }
        this.setUsed(0);
        this.setFree(0);
    }

    /***********************************************************************************************
     * fn          onFreeSelect
     *
     * brief
     *
     */
    onUsedSelect(idx: string){

        this.m_used_sel.set(idx);

        const i = parseInt(idx);
        this.selUsed = this.on_off_used()[i];
        this.setUsedDesc(this.selUsed);
    }

    /***********************************************************************************************
     * fn          setUsed
     *
     * brief
     *
     */
    setUsed(idx: number){

        this.selUsed = this.on_off_used()[idx];
        this.setUsedDesc(this.selUsed);

        this.m_used_sel.set(`${idx}`);
    }

    /***********************************************************************************************
     * fn          onFreeSelect
     *
     * brief
     *
     */
    onFreeSelect(idx: string){

        this.m_free_sel.set(idx);

        const i = parseInt(idx);
        this.selFree = this.on_off_free()[i];
        this.setFreeDesc(this.selFree);
    }

    /***********************************************************************************************
     * fn          setFree
     *
     * brief
     *
     */
    setFree(idx: number){

        this.selFree = this.on_off_free()[idx];
        this.setFreeDesc(this.selFree);

        this.m_free_sel.set(`${idx}`);
    }

    /***********************************************************************************************
     * fn          setThermostatDesc
     *
     * brief
     *
     */
    setThermostatDesc(thermostat: gIF.thermostat_t){

        const desc_vals: gIF.descVal_t[] = [];
        let partDesc: gIF.part_t = this.dlgData.partsMap.get(thermostat.partNum);
        if(partDesc){
            let descVal = {} as gIF.descVal_t;
            descVal.key = 'node:';
            descVal.value = partDesc.devName;
            desc_vals.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'label:';
            descVal.value = partDesc.part;
            desc_vals.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'address:';
            descVal.value = thermostat.addr.toString(10).padStart(3, '0');
            desc_vals.push(descVal);

            this.thermostatDesc.set(desc_vals);
        }
        else {
            this.thermostatDesc.set(gConst.dummyDesc);
        }
    }

    /***********************************************************************************************
     * fn          setUsedDesc
     *
     * brief
     *
     */
    setUsedDesc(onOff: gIF.on_off_actuator_t){

        const desc_vals: gIF.descVal_t[] = [];
        let partDesc: gIF.part_t = this.dlgData.partsMap.get(onOff.partNum);
        if(partDesc){
            let descVal = {} as gIF.descVal_t;
            descVal.key = 'node:';
            descVal.value = partDesc.devName;
            desc_vals.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'label:';
            descVal.value = partDesc.part;
            desc_vals.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'address:';
            descVal.value = onOff.addr.toString(10).padStart(3, '0');
            desc_vals.push(descVal);
            this.usedDesc.set(desc_vals);
        }
        else {
            this.usedDesc.set(gConst.dummyDesc);
        }
    }

    /***********************************************************************************************
     * fn          setFreeDesc
     *
     * brief
     *
     */
    setFreeDesc(onOff: gIF.on_off_actuator_t){

        const desc_vals: gIF.descVal_t[] = [];
        let partDesc: gIF.part_t = this.dlgData.partsMap.get(onOff.partNum);
        if(partDesc){
            let descVal = {} as gIF.descVal_t;
            descVal.key = 'node:';
            descVal.value = partDesc.devName;
            desc_vals.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'label:';
            descVal.value = partDesc.part;
            desc_vals.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'address:';
            descVal.value = onOff.addr.toString(10).padStart(3, '0');
            desc_vals.push(descVal);

            this.freeDesc.set(desc_vals);
        }
        else {
            this.freeDesc.set(gConst.dummyDesc);
        }
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
     * @fn          saveActuators
     *
     * @brief
     *
     */
    saveActuators(thermostat: gIF.thermostat_t, actuators: gIF.on_off_actuator_t[]) {

        thermostat.actuators = [];
        if(this.on_off_used()[0].valid == true){
            for(const on_off of actuators){
                const actuator = {} as gIF.thermostatActuator_t;
                actuator.name = on_off.name;
                actuator.addr = on_off.addr;
                actuator.endPoint = on_off.endPoint;
                thermostat.actuators.push(actuator);
            }
        }
        this.storage.storeThermostat(thermostat);
    }

    /***********************************************************************************************
     * fn          onSetPointChange
     *
     * brief
     *
     */
    onSetPointChange(newVal: string){

        this.m_set_point.set(newVal);
    }

    /***********************************************************************************************
     * fn          onSetPointBlur
     *
     * brief
     *
     */
    onSetPointBlur(){

        let set_point = parseInt(this.m_set_point());

        if(set_point == this.selThermostat.setPoint){
            return;
        }

        if(Number.isNaN(set_point) || (set_point < this.minSetPoint)){
            this.m_set_point.set(`${this.selThermostat.setPoint}`);
            return;
        }
        if(set_point > this.maxSetPoint){
            set_point = this.maxSetPoint;
        }
        console.log(`new set point: ${set_point}`);

        this.selThermostat.setPoint = set_point;
        this.thermostats.update((stats)=>{
            return [...stats];
        });
        this.storage.storeThermostat(this.selThermostat);

        this.m_set_point.set(`${set_point}`);
    }

    /***********************************************************************************************
     * fn          addActuator
     *
     * brief
     *
     */
    addActuator(){

        if(this.on_off_free()[0].valid == true){
            const idx = parseInt(this.m_free_sel());
            const act: gIF.on_off_actuator_t = this.on_off_free().splice(idx, 1)[0];

            if(this.on_off_free().length == 0){
                this.on_off_free.set([
                    gConst.dummyOnOff
                ]);
            }
            this.setFree(0);

            if(this.on_off_used()[0].valid == false){
                this.on_off_used.set([]);
            }
            this.on_off_used.update((used)=>{
                used.push(act);
                return [...used];
            });

            const lastIdx = this.on_off_used().length - 1;
            this.setUsed(lastIdx);

            this.saveActuators(this.selThermostat, this.on_off_used());
        }
    }

    /***********************************************************************************************
     * fn          delActuator
     *
     * brief
     *
     */
    delActuator(){

        if(this.on_off_used()[0].valid == true){
            const idx = parseInt(this.m_used_sel());
            const act: gIF.on_off_actuator_t = this.on_off_used().splice(idx, 1)[0];

            if(this.on_off_used().length == 0){
                this.on_off_used.set([
                    gConst.dummyOnOff
                ]);
            }
            this.setUsed(0);

            if(this.on_off_free()[0].valid == false){
                this.on_off_free.set([]);
            }
            this.on_off_free.update((free)=>{
                free.push(act);
                return [...free];
            });
            const lastIdx = this.on_off_free().length - 1;
            this.setFree(lastIdx);

            this.saveActuators(this.selThermostat, this.on_off_used());
        }
    }
}
