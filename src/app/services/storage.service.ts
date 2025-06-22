import { Injectable, effect, signal } from '@angular/core';

//import * as gConst from './gConst';
import * as gIF from '../gIF';
import * as gConst from '../gConst';

const ITEM = 'item';
//const BIND = 'bind';
const THERMOSTAT = 'thermostat';

@Injectable({
    providedIn: 'root',
})
export class StorageService {

    scrolls = signal<gIF.scroll_t[]>([
        gConst.dumyScroll
    ]);

    itemMap = signal(new Map());
    bindsMap = new Map();

    nvPropsMap = new Map();
    //nvBindsMap = new Map();

    //attrSet = signal({} as gIF.attrSet_t);
    //zclCmd = signal({} as gIF.udpZclReq_t);
    //zclRsp = signal({} as gIF.udpZclRsp_t);
    //wrBind = signal({} as gIF.hostedBind_t);

    chartData = signal({} as gIF.netItem_t);
    tempEvent = signal({} as gIF.tempEvent_t);
    pbEvent = signal({} as gIF.pbEvent_t);

    nvThermostatsMap = new Map();

    txBuf = new Uint8Array(1024);
    rwBuf = new gIF.rwBuf_t();

    constructor() {
        setTimeout(()=>{
            this.init();
        }, 100);
        this.rwBuf.wrBuf = new DataView(this.txBuf.buffer);
    }

    async init() {
        //localStorage.clear();
    }

    /***********************************************************************************************
     * fn          readAllKeys
     *
     * brief
     *
     */
    readAllKeys() {

        for(let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if(key){
                const val = JSON.parse(localStorage.getItem(key)!);
                if(key.slice(0, ITEM.length) == ITEM) {
                    this.nvPropsMap.set(key, val);
                }
                /*
                if(key.slice(0, BIND.length) == BIND) {
                    this.nvBindsMap.set(key, val);
                }
                */
                if(key.slice(0, THERMOSTAT.length) == THERMOSTAT) {
                    this.nvThermostatsMap.set(key, val);
                }
            }
        }
    }

    /***********************************************************************************************
     * fn          setItemName
     *
     * brief
     *
     */
    setItemName(name: string, keyVal: gIF.keyVal_t) {

        const key = keyVal.key;
        const item = keyVal.value;
        let nvProps = {} as gIF.nvProps_t;

        nvProps.name = name;
        nvProps.pos = item.pos;
        nvProps.style = item.style;
        nvProps.valCorr = item.valCorr;

        localStorage.setItem(key, JSON.stringify(nvProps));
        item.name = name;
        this.nvPropsMap.set(key, nvProps);
    }

    /***********************************************************************************************
     * fn          setItemStyle
     *
     * brief
     *
     */
    setItemStyle(style: gIF.ngStyle_t, keyVal: gIF.keyVal_t) {

        const key = keyVal.key;
        const item = keyVal.value;
        let nvProps = {} as gIF.nvProps_t;

        nvProps.name = item.name;
        nvProps.pos = item.pos;
        nvProps.style = style;
        nvProps.valCorr = item.valCorr;

        localStorage.setItem(key, JSON.stringify(nvProps));
        item.style = style;
        this.nvPropsMap.set(key, nvProps);
    }

    /***********************************************************************************************
     * fn          setItemCorr
     *
     * brief
     *
     */
    setItemCorr(valCorr: gIF.valCorr_t, keyVal: gIF.keyVal_t) {

        const key = keyVal.key;
        const item = keyVal.value;
        let nvProps = {} as gIF.nvProps_t;

        nvProps.name = item.name;
        nvProps.pos = item.pos;
        nvProps.style = item.style;
        nvProps.valCorr = valCorr;

        localStorage.setItem(key, JSON.stringify(nvProps));
        item.valCorr = valCorr;
        this.nvPropsMap.set(key, nvProps);
    }

    /***********************************************************************************************
     * fn          setItemPos
     *
     * brief
     *
     */
    setItemPos(pos: gIF.nsPos_t, keyVal: gIF.keyVal_t) {

        const key = keyVal.key;
        const item = keyVal.value;
        let nvProps = {} as gIF.nvProps_t;

        nvProps.name = item.name;
        nvProps.pos = pos;
        nvProps.style = item.style;
        nvProps.valCorr = item.valCorr;

        localStorage.setItem(key, JSON.stringify(nvProps));

        item.pos = pos;
        this.itemMap.update((map)=>{
            return new Map(map);
        });
    }

    /***********************************************************************************************
     * fn          delStoredItem
     *
     * brief
     *
     */
    delStoredItem(item: gIF.netItem_t) {

        const key = this.itemKey(item);

        localStorage.removeItem(key);

        this.itemMap.update((map)=>{
            map.delete(key);
            return new Map(map);
        });

        this.nvPropsMap.delete(key);
    }

    /***********************************************************************************************
     * fn          itemKey
     *
     * brief
     *
     */
    itemKey(params: any) {

        this.rwBuf.wrIdx = 0;

        this.rwBuf.write_uint16_LE(params.partNum);
        this.rwBuf.write_uint8(params.addr);
        this.rwBuf.write_uint8(params.endPoint);
        const len = this.rwBuf.wrIdx;
        let key = [];
        for (let i = 0; i < len; i++) {
            key[i] = this.txBuf[i].toString(16);
        }
        return `${ITEM}-${key.join('')}`;
    }

    /***********************************************************************************************
     * fn          setBindName
     *
     * brief
     *
     *
    setBindName(bind: gIF.hostedBind_t) {

        const key = this.bindKey(bind);
        const val: gIF.hostedBind_t = this.bindsMap.get(key);
        if(val) {
            let nvBind = {} as gIF.nvBind_t;
            nvBind.bindName = bind.name;
            localStorage.setItem(key, JSON.stringify(nvBind));
            val.name = bind.name;
            this.nvBindsMap.set(key, nvBind);
        }
    }
    */
    /***********************************************************************************************
     * fn          delStoredBinds
     *
     * brief
     *
     *
    delStoredBind(binds: gIF.hostedBind_t) {

        const key = this.bindKey(binds);

        localStorage.removeItem(key);

        this.bindsMap.delete(key);
        this.nvBindsMap.delete(key);
    }
    */
    /***********************************************************************************************
     * fn          bindsKey
     *
     * brief
     *
     *
    bindKey(bind: gIF.hostedBind_t) {

        this.rwBuf.wrIdx = 0;

        this.rwBuf.write_uint64_LE(bind.extAddr);
        this.rwBuf.write_uint8(bind.srcEP);
        this.rwBuf.write_uint16_LE(bind.clusterID);
        const len = this.rwBuf.wrIdx;
        let key = [];
        for (let i = 0; i < len; i++) {
            key[i] = this.txBuf[i].toString(16);
        }
        return `${BIND}-${key.join('')}`;
    }
    */
    /***********************************************************************************************
     * fn          setScrolls
     *
     * brief
     *
     */
    setScrolls(scrolls: gIF.scroll_t[]) {
        localStorage.setItem('scrolls', JSON.stringify(scrolls));
    }
    /***********************************************************************************************
     * fn          getScrolls
     *
     * brief
     *
     */
    getScrolls(): string {
        return (localStorage.getItem('scrolls') || '');
    }

    /***********************************************************************************************
     * fn          thermostatKey
     *
     * brief
     *
     */
    thermostatKey(addr: number, endPoint: number) {

        this.rwBuf.wrIdx = 0;

        this.rwBuf.write_uint8(addr);
        this.rwBuf.write_uint8(endPoint);
        const len = this.rwBuf.wrIdx;
        let key = [];
        for (let i = 0; i < len; i++) {
            key[i] = this.txBuf[i].toString(16);
        }
        return `${THERMOSTAT}-${key.join('')}`;
    }

    /***********************************************************************************************
     * fn          delThermostat
     *
     * brief
     *
     */
    delThermostat(thermostat: gIF.thermostat_t) {

        const key = this.thermostatKey(thermostat.addr, thermostat.endPoint);
        localStorage.removeItem(key);

        return key;
    }

    /***********************************************************************************************
     * fn          delAllThermostat
     *
     * brief
     *
     */
    delAllThermostat() {

        for(const key of this.nvThermostatsMap.keys()){
            localStorage.removeItem(key);
        }
        this.nvThermostatsMap.clear();
    }

    /***********************************************************************************************
     * fn          storeThermostat
     *
     * brief
     *
     */
    storeThermostat(thermostat: gIF.thermostat_t) {

        const key = this.thermostatKey(thermostat.addr, thermostat.endPoint);
        localStorage.setItem(key, JSON.stringify(thermostat));

        this.nvThermostatsMap.set(key, thermostat);
    }

}
