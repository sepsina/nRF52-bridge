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
import { UtilsService } from '../services/utils.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragHandle} from '@angular/cdk/drag-drop';

import * as gConst from '../gConst';
import * as gIF from '../gIF'

@Component({
    selector: 'app-set-styles',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CdkDrag,
        CdkDragHandle
    ],
    templateUrl: './set-styles.html',
    styleUrls: ['./set-styles.scss'],
    host: {
        '[attr.id]': 'hostID'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetStyles implements AfterViewInit {

    hostID = 'styles-dlg';

    testView = viewChild.required('testView', {read: ElementRef});
    fontSizeRef = viewChild.required('itemFontSize', {read: ElementRef});

    dlg_title = signal('');
    testEl = {} as HTMLElement;
    test_text = signal('');

    minFontSize = 5
    maxFontSize = 50;
    maxBorderWidth = 6;
    maxBorderRadius = 20;
    maxPaddingTop = 20;
    maxPaddingRight = 20;
    maxPaddingBottom = 20;
    maxPaddingLeft = 20;

    m_font_size = signal('');
    m_color = signal('#ffffff');
    m_bg_color = signal('#ffffff');
    m_opacity = signal('');
    m_border_color = signal('#ffffff');
    m_border_width = signal('');
    m_border_radius = signal('');
    m_border_style = signal('');
    m_padding_top = signal('');
    m_padding_left = signal('');
    m_padding_right = signal('');
    m_padding_bottom = signal('');

    borderStyles = gConst.BORDER_STYLES;
    style = {} as gIF.ngStyle_t;

    storage = inject(StorageService);
    utils = inject(UtilsService);
    dialogRef = inject(DialogRef);
    dlgData = inject(DIALOG_DATA);

    selItem = {} as gIF.netItem_t;

    constructor() {
        // copy style
        this.selItem = this.dlgData.keyVal.value;
        this.style = {...this.selItem.style};
    }
    /***********************************************************************************************
     * fn          ngAfterViewInit
     *
     * brief
     *
     */
    ngAfterViewInit(): void {

        this.test_text.set(this.selItem.formatedVal);
        this.dlg_title.set(this.selItem.name);

        this.testEl = this.testView().nativeElement;

        this.testEl.style.color = this.style.color;
        const rgba = this.utils.hexToRGB(this.style.bgColor, this.style.bgOpacity);
        this.testEl.style.backgroundColor = rgba;
        this.testEl.style.fontSize = `${this.style.fontSize}px`;

        this.testEl.style.borderColor = this.style.borderColor;
        this.testEl.style.borderWidth = `${this.style.borderWidth}px`;
        this.testEl.style.borderStyle = this.style.borderStyle;
        this.testEl.style.borderRadius = `${this.style.borderRadius}px`;

        this.testEl.style.paddingTop = `${this.style.paddingTop}px`;
        this.testEl.style.paddingRight = `${this.style.paddingRight}px`;
        this.testEl.style.paddingBottom = `${this.style.paddingBottom}px`;
        this.testEl.style.paddingLeft = `${this.style.paddingLeft}px`;

        this.m_color.set(this.style.color);
        this.m_bg_color.set(this.style.bgColor);
        this.m_opacity.set(`${this.style.bgOpacity}`);
        this.m_border_color.set(this.style.borderColor);
        this.m_border_width.set(`${this.style.borderWidth}`);
        this.m_border_radius.set(`${this.style.borderRadius}`);
        this.m_border_style.set(this.style.borderStyle);
        this.m_padding_top.set(`${this.style.paddingTop}`);
        this.m_padding_left.set(`${this.style.paddingLeft}`);
        this.m_padding_right.set(`${this.style.paddingRight}`);
        this.m_padding_bottom.set(`${this.style.paddingBottom}`);

        this.fontSizeRef().nativeElement.focus();
        this.fontSizeRef().nativeElement.select();
    }

    /***********************************************************************************************
     * fn          onColorChange
     *
     * brief
     *
     */
    onColorChange(newVal: string){

        console.log(`new color: ${newVal}`);

        this.style.color = newVal
        this.testEl.style.color = newVal;

        this.m_color.set(newVal);
    }

    /***********************************************************************************************
     * fn          onBackgroundColorChange
     *
     * brief
     *
     */
    onBackgroundColorChange(newVal: string){

        console.log(`new background color: ${newVal}`);

        const rgba = this.utils.hexToRGB(newVal, this.style.bgOpacity);
        console.log(`rgba: ${rgba}`);
        this.style.bgColor = newVal;
        this.testEl.style.backgroundColor = rgba;

        this.m_bg_color.set(newVal);
    }

    /***********************************************************************************************
     * fn          onOpacityChange
     *
     * brief
     *
     */
    onOpacityChange(newVal: string){

        const opacity = parseFloat(newVal);

        console.log(`new opacity: ${newVal}`);
        this.style.bgOpacity = opacity;

        const rgba = this.utils.hexToRGB(this.style.bgColor, opacity);
        console.log(`rgba: ${rgba}`);
        this.testEl.style.backgroundColor = rgba;

        this.m_opacity.set(newVal);
    }

    /***********************************************************************************************
     * fn          onFontSizeChange
     *
     * brief
     *
     */
    onFontSizeChange(newVal: string){

        this.m_font_size.set(newVal);

        let font_size = parseInt(newVal);
        if(Number.isNaN(font_size) == false){
            if(font_size >= this.minFontSize){
                if(font_size <= this.maxFontSize){
                    this.testEl.style.fontSize = `${font_size}px`;
                }
            }
        }
    }

    /***********************************************************************************************
     * fn          onFontSizeBlur
     *
     * brief
     *
     */
    onFontSizeBlur(){

        let font_size = parseInt(this.m_font_size());

        if(font_size == this.style.fontSize){
            return;
        }
        if(Number.isNaN(font_size) || (font_size < this.minFontSize)){
            this.m_font_size.set(`${this.style.fontSize}`);
            return;
        }
        if(font_size > this.maxFontSize){
            font_size = this.maxFontSize;
        }
        console.log(`new font size: ${font_size}`);
        this.style.fontSize = font_size;
        this.testEl.style.fontSize = `${font_size}px`;

        this.m_font_size.set(`${font_size}`);
    }

    /***********************************************************************************************
     * fn          onBorderColorChange
     *
     * brief
     *
     */
    onBorderColorChange(newVal: string){

        console.log(`new border color: ${newVal}`);

        this.style.borderColor = newVal;
        this.testEl.style.borderColor = newVal;

        this.m_border_color.set(newVal);
    }

    /***********************************************************************************************
     * fn          onBorderWidthChange
     *
     * brief
     *
     */
    onBorderWidthChange(newVal: string){

        this.m_border_width.set(newVal);

        let border_width = parseInt(newVal);
        if(Number.isNaN(border_width) == false){
            if(border_width <= this.maxBorderWidth){
                this.testEl.style.borderWidth = `${border_width}px`;
            }
        }
    }

    /***********************************************************************************************
     * fn          onBorderWidthBlur
     *
     * brief
     *
     */
    onBorderWidthBlur(){

        let border_width = parseInt(this.m_border_width());

        if(border_width == this.style.borderWidth){
            return;
        }
        if(Number.isNaN(border_width)){
            this.m_border_width.set(`${this.style.borderWidth}`);
        }
        if(border_width > this.maxBorderWidth){
            border_width = this.maxBorderWidth;
        }
        console.log(`new border width: ${border_width}`);
        this.style.borderWidth = border_width;
        this.testEl.style.borderWidth = `${border_width}px`;

        this.m_border_width.set(`${border_width}`);
    }

    /***********************************************************************************************
     * fn          onBorderRadiusChange
     *
     * brief
     *
     */
    onBorderRadiusChange(newVal: string){

        this.m_border_radius.set(newVal);

        let border_radius = parseInt(newVal);
        if(Number.isNaN(border_radius) == false){
            if(border_radius <= this.maxBorderRadius){
                this.testEl.style.borderRadius = `${border_radius}px`;
            }
        }
    }

    /***********************************************************************************************
     * fn          onBorderRadiusBlur
     *
     * brief
     *
     */
    onBorderRadiusBlur(){

        let border_radius = parseInt(this.m_border_radius());

        if(border_radius == this.style.borderRadius){
            return;
        }
        if(Number.isNaN(border_radius)){
            this.m_border_radius.set(`${this.style.borderRadius}`);
        }
        if(border_radius > this.maxBorderRadius){
            border_radius = this.maxBorderRadius;
        }
        console.log(`new border radius: ${border_radius}`);
        this.style.borderRadius = border_radius;
        this.testEl.style.borderRadius = `${border_radius}px`;

        this.m_border_radius.set(`${border_radius}`);
    }

    /***********************************************************************************************
     * fn          onBorderStyleChange
     *
     * brief
     *
     */
    onBorderStyleChange(newStyle: string){

        console.log(`new border style: ${newStyle}`);

        this.style.borderStyle = newStyle;
        this.testEl.style.borderStyle = newStyle;

        this.m_border_style.set(newStyle);
    }

    /***********************************************************************************************
     * fn          onPaddingTopChange
     *
     * brief
     *
     */
    onPaddingTopChange(newVal: string){

        this.m_padding_top.set(newVal);

        let padding_top = parseInt(newVal);
        if(Number.isNaN(padding_top ) == false){
            if(padding_top <= this.maxPaddingTop){
                this.testEl.style.paddingTop = `${padding_top}px`;
            }
        }
    }

    /***********************************************************************************************
     * fn          onPaddingTopBlur
     *
     * brief
     *
     */
    onPaddingTopBlur(){

        let padding_top = parseInt(this.m_padding_top());

        if(padding_top == this.style.paddingTop){
            return;
        }
        if(Number.isNaN(padding_top)){
            this.m_padding_top.set(`${this.style.paddingTop}`);
        }
        if(padding_top > this.maxPaddingTop){
            padding_top = this.maxPaddingTop;
        }
        console.log(`new padding top: ${padding_top}`);
        this.style.paddingTop = padding_top;
        this.testEl.style.paddingTop = `${padding_top}px`;

        this.m_padding_top.set(`${padding_top}`);
    }

    /***********************************************************************************************
     * fn          onPaddingRightChange
     *
     * brief
     *
     */
    onPaddingRightChange(newVal: string){

        this.m_padding_right.set(newVal);

        let padding_right = parseInt(newVal);
        if(Number.isNaN(padding_right) == false){
            if(padding_right <= this.maxPaddingRight){
                this.testEl.style.paddingRight = `${padding_right}px`;
            }
        }
    }

    /***********************************************************************************************
     * fn          onPaddingRightBlur
     *
     * brief
     *
     */
    onPaddingRightBlur(){

        let padding_right= parseInt(this.m_padding_right());

        if(padding_right == this.style.paddingRight){
            return;
        }
        if(Number.isNaN(padding_right)) {
            this.m_padding_right.set(`${this.style.paddingRight}`);
        }
        if(padding_right > this.maxPaddingRight){
            padding_right = this.maxPaddingRight;
        }
        console.log(`new padding right ${padding_right}`);
        this.style.paddingRight = padding_right;
        this.testEl.style.paddingRight = `${padding_right}px`;

        this.m_padding_right.set(`${padding_right}`);
    }

    /***********************************************************************************************
     * fn          onPaddingBottomChange
     *
     * brief
     *
     */
    onPaddingBottomChange(newVal: string){

        this.m_padding_bottom.set(newVal);

        let padding_bottom = parseInt(newVal);
        if(Number.isNaN(padding_bottom) == false){
            if(padding_bottom <= this.maxPaddingBottom){
                this.testEl.style.paddingBottom = `${padding_bottom}px`;
            }
        }
    }

    /***********************************************************************************************
     * fn          onPaddingBottomBlur
     *
     * brief
     *
     */
    onPaddingBottomBlur(){

        let padding_bottom= parseInt(this.m_padding_bottom());

        if(padding_bottom == this.style.paddingBottom){
            return;
        }
        if(Number.isNaN(padding_bottom)) {
            this.m_padding_bottom.set(`${this.style.paddingBottom}`);
        }
        if(padding_bottom > this.maxPaddingBottom){
            padding_bottom = this.maxPaddingBottom;
        }
        console.log(`new padding bottom ${padding_bottom}`);
        this.style.paddingBottom = padding_bottom;
        this.testEl.style.paddingBottom = `${padding_bottom}px`;

        this.m_padding_bottom.set(`${padding_bottom}`);
    }

    /***********************************************************************************************
     * fn          onPaddingLeftChange
     *
     * brief
     *
     */
    onPaddingLeftChange(newVal: string){

        this.m_padding_left.set(newVal);

        let padding_left = parseInt(newVal);
        if(Number.isNaN(padding_left) == false){
            if(padding_left <= this.maxPaddingLeft){
                this.testEl.style.paddingLeft = `${padding_left}px`;
            }
        }
    }

    /***********************************************************************************************
     * fn          onPaddingLeftBlur
     *
     * brief
     *
     */
    onPaddingLeftBlur(){

        let padding_left = parseInt(this.m_padding_left());

        if(padding_left == this.style.paddingLeft){
            return;
        }
        if(Number.isNaN(padding_left)) {
            this.m_padding_left.set(`${this.style.paddingLeft}`);
        }
        if(padding_left > this.maxPaddingLeft){
            padding_left = this.maxPaddingLeft;
        }
        console.log(`new padding left ${padding_left}`);
        this.style.paddingLeft = padding_left;
        this.testEl.style.paddingLeft = `${padding_left}px`;

        this.m_padding_left.set(`${padding_left}`);
    }

    /***********************************************************************************************
     * fn          save
     *
     * brief
     *
     */
    save() {

        this.storage.setItemStyle(this.style, this.dlgData.keyVal);
        console.log(this.style);
        this.dialogRef.close();
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

}
