import {
    Component,
    AfterViewInit,
    ElementRef,
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

import * as gConst from '../gConst';
import * as gIF from '../gIF'

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragHandle} from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-name',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './set-name.html',
    styleUrls: ['./set-name.scss'],
    host: {
        '[attr.id]': 'hostID'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetName implements AfterViewInit {

    hostID = 'name-dlg';
    itemNameRef = viewChild.required('itemName', {read: ElementRef});

    name = '';
    minNameLen = 2;
    maxNameLen = 16;

    title = signal('');

    m_name = signal('');

    storage = inject(StorageService);
    dialogRef = inject(DialogRef);
    dlgData = inject(DIALOG_DATA);

    selItem = {} as gIF.keyVal_t;

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

        this.selItem = this.dlgData.keyVal;
        this.name = this.selItem.value.name;
        this.title.set(this.name);
        this.m_name.set(this.name);

        setTimeout(() => {
            this.itemNameRef().nativeElement.focus();
            this.itemNameRef().nativeElement.select();
        }, 0);
    }

    /***********************************************************************************************
     * @fn          save
     *
     * @brief
     *
     */
    save() {
        this.storage.setItemName(this.name, this.selItem);
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
     * @fn          onNameChange
     *
     * @brief
     *
     */
    onNameChange(newName: string){

        const name_len = newName.length;
        if(newName != ''){
            if(name_len >= this.minNameLen){
                if(name_len <= this.maxNameLen){
                    this.name = newName;
                }
            }
        }
        this.m_name.set(newName);
    }

    /***********************************************************************************************
     * @fn          onNameBlur
     *
     * @brief
     *
     */
    onNameBlur(){

        const nameLen = this.m_name().length;
        if(this.m_name() == '' || (nameLen < this.minNameLen) || (nameLen > this.maxNameLen)) {
            this.m_name.set(this.name);
            return;
        }
        this.name = this.m_name();

    }

}
