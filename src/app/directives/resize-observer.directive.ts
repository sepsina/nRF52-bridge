// from erhise -> https://stackblitz.com/edit/angular-resize-observer
import {
    Directive,
    ElementRef,
    EventEmitter,
    Output,
    OnDestroy,
    output,
    inject
} from '@angular/core';

const entriesMap = new WeakMap();

const ro = new ResizeObserver((entries)=>{
    for(const entry of entries) {
        if(entriesMap.has(entry.target)){
            const comp = entriesMap.get(entry.target);
            if(comp.tmo){
                clearTimeout(comp.tmo);
            }
            comp.tmo = setTimeout(()=>{
                comp.tmo = null;
                comp._resizeCallback(entry);
            }, 200);
        }
    }
});

@Directive({
    selector: '[resizeObserver]',
    standalone: true,
})
export class ResizeObserverDirective implements OnDestroy {

    resize = output<any>();
    tmo = null;

    el = inject(ElementRef);

    constructor() {
        const target = this.el.nativeElement;
        entriesMap.set(target, this);
        ro.observe(target);
    }

    _resizeCallback(entry: any) {
        this.resize.emit(entry);
    }

    ngOnDestroy() {
        const target = this.el.nativeElement;
        ro.unobserve(target);
        entriesMap.delete(target);
    }
}
