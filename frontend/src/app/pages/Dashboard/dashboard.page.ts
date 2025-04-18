import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ModalController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AddItemComponent } from '../../components/add-item/add-item.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage {
  items: any[] = [];
  filteredItems: any[] = [];
  searchTerm: string = '';
  role = '';

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ionViewWillEnter() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', token || '');

    this.role = localStorage.getItem('role') || '';

    this.http.get<any[]>('http://localhost:3000/api/items', { headers }).subscribe({
      next: (res) => {
        this.items = res;
        this.filteredItems = res;
      },
      error: (err) => {
        console.error('Error fetching inventory:', err);
      }
    });
  }

  filterItems() {
    const term = this.searchTerm.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      item.ItemName.toLowerCase().includes(term) ||
      item.Category.toLowerCase().includes(term)
    );
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: AddItemComponent,
    });

    modal.onDidDismiss().then((result) => {
      const data = result.data;
      if (data?.action === 'add') {
        this.items.push(data.item);
        this.filterItems();
      }
    });

    await modal.present();
  }

  async openEditModal(item: any, index: number) {
    const modal = await this.modalCtrl.create({
      component: AddItemComponent,
      componentProps: {
        itemData: { ...item },
        itemIndex: index
      }
    });

    modal.onDidDismiss().then((result) => {
      const data = result.data;
      if (data?.action === 'edit') {
        this.items[data.index] = data.item;
        this.filterItems();
      }
    });

    await modal.present();
  }

  async confirmDelete(index: number) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this item?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteItem(index);
          }
        }
      ]
    });

    await alert.present();
  }

  deleteItem(index: number) {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders().set('Authorization', token);

    this.http.delete(`http://localhost:3000/api/items/${index}`, { headers }).subscribe(() => {
      this.items.splice(index, 1);
      this.filterItems();
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

  // ✅ Download Inventory as CSV
  downloadCSV() {
    const headers = ['ItemName', 'Category', 'Quantity', 'Price', 'Supplier', 'RestockDate'];
    const rows = this.items.map(item =>
      headers.map(header => `"${(item[header] || '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'inventory.csv';
    anchor.click();

    window.URL.revokeObjectURL(url);
  }
}
