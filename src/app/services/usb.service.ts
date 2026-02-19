/// <reference types="w3c-web-usb" />
// npm i @types/w3c-web-usb

import { Injectable, effect, inject} from '@angular/core';
import { StorageService } from './storage.service';

import * as gConst from '../gConst';
import * as gIF from '../gIF';

const vID = 0x1915;
const pID = 0x1067;
const options: USBDeviceRequestOptions = {
    filters: [{vendorId: vID, productId: pID}]
};

@Injectable({
    providedIn: 'root',
})
export class UsbService {

    usb_device = {} as USBDevice;
    valid_dev_flag = false;

    rxBuf = new Uint8Array(1024);
    txBuf = new Uint8Array(1024);
    rwBuf = new gIF.rwBuf_t();

    outFrames: Uint8Array[] = [];
    usbReadTmo: any;

    storage = inject(StorageService);

    trash = 1;

    constructor() {
        setTimeout(() => {
            this.sendFrame();
        }, 100);

        setTimeout(()=>{
            this.requestDevice();
        }, 500);

        this.rwBuf.wrBuf = new DataView(this.txBuf.buffer);

        navigator.usb.ondisconnect = (event: USBConnectionEvent)=>{
            console.warn(event);
            this.valid_dev_flag = false;
            setTimeout(()=>{
                this.requestDevice();
            }, 1000);
        };
    }

    /***********************************************************************************************
     * fn          initApp
     *
     * brief
     *
     */
    initApp() {

        this.storage.readAllKeys();

        setTimeout(()=>{
            this.cleanAgedItems();
        }, 60000);
    }

    /***********************************************************************************************
     * fn          request_device
     *
     * brief
     *
     */
    async requestDevice() {

        try {
            let device = await navigator.usb.requestDevice(options);
            await device.open();
            await device.selectConfiguration(1);
            await device.claimInterface(0);

            this.usb_device = device;
            this.valid_dev_flag = true;

            clearTimeout(this.usbReadTmo);
            this.usbReadTmo = setTimeout(()=>{
                this.usbRead();
            }, 100);
        }
        catch(err) {
            console.error(err);
            setTimeout(()=>{
                this.requestDevice();
            }, 1000);
        }
    }
    /*
    requestDevice() {
        navigator.usb.requestDevice(options).then((device: USBDevice)=>{
            this.usb_device = device;
            device.open().then(()=>{
                device.selectConfiguration(1).then(()=>{
                    device.claimInterface(0).then(()=>{
                        this.valid_dev_flag = true;
                        setTimeout(()=>{
                            this.usbRead();
                        }, 200);
                    }).catch((err)=>{
                        console.error(`claim if err: ${err}`);
                    });
                }).catch((err)=>{
                    console.error(`select config err: ${err}`);
                })
            }).catch((err)=>{
                console.error(`device open err: ${err}`);
            });
        }).catch((err)=>{
            console.error(`request device err: ${err}`);
            setTimeout(()=>{
                this.requestDevice();
            }, 1000);
        });
    }
    */
    /***********************************************************************************************
     * fn          closeDevice
     *
     * brief
     *
     */
    async closeDevice() {
        if(this.valid_dev_flag == true){
            this.valid_dev_flag = false;
            try {
                await this.usb_device.releaseInterface(0);
                await this.usb_device.close();
            }
            catch(err) {
                console.error(err);
            }
        }
    }

    /***********************************************************************************************
     * fn          usbRead
     *
     * brief
     *
     */
    async usbRead() {

        let tmo = 100;

        if(this.valid_dev_flag == true){
            try {
                const usbMsg = await this.usb_device.transferIn(1, 64);
                console.log(usbMsg);
                if(usbMsg.status == 'ok'){
                    this.processMsg(usbMsg);
                }
                else {
                    tmo = 1000;
                }
            }
            catch(err) {
                tmo = 1000;
                console.error(err);
            }
        }

        this.usbReadTmo = setTimeout(()=>{
            this.usbRead();
        }, tmo);
    }

    /***********************************************************************************************
     * fn          processMsg
     *
     * brief
     *
     *
    processMsg_bkp(usbMsg: USBInTransferResult) {

        let i = 0;
        let j = 0;
        let hop_addr = 0;
        this.rwBuf.rdBuf = usbMsg.data!;
        this.rwBuf.rdIdx = 0;

        const msgType = this.rwBuf.read_uint8();
        switch(msgType){
            case gConst.USB_MSG_ITEM_REPORT: {
                const itemRep = {} as gIF.itemReport_t;
                const hops = [];
                itemRep.hops = [];
                for(i = 0; i < gConst.HOPS_MAX; i++){
                    itemRep.hops.push(gConst.INVALID_ADDR);
                    hop_addr = this.rwBuf.read_uint8();
                    if(hop_addr != gConst.INVALID_ADDR){
                        hops.push(hop_addr);
                    }
                }
                hops.reverse();
                for(i = 0; i < hops.length; i++){
                    itemRep.hops[i] = hops[i];
                }
                itemRep.partNum = this.rwBuf.read_uint32_LE();
                itemRep.addr = this.rwBuf.read_uint8();
                itemRep.endPoint = this.rwBuf.read_uint8();
                const dataLen = this.rwBuf.read_uint8();
                itemRep.data = [];
                for(i = 0; i < dataLen; i++){
                    itemRep.data.push(this.rwBuf.read_uint8());
                }
                this.parseItemReport(itemRep);
            }
            break;
        }
    }
    */
    /***********************************************************************************************
     * fn          processMsg
     *
     * brief
     *
     */
    processMsg(usbMsg: USBInTransferResult) {

        let i = 0;
        let j = 0;
        let hop_addr = 0;
        this.rwBuf.rdBuf = usbMsg.data!;
        this.rwBuf.rdIdx = 0;

        const msgType = this.rwBuf.read_uint8();
        switch(msgType){
            case gConst.USB_MSG_ITEM_REPORT: {
                const devRep = {} as gIF.deviceReport_t;
                const hops = [];
                devRep.hops = [];
                for(i = 0; i < gConst.HOPS_MAX; i++){
                    devRep.hops.push(gConst.INVALID_ADDR);
                    hop_addr = this.rwBuf.read_uint8();
                    if(hop_addr != gConst.INVALID_ADDR){
                        hops.push(hop_addr);
                    }
                }
                hops.reverse();
                for(i = 0; i < hops.length; i++){
                    devRep.hops[i] = hops[i];
                }
                devRep.partNum = this.rwBuf.read_uint16_LE();
                devRep.addr = this.rwBuf.read_uint8();
                const dataLen = this.rwBuf.read_uint8();
                devRep.data = [];
                for(i = 0; i < dataLen; i++){
                    devRep.data.push(this.rwBuf.read_uint8());
                }
                this.parseDeviceReport(devRep);
            }
            break;
        }
    }

    /***********************************************************************************************
     * fn          parseItemReport
     *
     * brief
     *
     *
    parseItemReport(itemRep: gIF.itemReport_t) {

        const itemProps = this.setItemProps(itemRep);
        if(itemProps.valid == false){
            console.log(`unsuported part: ${itemRep.partNum}`);
            return;
        }
        const now = Math.round(Date.now() / 1000);
        if(itemProps.isVisible == true) {
            const item = {} as gIF.netItem_t;
            item.partNum = itemRep.partNum;
            item.addr = itemRep.addr;
            item.endPoint = itemRep.endPoint;
            if(itemProps.battery.rep_size){
                item.battery = JSON.parse(JSON.stringify(itemProps.battery));
            }
            const key = this.storage.itemKey(item);
            const mapItem: gIF.netItem_t = this.storage.itemMap().get(key);
            if(mapItem){
                mapItem.timestamp = now;
                mapItem.isValid = true;
                mapItem.formatedVal = itemProps.formatedVal;
                if(itemProps.battery.rep_size){
                    mapItem.battery = JSON.parse(JSON.stringify(itemProps.battery));
                }
                if(itemProps.hasHistory){
                    this.dataHistory(now, itemProps.value, mapItem);
                }
                this.storage.itemMap.update((map)=>{
                    //map.set(key, mapItem);
                    return new Map(map);
                });
            }
            else {
                item.drag = false;
                item.isSel = false;
                item.timestamp = now;
                const nvProps = this.storage.nvPropsMap.get(key);
                if(nvProps){
                    item.pos = nvProps.pos;
                    item.name = nvProps.attrName;
                    item.style = nvProps.style;
                    item.valCorr = nvProps.valCorr;
                }
                else {
                    item.pos = {x: 0, y: 0};
                    item.name = 'no name';
                    item.style = gConst.NG_STYLE;
                    item.valCorr = {units: itemProps.units, offset: 0};
                }
                item.group = itemProps.group;
                item.type = itemProps.type;
                item.isValid = true;
                item.hops = [];
                for(let i = 0; i < gConst.HOPS_MAX; i++){
                    item.hops.push(itemRep.hops[i]);
                }
                item.formatedVal = itemProps.formatedVal;
                item.timestamps = [];
                item.vals = [];
                if(itemProps.hasHistory) {
                    item.timestamps.push(now);
                    item.vals.push(itemProps.value);
                }
                this.storage.itemMap.update((map)=>{
                    map.set(key, item);
                    return new Map(map);
                });
            }
            console.log(itemProps.formatedVal);
        }
    }
    */
    /***********************************************************************************************
     * fn          setItemProps
     *
     * brief
     *
     *
    setItemProps(itemRep: gIF.itemReport_t) {

        let itemProps = {} as gIF.itemProps_t;
        const item_vals = new Uint8Array(itemRep.data);
        this.rwBuf.rdBuf = new DataView(item_vals.buffer);
        this.rwBuf.rdIdx = 0;

        let key: string;
        let nvProps: gIF.nvProps_t;
        let formatedVal = '';
        let units: number;

        itemProps.valid = true;
        switch(itemRep.partNum) {
            case gConst.SHT40_018_RH: {
                let rh = this.rwBuf.read_uint16_LE();
                rh /= 10.0;
                let corrRH = rh;
                key = this.storage.itemKey(itemRep);
                nvProps = this.storage.nvPropsMap.get(key);
                if(nvProps) {
                    corrRH = this.corrVal(rh, nvProps.valCorr);
                }
                itemProps.isVisible = true;
                itemProps.group = gIF.eGroup_t.E_GROUP_HUMIDITY;
                itemProps.type = gIF.eType_t.E_TYPE_SENSOR;
                itemProps.hasHistory = true;
                itemProps.formatedVal = `${corrRH.toFixed(0)} %rh`;
                itemProps.units = gConst.RH_UNIT;
                itemProps.value = rh;
            }
            break;

            case gConst.SHT40_018_T: {
                let temp = this.rwBuf.read_int16_LE();
                temp /= 10.0;
                let corrTemp = temp;
                units = gConst.DEG_C;
                key = this.storage.itemKey(itemRep);
                nvProps = this.storage.nvPropsMap.get(key);
                if(nvProps){
                    units = nvProps.valCorr.units;
                    corrTemp = this.corrVal(temp, nvProps.valCorr);
                    if(units == gConst.DEG_F) {
                        formatedVal = `${corrTemp.toFixed(1)} °F`;
                    }
                    else {
                        formatedVal = `${corrTemp.toFixed(1)} °C`;
                    }
                }
                else {
                    formatedVal = `${corrTemp.toFixed(1)} °C`;
                }
                itemProps.isVisible = true;
                itemProps.group = gIF.eGroup_t.E_GROUP_TEMPERATURE;
                itemProps.type = gIF.eType_t.E_TYPE_SENSOR;
                itemProps.hasHistory = true;
                itemProps.formatedVal = formatedVal;
                itemProps.units = units;
                itemProps.value = temp;

                const tempEvent = {} as gIF.tempEvent_t;
                tempEvent.temp = corrTemp;
                tempEvent.addr = itemRep.addr;
                tempEvent.endPoint = itemRep.endPoint;

                this.storage.tempEvent.set(tempEvent);
            }
            break;

            case gConst.SSR_009_RELAY: {
                let state = this.rwBuf.read_uint8();
                itemProps.isVisible = true;
                itemProps.group = gIF.eGroup_t.E_GROUP_ON_OFF;
                itemProps.type = gIF.eType_t.E_TYPE_ACUATOR;
                itemProps.hasHistory = true;
                itemProps.formatedVal = !!state ? 'on' : 'off';
                itemProps.units = gConst.NO_UNIT;
                itemProps.value = state;
            }
            break;

            case gConst.ENS_015_AQ: {
                let aq = this.rwBuf.read_uint16_LE();
                itemProps.isVisible = true;
                itemProps.group = gIF.eGroup_t.E_GROUP_AIR_QUALITY;
                itemProps.type = gIF.eType_t.E_TYPE_SENSOR;
                itemProps.hasHistory = true;
                itemProps.formatedVal = `aq - ${aq.toFixed(0)}`;
                itemProps.units = gConst.NO_UNIT;
                itemProps.value = aq;
            }
            break;

            case gConst.PB_023_SW: {
                let len = itemRep.data.length;
                let trig = this.rwBuf.read_uint8();
                len = len - 1;
                itemProps.battery = {} as gIF.battery_t;
                itemProps.battery.rep_size = gIF.eBattRepSize.E_BATT_REP_SIZE_SHORT;
                itemProps.battery.v_bat = this.rwBuf.read_uint16_LE();
                len = len - 2;
                if(len > 0){
                    itemProps.battery.rep_size = gIF.eBattRepSize.E_BATT_REP_SIZE_FULL;
                    itemProps.battery.i_bat = this.rwBuf.read_uint16_LE();
                    itemProps.battery.i_chg = this.rwBuf.read_uint8();
                    itemProps.battery.i_bat_status = this.rwBuf.read_uint8();
                    itemProps.battery.ntc_status = this.rwBuf.read_uint8();
                    itemProps.battery.die_status = this.rwBuf.read_uint8();
                    itemProps.battery.chg_status = this.rwBuf.read_uint8();
                    itemProps.battery.chg_err = this.rwBuf.read_uint8();
                }
                itemProps.isVisible = true;
                itemProps.group = gIF.eGroup_t.E_GROUP_ON_OFF;
                itemProps.type = gIF.eType_t.E_TYPE_SWITCH;
                itemProps.hasHistory = false;
                itemProps.formatedVal = `sw`;
                itemProps.units = gConst.NO_UNIT;
                itemProps.value = trig;
                if(trig){
                    const pbEvent = {} as gIF.pbEvent_t;
                    pbEvent.trig = trig;
                    pbEvent.addr = itemRep.addr;
                    pbEvent.endPoint = itemRep.endPoint;
                    this.storage.pbEvent.set(pbEvent);
                }
                const battEvent = {} as gIF.battEvent_t;
                battEvent.addr = itemRep.addr;
                battEvent.battery = JSON.parse(JSON.stringify(itemProps.battery));
                this.storage.battEvent.set(battEvent);
            }
            break;

            case gConst.SHT40_018_BAT: {
                let batVolt = this.rwBuf.read_uint8();
                batVolt /= 10.0;
                itemProps.isVisible = true;
                itemProps.group = gIF.eGroup_t.E_GROUP_VOLTAGE;
                itemProps.type = gIF.eType_t.E_TYPE_BATTERY;
                itemProps.hasHistory = false;
                itemProps.formatedVal = `${batVolt.toFixed(1)} V`;
                itemProps.units = gConst.VOLT_UNIT;
                itemProps.value = batVolt;
            }
            break;

            default: {
                itemProps.valid = false;
            }
            break;
        }
        return itemProps;
    }
    */
    /***********************************************************************************************
     * fn          parseDeviceReport
     *
     * brief
     *
     */
    parseDeviceReport(devRep: gIF.deviceReport_t) {

        const devProps = this.getProps(devRep);

        if(devProps.length == 0){
            console.log(`unsuported part: ${devRep.partNum}`);
            return;
        }
        const now = Math.round(Date.now() / 1000);
        for(const props of devProps){
            if(props.isVisible == true) {
                const item = {} as gIF.netItem_t;
                item.partNum = devRep.partNum;
                item.addr = devRep.addr;
                item.endPoint = props.endPoint;
                const key = this.storage.itemKey({
                    partNum: item.partNum,
                    addr: item.addr,
                    endPoint: item.endPoint
                });
                const mapItem: gIF.netItem_t = this.storage.itemMap().get(key);
                if(mapItem){
                    mapItem.timestamp = now;
                    mapItem.isValid = true;
                    mapItem.formatedVal = props.formatedVal;
                    if(props.battery.rep_size){
                        mapItem.battery = JSON.parse(JSON.stringify(props.battery));
                    }
                    if(props.hasHistory){
                        this.dataHistory(now, props.value, mapItem);
                    }
                    this.storage.itemMap.update((map)=>{
                        //map.set(key, mapItem);
                        return new Map(map);
                    });
                }
                else {
                    item.drag = false;
                    item.isSel = false;
                    item.timestamp = now;
                    const nvProps = this.storage.nvPropsMap.get(key);
                    if(nvProps){
                        item.pos = nvProps.pos;
                        item.name = nvProps.name;
                        item.style = nvProps.style;
                        item.valCorr = nvProps.valCorr;
                    }
                    else {
                        item.pos = {x: 0, y: 0};
                        item.name = 'no name';
                        item.style = gConst.NG_STYLE;
                        item.valCorr = {units: props.units, offset: 0};
                    }
                    item.group = props.group;
                    item.type = props.type;
                    item.isValid = true;
                    item.hops = [];
                    for(let i = 0; i < gConst.HOPS_MAX; i++){
                        item.hops.push(devRep.hops[i]);
                    }
                    item.formatedVal = props.formatedVal;
                    if(props.battery.rep_size){
                        item.battery = JSON.parse(JSON.stringify(props.battery));
                    }
                    item.timestamps = [];
                    item.vals = [];
                    if(props.hasHistory) {
                        item.timestamps.push(now);
                        item.vals.push(props.value);
                    }
                    this.storage.itemMap.update((map)=>{
                        map.set(key, item);
                        return new Map(map);
                    });
                }
                console.log(props.formatedVal);
            }
        }
    }

    /***********************************************************************************************
     * fn          getProps
     *
     * brief
     *
     */
    getProps(devRep: gIF.deviceReport_t) {

        let props: gIF.epProps_t[] = [];
        const item_vals = new Uint8Array(devRep.data);
        this.rwBuf.rdBuf = new DataView(item_vals.buffer);
        this.rwBuf.rdIdx = 0;

        let key: string;
        let nvProps: gIF.nvProps_t;
        let formatedVal = '';
        let units: number;

        switch(devRep.partNum) {
            case gConst.SHT40_018: {
                let t_props = {} as gIF.epProps_t;
                t_props.valid = true;
                t_props.endPoint = this.rwBuf.read_uint8();
                let temp = this.rwBuf.read_uint16_LE();
                temp = -45.0 + 175.0 * temp / 65535.0;
                let corrTemp = temp;
                units = gConst.DEG_C;
                key = this.storage.itemKey({
                    partNum: devRep.partNum,
                    addr: devRep.addr,
                    endPoint: t_props.endPoint
                });
                nvProps = this.storage.nvPropsMap.get(key);
                if(nvProps){
                    units = nvProps.valCorr.units;
                    corrTemp = this.corrVal(temp, nvProps.valCorr);
                    if(units == gConst.DEG_F) {
                        formatedVal = `${corrTemp.toFixed(1)} °F`;
                    }
                    else {
                        formatedVal = `${corrTemp.toFixed(1)} °C`;
                    }
                }
                else {
                    formatedVal = `${corrTemp.toFixed(1)} °C`;
                }
                t_props.isVisible = true;
                t_props.group = gIF.eGroup_t.E_GROUP_TEMPERATURE;
                t_props.type = gIF.eType_t.E_TYPE_SENSOR;
                t_props.hasHistory = true;
                t_props.formatedVal = formatedVal;
                t_props.units = units;
                t_props.value = temp;

                let rh_props = {} as gIF.epProps_t;
                rh_props.valid = true;
                rh_props.endPoint = this.rwBuf.read_uint8();
                let rh = this.rwBuf.read_uint16_LE();
                rh = -6.0 + 125.0 * rh / 65535;
                let corrRH = rh;
                key = this.storage.itemKey({
                    partNum: devRep.partNum,
                    addr: devRep.addr,
                    endPoint: rh_props.endPoint
                });
                nvProps = this.storage.nvPropsMap.get(key);
                if(nvProps) {
                    corrRH = this.corrVal(rh, nvProps.valCorr);
                }
                rh_props.isVisible = true;
                rh_props.group = gIF.eGroup_t.E_GROUP_HUMIDITY;
                rh_props.type = gIF.eType_t.E_TYPE_SENSOR;
                rh_props.hasHistory = true;
                rh_props.formatedVal = `${corrRH.toFixed(0)} %rh`;
                rh_props.units = gConst.RH_UNIT;
                rh_props.value = rh;

                let battery = {} as gIF.battery_t;
                battery.rep_size = this.rwBuf.read_uint8();
                battery.v_bat = this.rwBuf.read_uint16_LE();
                if(battery.rep_size == gConst.SHORT_BAT_REPORT){
                    this.rwBuf.rdIdx += battery.rep_size;
                }
                else {
                    battery.i_bat = this.rwBuf.read_uint16_LE();
                    battery.i_chg = this.rwBuf.read_uint8();
                    battery.i_bat_status = this.rwBuf.read_uint8();
                    battery.ntc_status = this.rwBuf.read_uint8();
                    battery.die_status = this.rwBuf.read_uint8();
                    battery.chg_status = this.rwBuf.read_uint8();
                    battery.chg_err = this.rwBuf.read_uint8();
                }
                t_props.battery = battery;
                props.push(t_props);
                rh_props.battery = battery;
                props.push(rh_props);

                const tempEvent = {} as gIF.tempEvent_t;
                tempEvent.temp = corrTemp;
                tempEvent.addr = devRep.addr;
                tempEvent.endPoint = t_props.endPoint;
                this.storage.tempEvent.set(tempEvent);

                const battEvent = {} as gIF.battEvent_t;
                battEvent.addr = devRep.addr;
                battEvent.battery = JSON.parse(JSON.stringify(battery));
                this.storage.battEvent.set(battEvent);

            }
            break;

            case gConst.SSR_009: {
                let ssr_props = {} as gIF.epProps_t;
                ssr_props.valid = true;
                ssr_props.endPoint = this.rwBuf.read_uint8();
                let state = this.rwBuf.read_uint8();

                ssr_props.isVisible = true;
                ssr_props.group = gIF.eGroup_t.E_GROUP_ON_OFF;
                ssr_props.type = gIF.eType_t.E_TYPE_ACUATOR;
                ssr_props.hasHistory = true;
                ssr_props.formatedVal = !!state ? 'on' : 'off';

                let battery = {} as gIF.battery_t;
                battery.rep_size = 0;
                ssr_props.battery = battery;

                ssr_props.units = gConst.NO_UNIT;
                ssr_props.value = state;

                props.push(ssr_props);
            }
            break;
            /*
            case gConst.ENS_015_AQ: {
                let aq = this.rwBuf.read_uint16_LE();
                itemProps.isVisible = true;
                itemProps.group = gIF.eGroup_t.E_GROUP_AIR_QUALITY;
                itemProps.type = gIF.eType_t.E_TYPE_SENSOR;
                itemProps.hasHistory = true;
                itemProps.formatedVal = `aq - ${aq.toFixed(0)}`;
                itemProps.units = gConst.NO_UNIT;
                itemProps.value = aq;
            }
            break;
            */
            case gConst.PB_023: {
                let pb_props = {} as gIF.epProps_t;
                pb_props.valid = true;
                pb_props.endPoint = this.rwBuf.read_uint8();
                let trig = this.rwBuf.read_uint8();

                let battery = {} as gIF.battery_t;
                battery.rep_size = this.rwBuf.read_uint8();
                battery.v_bat = this.rwBuf.read_uint16_LE();
                if(battery.rep_size == gConst.SHORT_BAT_REPORT){
                    this.rwBuf.rdIdx += battery.rep_size;
                }
                else {
                    battery.i_bat = this.rwBuf.read_uint16_LE();
                    battery.i_chg = this.rwBuf.read_uint8();
                    battery.i_bat_status = this.rwBuf.read_uint8();
                    battery.ntc_status = this.rwBuf.read_uint8();
                    battery.die_status = this.rwBuf.read_uint8();
                    battery.chg_status = this.rwBuf.read_uint8();
                    battery.chg_err = this.rwBuf.read_uint8();
                }
                pb_props.isVisible = true;
                pb_props.group = gIF.eGroup_t.E_GROUP_ON_OFF;
                pb_props.type = gIF.eType_t.E_TYPE_SWITCH;
                pb_props.hasHistory = false;
                pb_props.formatedVal = `sw`;
                pb_props.battery = battery;
                pb_props.units = gConst.NO_UNIT;
                pb_props.value = trig;

                props.push(pb_props);

                if(trig){
                    const pbEvent = {} as gIF.pbEvent_t;
                    pbEvent.trig = trig;
                    pbEvent.addr = devRep.addr;
                    pbEvent.endPoint = pb_props.endPoint;
                    this.storage.pbEvent.set(pbEvent);
                }
                const battEvent = {} as gIF.battEvent_t;
                battEvent.addr = devRep.addr;
                battEvent.battery = JSON.parse(JSON.stringify(battery));
                this.storage.battEvent.set(battEvent);
            }
            break;
        }
        return props;
    }

    /***********************************************************************************************
     * fn          corrVal
     *
     * brief
     *
     */
    private corrVal(val: number, corr: gIF.valCorr_t) {

        let corrVal = val + corr.offset;

        switch(corr.units) {
            case gConst.DEG_F: {
                corrVal = (corrVal * 9.0) / 5.0 + 32.0;
                break;
            }
        }
        return corrVal;
    }

     /***********************************************************************************************
     * fn          dataHistory
     *
     * brief
     *
     */
    private dataHistory(timestamp: number, val: number, item: gIF.netItem_t) {

        let len = item.timestamps.length;
        if(len > 0){
            let last = item.timestamps[len - 1];
            if((timestamp - last) > 59){
                item.timestamps.push(timestamp);
                item.vals.push(val);
                len++;
                if(len > gConst.HIST_LEN) {
                    item.timestamps.shift();
                    item.vals.shift();
                }
                this.storage.chartData.set(item);
            }
        }
        else {
            item.timestamps.push(timestamp);
            item.vals.push(val);
        }
    }

    /***********************************************************************************************
     * fn          cleanAgedItems
     *
     * brief
     *
     */
    private cleanAgedItems() {

        let diff: number;
        let now = Math.round(Date.now() / 1000);
        for(let [key, val] of this.storage.itemMap()) {
            diff = now - val.timestamp;
            if(diff > gConst.ITEM_TTL) {
                this.storage.itemMap.update((map)=>{
                    map.delete(key);
                    return new Map(map);
                });
            }
            if(diff > gConst.ITEM_VALID_TTL) {
                val.isValid = false;
            }
        }
        setTimeout(()=>{
            this.cleanAgedItems();
        }, 60000); // 60 seconds
    }

    /***********************************************************************************************
     * fn          addOutFrame
     *
     * brief
     *
     */
    addOutFrame(frame: Uint8Array) {
        this.outFrames.push(frame);
    }

    /***********************************************************************************************
     * fn          sendFrame
     *
     * brief
     *
     */
    async sendFrame() {

        if(this.outFrames.length && this.valid_dev_flag){
            try {
                const frame = this.outFrames.shift()!;
                const res = await this.usb_device?.transferOut(1, frame);
                console.log(res);
            }
            catch(err) {
                console.error(err);
            }
        }
        setTimeout(() => {
            this.sendFrame();
        }, 100);
    }

}
