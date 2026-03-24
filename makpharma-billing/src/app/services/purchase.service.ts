import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class PurchaseService {

  private key = 'purchases';

  getPurchases(){

    return JSON.parse(localStorage.getItem(this.key) || '[]');

  }

  addPurchase(purchase:any){

    const purchases = this.getPurchases();

    purchases.push(purchase);

    localStorage.setItem(this.key, JSON.stringify(purchases));

  }

}