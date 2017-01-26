import { Component, OnInit } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Http, Response } from '@angular/http';

// Statics
import 'rxjs/add/observable/throw';

// Operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

declare var plugin: any;

const API_BASE = 'http://dev.alexandrebonhomme.fr/vlille/web';
const API_ENDPOINT = '/stations';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage implements OnInit {
    private mapInstance: any;
    private mapInstanceObserver: Observable<any>;

    private markers: any = [];

    constructor(
        private http: Http,
        private platform: Platform
    ) {
        // init the map
        this.mapInstanceObserver = this.prepareMapInstance();
    }

    ngOnInit() {
        // wait for map instance to be initialized
        this.mapInstanceObserver.subscribe(mapInstance => {
            this.mapInstance = mapInstance;

            // init stations marker
            this.http
            .get(API_BASE + API_ENDPOINT)
            .map((response: Response) => response.json())
            .catch(error => {
                console.error(error);
                return Observable.throw(error);
            })
            .subscribe((stations: any[]) => {
                this.initMarkers(stations.slice(0, 100)).subscribe(() => {
                    this.mapInstance.animateCamera({
                        target: this.markers
                    });
                    console.log("done")
                })
            });
        });
    }

    /**
     * Initialize map instance and bind it to #map-canvas element
     * @return {Observable<any>}
     */
    private prepareMapInstance(): Observable<any> {
        return new Observable<any>(
            observer => {
                this.platform.ready().then(() => {
                    // init map instance
                    plugin.google.maps.Map
                        .getMap(document.getElementById('map-canvas'))
                        .one(plugin.google.maps.event.MAP_READY, observer.next.bind(observer));
                });
            }
        );
    }

    /**
     * Create stations markers on the map
     * @param  {VlilleStationResume[]} stations
     * @return {Observable<google.maps.Marker[]>}
     */
    private initMarkers(stations: any[]): Observable<any> {
        return new Observable(observer => {
            console.debug("markers creation start")
            let start = Date.now();

            // avoids function declaration inside loop
            function callback(marker) {
                // store list of markers
                this.markers.push(marker);

                /**
                 * Set active marker on click
                 */
                marker.on(plugin.google.maps.event.MARKER_CLICK, () => {
                    this.setActiveMarker(marker);
                });

                /**
                 * addMarker is async, so we need to wait until all the marker are adds to the map.
                 * @see https://github.com/mapsplugin/cordova-plugin-googlemaps/wiki/Marker#create-multiple-markers
                 */
                if (this.markers.length !== stations.length) {
                    return;
                }

                let duration = ((Date.now() - start) / 1000).toFixed(2);
                console.debug("markers creation done: ", duration)
                alert("Duration: " + duration + "s");

                // indicates that markers creation is done
                observer.next(this.markers);
            }

            // adds stations markers on map
            for (let station of stations) {
                this.mapInstance.addMarker({
                    position: {
                        lat: station.latitude,
                        lng: station.longitude
                    },
                    // icon: this.markerIcon,
                    station: station,
                    disableAutoPan: true
                }, callback.bind(this));
            }
        });
    }
}
