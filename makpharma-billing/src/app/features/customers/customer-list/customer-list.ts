import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../services/customer';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css'
})
export class CustomerList {

  customers:any[] = [];

  searchText:string = '';

  showForm:boolean = false;

  editIndex:number | null = null;

  customer:any = {
    name:'',
    phone:'',
    email:'',
    address:'',
    state:'Tamil Nadu',
    gst:''
  };

  // ✅ Pagination
  currentPage:number = 1;
  itemsPerPage:number = 5;

  constructor(private customerService:CustomerService){
    this.customers = this.customerService.getCustomers();
  }

  openForm(){
    this.showForm = true;
    this.editIndex = null;

    this.customer = {
      name:'',
      phone:'',
      email:'',
      address:'',
      state:'Tamil Nadu',
      gst:''
    };
  }

  saveCustomer(){
    if(this.editIndex === null){
      this.customerService.addCustomer({...this.customer});
    }else{
      this.customerService.updateCustomer(this.editIndex,{...this.customer});
    }

    this.customers = this.customerService.getCustomers();
    this.resetForm();
  }

  editCustomer(index:number){
    this.editIndex = index;
    this.customer = {...this.customers[index]};
    this.showForm = true;
  }

  deleteCustomer(index:number){
    this.customerService.deleteCustomer(index);
    this.customers = this.customerService.getCustomers();
  }

  resetForm(){
    this.customer = {
      name:'',
      phone:'',
      email:'',
      address:'',
      state:'Tamil Nadu',
      gst:''
    };

    this.showForm = false;
    this.editIndex = null;
  }

  // ✅ Pagination Logic
  get filteredCustomers(){
    return this.customers.filter(x =>
      x.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  get paginatedCustomers(){
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCustomers.slice(start, start + this.itemsPerPage);
  }

  get totalPages(){
    return Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
  }

  changePage(page:number){
    this.currentPage = page;
  }

  // ✅ Download Single
  downloadCustomer(customer:any){
    const data = JSON.stringify(customer, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${customer.name}.json`;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  // ✅ Download All
  downloadAllCustomers(){
    const data = JSON.stringify(this.customers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `all_customers.json`;
    a.click();

    window.URL.revokeObjectURL(url);
  }

}