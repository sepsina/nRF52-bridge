import {
    ApplicationRef,
    ComponentRef,
    EnvironmentInjector,
    Injectable,
    createComponent,
    inject,
} from '@angular/core';

import { ModalComponent } from '../modal/modal.component';
import * as gIF from '../gIF';

@Injectable({
    providedIn: 'root',
})
export class ModalService {

    modalComponent!: ComponentRef<ModalComponent>;
    dlgComponent!: ComponentRef<any>;

    dlgData = {} as any;
    dlgType!: gIF.eDlgType;

    openFlag = false;

    appRef = inject(ApplicationRef);
    envInjector = inject(EnvironmentInjector);

    constructor() {
        // ---
    }

    /***********************************************************************************************
     * fn          openDlg
     *
     * brief
     *
     */
    async openDlg(){

        let opts = {} as any;

        if(this.openFlag == true){
            return;
        }
        this.openFlag = true;
        opts.environmentInjector = this.envInjector;

        switch(this.dlgType){
            case gIF.eDlgType.E_ATTR_NAME: {
                const { SetName } = await import('../set-name/set-name');
                this.dlgComponent = createComponent(SetName, opts);
                break;
            }
            case gIF.eDlgType.E_ATTR_STYLE: {
                const { SetStyles } = await import('../set-styles/set-styles');
                this.dlgComponent = createComponent(SetStyles, opts);
                break;
            }
            case gIF.eDlgType.E_BINDS: {
                const { EditBinds } = await import('../binds/binds.page');
                this.dlgComponent = createComponent(EditBinds, opts);
                break;
            }
            case gIF.eDlgType.E_STATS: {
                const { EditStats } = await import('../x-stat/x_stat.page');
                this.dlgComponent = createComponent(EditStats, opts);
                break;
            }
            case gIF.eDlgType.E_SCROLLS: {
                const { EditScrolls } = await import('../edit-scrolls/edit-scrolls');
                this.dlgComponent = createComponent(EditScrolls, opts);
                break;
            }
            case gIF.eDlgType.E_LOGS: {
                const { ShowLogs } = await import('../logs/show-logs');
                this.dlgComponent = createComponent(ShowLogs, opts);
                break;
            }
            case gIF.eDlgType.E_UNITS: {
                const { SetCorr } = await import('../set-corr/set-corr');
                this.dlgComponent = createComponent(SetCorr, opts);
                break;
            }
            case gIF.eDlgType.E_SSR: {
                const { SSR } = await import('../ssr/ssr');
                this.dlgComponent = createComponent(SSR, opts);
                break;
            }
            case gIF.eDlgType.E_GRAPH: {
                const { Graph } = await import('../graph/graph');
                this.dlgComponent = createComponent(Graph, opts);
                break;
            }
            case gIF.eDlgType.E_ABOUT: {
                const { About } = await import('../about/about');
                this.dlgComponent = createComponent(About, opts);
                break;
            }
        }
        opts.projectableNodes = [
            [this.dlgComponent.location.nativeElement]
        ];
        this.modalComponent = createComponent(ModalComponent, opts);
        document.body.appendChild(this.modalComponent.location.nativeElement);

        // Attach views to the changeDetection cycle
        this.appRef.attachView(this.dlgComponent.hostView);
        this.appRef.attachView(this.modalComponent.hostView);
    }

    /***********************************************************************************************
     * fn          closeDlg
     *
     * brief
     *
     */
    closeDlg() {

        this.dlgComponent.destroy();
        this.modalComponent.destroy();

        this.openFlag = false;
    }
}
