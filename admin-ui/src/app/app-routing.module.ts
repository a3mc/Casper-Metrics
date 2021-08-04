import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OverviewComponent } from "./overview/overview.component";
import { AppComponent } from "./app.component";
import { AccountComponent } from "./account/account.component";
import { StakeUnlockComponent } from "./stake-unlock/stake-unlock.component";

const routes: Routes = [
    {
        path: '',
        component: OverviewComponent,
        pathMatch: 'full',
    },
    {
        path: 'account/:address',
        component: AccountComponent,
        pathMatch: 'full'
    },
    {
        path: 'stake-unlock',
        component: StakeUnlockComponent,
        pathMatch: 'full'
    },
];

@NgModule( {
    imports: [RouterModule.forRoot( routes )],
    exports: [RouterModule]
} )
export class AppRoutingModule {
}
