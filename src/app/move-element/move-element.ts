import {
    Component,
    ElementRef,
    AfterViewInit,
    viewChild,
    inject,
    signal
} from '@angular/core';

import {
    DialogRef,
    DIALOG_DATA
} from '@angular/cdk/dialog';

import { ModalService } from '../services/modal.service';
import { StorageService } from '../services/storage.service';

import * as gConst from '../gConst';
import * as gIF from '../gIF'

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragHandle} from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-move-element',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './move-element.html',
    styleUrls: ['./move-element.scss'],
    host: {
        '[attr.id]': 'hostID',
    },
})
export class MoveElement implements AfterViewInit {

    hostID = 'move-dlg';

    scrollSelRef = viewChild.required('scrollSel', {read: ElementRef});

    title = signal('');

    allScrolls = signal<gIF.scroll_t[]>([]);
    selScroll = {} as gIF.scroll_t;
    scrollIdx = 0;

    selItem = {} as gIF.keyVal_t;
    containerRef: any;
    imgDim = {} as gIF.imgDim_t;
    dragRef!: CdkDrag;
    prevPos: any;

    startFlag = true;

    modal = inject(ModalService);
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

        setTimeout(() => {
            this.selItem = this.modal.dlgData.selItem;
            this.containerRef = this.modal.dlgData.containerRef;
            this.title.set(`${this.selItem.value.name}`);
            this.selItem.value.drag = true;

            this.imgDim.height = this.modal.dlgData.imgDim.height;
            this.imgDim.width = this.modal.dlgData.imgDim.width;

            this.dragRef = this.modal.dlgData.dragRef;
            this.prevPos = this.dragRef.getFreeDragPosition();

            this.allScrolls.set(JSON.parse(this.modal.dlgData.scrolls));
            //this.allScrolls[0].name = 'move to'
            this.allScrolls.update((scrolls)=>{
                scrolls[0].name = 'move to';
                return [...scrolls];
            });
            this.selScroll = this.allScrolls()[0];
            this.scrollIdx = 0;
            this.scrollSelRef().nativeElement.value = '0';
        }, 0);
    }

    /***********************************************************************************************
     * fn          onScrollSelected
     *
     * brief
     *
     */
    onScrollSelected(idx: string){

        this.scrollIdx = parseInt(idx);
        this.scrollSelect(this.scrollIdx);
    }

    /***********************************************************************************************
     * fn          scrollSelect
     *
     * brief
     *
     */
    scrollSelect(idx: number){

        if(this.startFlag == true){
            this.startFlag = false;
            this.allScrolls.update((scrolls)=>{
                scrolls.shift();
                return [...scrolls];
            });
            idx--;
            this.scrollIdx = idx;
            setTimeout(()=>{
                this.scrollSelect(this.scrollIdx);
            }, 0);
            return;
        }
        this.scrollIdx = idx;
        this.scrollSelRef().nativeElement.value = `${this.scrollIdx}`;
        this.selScroll = this.allScrolls()[idx];

        if(this.allScrolls().length){
            const x = 0;
            const y = (this.selScroll.yPos * this.imgDim.height) / 100;

            this.containerRef.scrollTo({
                top: y,
                left: x,
                behavior: 'smooth'
            });
            this.dragRef.setFreeDragPosition({x: x, y: y});
        }
    }

    /***********************************************************************************************
     * fn          save
     *
     * brief
     *
     */
    save() {

        const evtPos = this.dragRef.getFreeDragPosition();
        let pos: gIF.nsPos_t = {
            x: evtPos.x / this.imgDim.width,
            y: evtPos.y / this.imgDim.height,
        };
        this.selItem.value.pos = pos;
        this.storage.setItemPos(pos, this.selItem);
        this.selItem.value.drag = false;

        this.modal.closeDlg();
    }

    /***********************************************************************************************
     * fn          close
     *
     * brief
     *
     */
    close() {

        this.selItem.value.drag = false;
        this.modal.closeDlg();
    }

}


