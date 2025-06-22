///<reference types="chrome"/>
import {
    Injectable,
    effect,
    inject
} from '@angular/core';

import * as gIF from '../gIF';
import * as gConst from '../gConst';
import { StorageService } from './storage.service';
import { SerialLinkService } from './serial-link.service';

@Injectable({
    providedIn: 'root',
})
export class TestService {

    //freshSet = signal<gIF.attrSet_t>(<gIF.attrSet_t>{});

    t_1_set = {} as gIF.attrSet_t;
    t_2_set = {} as gIF.attrSet_t;
    light_1_set = {} as gIF.attrSet_t;
    light_2_set = {} as gIF.attrSet_t;
    bind_1 = {} as gIF.clusterBind_t;
    bind_2 = {} as gIF.clusterBind_t;

    allBinds: gIF.clusterBind_t[] = [];

    rxBuf = new Uint8Array(1024);
    txBuf = new Uint8Array(1024);
    rwBuf = new gIF.rwBuf_t();

    wr_bind = effect(()=>{
        const srcBind = this.storage.wrBind();
        if(srcBind.extAddr == this.bind_1.extAddr){
            if(srcBind.srcShortAddr == this.bind_1.srcShortAddr){
                if(srcBind.srcEP == this.bind_1.srcEP){
                    this.bind_1.dstExtAddr = srcBind.dstExtAddr;
                    this.bind_1.dstEP = srcBind.dstEP;
                }
            }
        }
        if(srcBind.extAddr == this.bind_2.extAddr){
            if(srcBind.srcShortAddr == this.bind_2.srcShortAddr){
                if(srcBind.srcEP == this.bind_2.srcEP){
                    this.bind_2.dstExtAddr = srcBind.dstExtAddr;
                    this.bind_2.dstEP = srcBind.dstEP;
                }
            }
        }
    });

    storage = inject(StorageService);
    serialLink = inject(SerialLinkService);

    constructor() {
        this.rwBuf.wrBuf = new DataView(this.txBuf.buffer);

        this.t_1_set.hostShortAddr = 2300;
        this.t_1_set.partNum = gConst.SHT40_018_T;
        this.t_1_set.clusterServer = 0;
        this.t_1_set.extAddr = 1100;
        this.t_1_set.shortAddr = 101;
        this.t_1_set.endPoint = 2;
        this.t_1_set.clusterID = gConst.CLUSTER_ID_MS_TEMPERATURE_MEASUREMENT;
        this.t_1_set.attrSetID = 0;
        this.t_1_set.attrMap = 1;
        this.t_1_set.valsLen = 1;
        this.t_1_set.attrVals = [235];

        this.t_2_set.hostShortAddr = 2300;
        this.t_2_set.partNum = gConst.SHT40_018_T;
        this.t_2_set.clusterServer = 0;
        this.t_2_set.extAddr = 1200;
        this.t_2_set.shortAddr = 102
        this.t_2_set.endPoint = 3;
        this.t_2_set.clusterID = gConst.CLUSTER_ID_MS_TEMPERATURE_MEASUREMENT;
        this.t_2_set.attrSetID = 0;
        this.t_2_set.attrMap = 1;
        this.t_2_set.valsLen = 1;
        this.t_2_set.attrVals = [208];

        this.light_1_set.hostShortAddr = 2300;
        this.light_1_set.partNum = gConst.SSR_009_RELAY;
        this.light_1_set.clusterServer = 1;
        this.light_1_set.extAddr = 1300;
        this.light_1_set.shortAddr = 103;
        this.light_1_set.endPoint = 1;
        this.light_1_set.clusterID = gConst.CLUSTER_ID_GEN_ON_OFF;
        this.light_1_set.attrSetID = 0;
        this.light_1_set.attrMap = 1;
        this.light_1_set.valsLen = 1;
        this.light_1_set.attrVals = [0];

        this.light_2_set.hostShortAddr = 2400;
        this.light_2_set.partNum = gConst.SSR_009_RELAY;
        this.light_2_set.clusterServer = 1;
        this.light_2_set.extAddr = 1400;
        this.light_2_set.shortAddr = 104;
        this.light_2_set.endPoint = 1;
        this.light_2_set.clusterID = gConst.CLUSTER_ID_GEN_ON_OFF;
        this.light_2_set.attrSetID = 0;
        this.light_2_set.attrMap = 1;
        this.light_2_set.valsLen = 1;
        this.light_2_set.attrVals = [0];

        this.bind_1.partNum = gConst.PB_SW_023_SW;
        this.bind_1.hostShortAddr = 2400;
        this.bind_1.extAddr = 1500;
        this.bind_1.srcShortAddr = 105;
        this.bind_1.srcEP = 1;
        this.bind_1.clusterID = gConst.CLUSTER_ID_GEN_ON_OFF;
        this.bind_1.dstExtAddr = 0;
        this.bind_1.dstEP = 0;

        this.bind_2.partNum = gConst.PB_SW_023_SW;
        this.bind_2.hostShortAddr = 2400;
        this.bind_2.extAddr = 1600;
        this.bind_2.srcShortAddr = 106;
        this.bind_2.srcEP = 1;
        this.bind_2.clusterID = gConst.CLUSTER_ID_GEN_ON_OFF;
        this.bind_2.dstExtAddr = 0;
        this.bind_2.dstEP = 0;

        setTimeout(()=>{
            this.t_1_send();
        }, 1000);
        setTimeout(()=>{
            this.t_2_send();
        }, 1050);
        setTimeout(()=>{
            this.light_1_send();
        }, 1100);
        setTimeout(()=>{
            this.light_2_send();
        }, 1150);
        setTimeout(()=>{
            this.bind_1_send();
        }, 1200);
        setTimeout(()=>{
            this.bind_2_send();
        }, 1250);
        /*
        setTimeout(()=>{
            this.nwk_test();
        }, 1000);
        */
    }

    /***********************************************************************************************
     * fn          nwk_test
     *
     * brief
     *
     *
    nwk_test() {
        chrome.socket.getNetworkList((nwkList)=>{
            console.log(nwkList);
        });
    }
    */
    /***********************************************************************************************
     * fn          t_1_send
     *
     * brief
     *
     */
    private t_1_send() {

        this.rwBuf.wrIdx = 0;

        const ranVal = Math.ceil(Math.random() * 30) * (Math.round(Math.random()) ? 1 : -1);
        const new_t = 200 + ranVal;
        this.rwBuf.write_int16_LE(new_t);

        for(let i = 0; i < this.rwBuf.wrIdx; i++){
            this.t_1_set.attrVals[i] = this.txBuf[i];
        }

        this.serialLink.parseAttrSet(this.t_1_set);

        const tmo = 3000 + Math.round(Math.random() * 3000);
        setTimeout(()=>{
            this.t_1_send();
        }, tmo);
    }
    /***********************************************************************************************
     * fn          t_2_send
     *
     * brief
     *
     */
    private t_2_send() {

        this.rwBuf.wrIdx = 0;

        const ranVal = Math.ceil(Math.random() * 20) * (Math.round(Math.random()) ? 1 : -1);
        const new_t = 200 + ranVal;
        this.rwBuf.write_int16_LE(new_t);

        for(let i = 0; i < this.rwBuf.wrIdx; i++){
            this.t_2_set.attrVals[i] = this.txBuf[i];
        }

        this.serialLink.parseAttrSet(this.t_2_set);

        const tmo = 3000 + Math.round(Math.random() * 3000);
        setTimeout(()=>{
            this.t_2_send();
        }, tmo);
    }

    /***********************************************************************************************
     * fn          light_1_send
     *
     * brief
     *
     */
    private light_1_send() {

        this.rwBuf.wrIdx = 0;

        const ranVal = Math.round(Math.random()) ? 1 : 0;
        this.rwBuf.write_uint8(ranVal);

        for(let i = 0; i < this.rwBuf.wrIdx; i++){
            this.light_1_set.attrVals[i] = this.txBuf[i];
        }

        this.serialLink.parseAttrSet(this.light_1_set);

        const tmo = 5000 + Math.round(Math.random() * 3000);
        setTimeout(()=>{
            this.light_1_send();
        }, tmo);
    }

    /***********************************************************************************************
     * fn          light_2_send
     *
     * brief
     *
     */
    private light_2_send() {

        this.rwBuf.wrIdx = 0;

        const ranVal = Math.round(Math.random()) ? 1 : 0;
        this.rwBuf.write_uint8(ranVal);

        for(let i = 0; i < this.rwBuf.wrIdx; i++){
            this.light_2_set.attrVals[i] = this.txBuf[i];
        }

        this.serialLink.parseAttrSet(this.light_2_set);

        const tmo = 5000 + Math.round(Math.random() * 3000);
        setTimeout(()=>{
            this.light_2_send();
        }, tmo);
    }

    /***********************************************************************************************
     * fn          bind_1_send
     *
     * brief
     *
     */
    private bind_1_send() {

        this.serialLink.addBind(this.bind_1);

        const tmo = 5000 + Math.round(Math.random() * 3000);
        setTimeout(()=>{
            this.bind_1_send();
        }, tmo);
    }

    /***********************************************************************************************
     * fn          bind_2_send
     *
     * brief
     *
     */
    private bind_2_send() {

        this.serialLink.addBind(this.bind_2);

        const tmo = 5000 + Math.round(Math.random() * 3000);
        setTimeout(()=>{
            this.bind_2_send();
        }, tmo);
    }

}
