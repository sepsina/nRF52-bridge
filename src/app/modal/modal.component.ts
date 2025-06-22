import { Component, inject } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ModalService } from '../services/modal.service';

@Component({
    selector: 'app-modal',
    standalone: true,
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    imports: [
        CdkTrapFocus
    ]
})
export class ModalComponent {

    modal = inject(ModalService);

    constructor() {
        // ---
    }

    close(){
        this.modal.closeDlg();
    }
}
