import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BehaviorSubject, Subscription } from 'rxjs';

declare var google: any;

interface obj {
  title: string,
  address: string,
  lat: string,
  lng: string
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class HomePage implements OnInit, OnDestroy {

  places: any[] = [];
  query: string = '';
  placesSub: Subscription = new Subscription();
  private _places = new BehaviorSubject<any[]>([]);
  favoritos: obj[] = [];

  get search_places(){
    return this._places.asObservable();
  }

  constructor(private zone: NgZone) {}

  ngOnInit(): void {
    this.placesSub = this.search_places.subscribe({
      next: (places: any) => {
        this.places = places;
      },
      error: (e: any) => {
        console.log(e)
      }
    });
  }

  setFav(localizacao: obj){
    if(this.verificaFav(localizacao.address)){
      const index = this.favoritos.findIndex(obj => obj == localizacao);
      this.favoritos.splice(index, 1);
    }
    else{
      this.favoritos.push(localizacao)
    };
  }

  verificaFav(address: string){
    return this.favoritos.some(obj => obj.address === address);
  }
  
  async onSearchChange(event: any){
    console.log(event);
    this.query = event.detail.value;
    if(this.query.length > 0) await this.getPlaces();
  }

  async getPlaces(){
    try {
      let service = new google.maps.places.AutocompleteService();
      let res = await service.getPlacePredictions({input: this.query });
      let autoCompleteItems: any[] = [];
      this.zone.run(() => {
        if(res != null) {
          res.predictions.forEach(
            async (prediction: any) => {
              let latLng: any = await this.geoCode(prediction.description);
              const places = {
                title: prediction.structured_formatting.main_text,
                address: prediction.description,
                lat: latLng.lat,
                lng: latLng.lng
              };
              console.log(`places: ${places}`);
              autoCompleteItems.push(places);
            }
          );
          this._places.next(autoCompleteItems);
        }
      });
    }
    catch(e) {
      console.log(e);
    }
  }

  geoCode(address: any) {
    let latlng = {lat: '', lng: ''};
    return new Promise ((resolve, reject) => {
      let geocoder = new google.maps.Geocoder();
      geocoder.geocode({'address' : address}, (results: any) => {
        console.log(`results: ${results}`);
        latlng.lat = results[0].geometry.location.lat();
        latlng.lng = results[0].geometry.location.lng();
        resolve(latlng);
      });
    });
  }

  ngOnDestroy(): void {
    if(this.placesSub) this.placesSub.unsubscribe();
  }

}