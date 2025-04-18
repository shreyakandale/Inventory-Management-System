import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss'],
  standalone: false,
})
export class AddItemComponent {
  @Input() itemData: any;
  @Input() itemIndex!: number;

  item = {
    ItemName: '',
    Category: '',
    Quantity: 0,
    Price: 0,
    Supplier: '',
    RestockDate: '',
    Image: '' // base64
  };

  isEditMode = false;

  constructor(private modalCtrl: ModalController, private http: HttpClient) {}

  ngOnInit() {
    if (this.itemData) {
      this.item = { ...this.itemData };
      this.isEditMode = true;
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.item.Image = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders().set('Authorization', token);

    if (this.isEditMode) {
      this.http.put(`http://localhost:3000/api/items/${this.itemIndex}`, this.item, { headers })
        .subscribe(() => {
          this.modalCtrl.dismiss({ action: 'edit', item: this.item, index: this.itemIndex });
        });
    } else {
      this.http.post('http://localhost:3000/api/items', this.item, { headers })
        .subscribe(() => {
          this.modalCtrl.dismiss({ action: 'add', item: this.item });
        });
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
