import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subscription } from 'rxjs';
import {
    dtoIdNameConfig,
    getDtoLabelAndIconById,
    getRelationshipListByDtoId,
} from '../reationshipConfig';

@Component({
    selector: 'app-select-relationship',
    templateUrl: './select-relationship.component.html',
    standalone: true,
    imports:[CommonModule, CardModule, ButtonModule]
})
export class SelectRelationshipComponent {
    itemsData: dtoIdNameConfig[] = [];
    dtoId: string = '';
    Id: string = '';
    McId: string = '';
    RsId: string = '';
    ModelData: any;
    header: any;
    submitted: boolean = false;
    selecteddto: { label?: string; icon?: string; } | undefined;
    private subscription: Subscription = new Subscription();

    constructor(
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (this.config.data) {
            this.dtoId = this.config.data.dtoId;
            this.Id = this.config.data.id;      
            this.McId = this.config.data.McId;
            this.RsId = this.config.data.RsId;      
            this.editOrder(this.dtoId);
            const keys = Object.keys(this.config.data);
            this.header = keys[0];
            const firstKeyValue = this.config.data[this.header];
            this.ModelData = firstKeyValue;
        }
    }

    CloseInstances() {
        this.ref.close({});
        this.submitted = false;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    // Edit order
    editOrder(dtoId: string) {
        this.dtoId = dtoId;
        this.itemsData = getRelationshipListByDtoId(dtoId) || [];
        this.selecteddto = getDtoLabelAndIconById(dtoId)
    }

    //-- View relationship --
    visit(itemName: string) {
        this.router.navigate([itemName.toLowerCase()], {
            queryParams: { id: this.dtoId, primarykey: this.Id , McId: this.McId, RsId: this.RsId},
        });
        setTimeout(() => {
            this.ref.close('close');
        }, 1);
    }

    // Helper method to get object keys
    objectKeys(obj: any): string[] {
        return Object.keys(obj);
    }
}
