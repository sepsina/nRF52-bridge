import {
    Component,
    ElementRef,
    AfterViewInit,
    viewChild,
    inject,
    signal,
    ChangeDetectorRef,
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

import * as gIF from '../gIF';
import * as gConst from '../gConst';

@Component({
    selector: 'app-edit-scrolls',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './edit-scrolls.html',
    styleUrls: ['./edit-scrolls.scss'],
    host: {
        '[attr.id]': 'hostID',
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditScrolls implements AfterViewInit {

    hostID = 'scrolls-dlg';

    minPos = 0;
    maxPos = 100;
    maxNameLen = 16;

    m_scroll_sel = signal('0');
    m_scroll_name = signal('');
    m_y_pos = signal('0');

    allScrolls = signal<gIF.scroll_t[]>([]);
    selScroll = {} as gIF.scroll_t;

    newIdx: number = 0;

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

        //const all_scrolls = JSON.parse(JSON.stringify(this.storage.scrolls()));
        const all_scrolls = [...this.storage.scrolls()];
        all_scrolls.splice(0, 1);
        this.allScrolls.set(all_scrolls);

        setTimeout(() => {
            if(this.allScrolls().length == 0){
                this.addScroll();
            }
            else {
                this.scrollSelect(0);
            }
        }, 0);
    }

    /***********************************************************************************************
     * fn          onScrollSelected
     *
     * brief
     *
     */
    onScrollSelected(idx: string){

        console.log(`sel idx: ${idx}`);

        const i = parseInt(idx);
        this.scrollSelect(i);
    }

    /***********************************************************************************************
     * fn          scrollSelect
     *
     * brief
     *
     */
    scrollSelect(idx: number){

        this.selScroll = this.allScrolls()[idx];

        this.m_scroll_sel.set(`${idx}`);
        this.m_scroll_name.set(this.selScroll.name);
        this.m_y_pos.set(`${this.selScroll.yPos}`);

        this.yPosSet(this.selScroll.yPos);
    }

    /***********************************************************************************************
     * @fn          onNameChange
     *
     * @brief
     *
     */
    onNameChange(newName: string){

        this.m_scroll_name.set(newName);
    }

    /***********************************************************************************************
     * @fn          onNameBlur
     *
     * @brief
     *
     */
    onNameBlur(){

        if(this.m_scroll_name() == ''){
            this.m_scroll_name.set(this.selScroll.name);
            return;
        }
        const nameLen = this.m_scroll_name().length;
        if(nameLen > this.maxNameLen){
            this.m_scroll_name.set(this.selScroll.name);
            return;
        }

        this.selScroll.name = this.m_scroll_name();
        this.storage.scrolls.update((scrolls)=>{
            return [...scrolls];
        });
    }

    /***********************************************************************************************
     * fn          onPosChange
     *
     * brief
     *
     */
    onPosChange(newVal: string){

        let pos = parseInt(newVal);

        if(Number.isNaN(pos) || (pos < this.minPos)){
            pos = this.minPos;
        }
        if(pos > this.maxPos){
            pos = this.maxPos;
        }
        this.yPosSet(pos);

        this.m_y_pos.set(newVal);
    }

    /***********************************************************************************************
     * fn          onPosBlur
     *
     * brief
     *
     */
    onPosBlur(){

        let pos = parseInt(this.m_y_pos());

        if(Number.isNaN(pos) || (pos < this.minPos)){
            this.m_y_pos.set(`${this.selScroll.yPos}`);
            return;
        }
        if(pos > this.maxPos){
            pos = this.maxPos;
            this.m_y_pos.set(`${pos}`);
        }
        console.log(`new set pos: ${pos}`);

        this.selScroll.yPos = pos;
        this.storage.scrolls.update((scrolls)=>{
            return [...scrolls];
        });

        this.yPosSet(pos);
    }

    /***********************************************************************************************
     * @fn          yPosSet
     *
     * @brief
     *
     */
    yPosSet(pos: number) {

        if(pos < 0){
            pos = 0;
        }
        if(pos > this.maxPos){
            return;
        }

        this.dlgData.containerRef.scrollTo({
            top: pos * this.dlgData.imgDim.height / 100,
            left: 0,
            behavior: 'smooth'
        });
    }

    /***********************************************************************************************
     * @fn          addScroll
     *
     * @brief
     *
     */
    addScroll(){

        this.newIdx++;
        const scroll: gIF.scroll_t = {
            name: `new_${this.newIdx}`,
            yPos: 0
        }
        this.allScrolls.update((scrolls)=>{
            scrolls.push(scroll);
            return [...scrolls];
        });
        setTimeout(()=>{
            const lastIdx = this.allScrolls().length - 1;
            this.scrollSelect(lastIdx);
        }, 0);
    }
    /***********************************************************************************************
     * @fn          delScroll
     *
     * @brief
     *
     */
    delScroll(){

        if(this.allScrolls().length == 1){
            return;
        }
        const i = parseInt(this.m_scroll_sel());

        this.allScrolls.update((scrolls)=>{
            scrolls.splice(i, 1);
            return [...scrolls];
        });
        setTimeout(()=>{
            this.scrollSelect(0);
        }, 0);
    }

    /***********************************************************************************************
     * @fn          save
     *
     * @brief
     *
     */
    save() {

        const scroll_map = new Map<string, number>([
            [gConst.dumyScroll.name, gConst.dumyScroll.yPos]
        ]);
        let len = this.allScrolls().length;
        // remove name duplicates
        if(len){
            for(let i = 0; i < len; i++){
                scroll_map.set(this.allScrolls()[i].name, this.allScrolls()[i].yPos);
            }
        }
        const scrolls: gIF.scroll_t[] = [];
        scroll_map.forEach((yPos, name)=>{
            const scroll = {} as gIF.scroll_t;
            scroll.name = name;
            scroll.yPos = yPos;
            scrolls.push(scroll);
        });
        this.allScrolls.set(scrolls);

        this.storage.scrolls.set(this.allScrolls());
        this.storage.setScrolls(this.allScrolls());

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

}
