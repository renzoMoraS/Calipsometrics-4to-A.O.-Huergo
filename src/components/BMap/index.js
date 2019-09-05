// Dependencies
import React, { Component } from 'react';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { parse } from 'query-string';


var complete_marker_list = {name: {}, lat: {}, long: {}};
var marker_list = {name: {0:0},cant: {0:0}, lat: {0:0}, long: {0:0}};
var url = 'https://api.mercadolibre.com/oauth/token?';

var options = {
  form: {
   "grant_type":"authorization_code",
   "client_id": '6722315906287226',
   "client_secret": 'su5nxkJECtvTyYp5GGVlGcy8QicnzeAI',
   "redirect_uri": "http://localhost:3000/logued_in",
   "code": ""
  },
  method: "POST", 
  headers: {
   'Content-Type': 'application/x-www-form-urlencoded',
   'Accept': 'application/json' 
  }
};

class BMap extends Component {

  componentWillMount(){

    const URLSearchParams = window.URLSearchParams;

    var burl = new URLSearchParams();

    burl.append("grant_type","authorization_code")
    burl.append("client_id", '6722315906287226')
    burl.append("client_secret", 'su5nxkJECtvTyYp5GGVlGcy8QicnzeAI',)
    burl.append("code",parse(this.props.location.search).code);
    burl.append("redirect_uri",options.form.redirect_uri)

    var aurl = url + burl

    console.log(aurl)

    fetch('http://localhost:8081/BMap')
        .then(function(datain) {
          return datain.json()
        })
        .then(function(dats){
          console.log(dats)
          var data = dats
          console.log(data)
          marker_list = {name: {0:0},cant: {0:0}, lat: {0:0}, long: {0:0}};

          //var data = JSON.parse(localStorage.getItem('clientsOrders'));

          var cont = 0;
          var cont2 = 0;

          for (var i = 0; i < data.results.length; i++) {
            if (data.results[i].shipping.receiver_address !== undefined) {
              if (data.results[i].shipping.receiver_address.latitude !== null) {

                complete_marker_list.name[cont] = data.results[i].buyer.nickname;
                complete_marker_list.lat[cont] = data.results[i].shipping.receiver_address.latitude;
                complete_marker_list.long[cont] = data.results[i].shipping.receiver_address.longitude;
                cont++;
              }
            }
          }

          for (var x = 0; x < Object.keys(complete_marker_list.lat).length; x++) {

            for (var y = 0; y < Object.keys(marker_list.lat).length; y++) {
          
              if(complete_marker_list.lat[x] === marker_list.lat[y] && complete_marker_list.long[x] === marker_list.long[y]){

                  if (marker_list.cant[y] === undefined) {
                    marker_list.cant[y] = 1;
                  }else{
                    marker_list.cant[y] = marker_list.cant[y] + 1;
                  }
                  break;

              }else if(y === Object.keys(marker_list.lat).length - 1){

                marker_list.name[cont2] = complete_marker_list.name[x];
                marker_list.lat[cont2] = complete_marker_list.lat[x];
                marker_list.long[cont2] = complete_marker_list.long[x];
                cont2++;
              }else if(marker_list.cant[y] === 0){
                marker_list.cant[y] = 1;
              }

            }
          }
          console.log(marker_list)
          localStorage.setItem('markerList',JSON.stringify(marker_list));
        })
  }

  render() {

    var ml = JSON.parse(localStorage.getItem('markerList'));
    
    var makers = [];

    function makeMarkers(){
      for (var i = 0;i<Object.keys(ml.lat).length;i++){
        makers.push(<Marker position={[ml.lat[i], ml.long[i]]}><Popup>{ml.name[i] + " : " + ml.cant[i] + " compra/s"}</Popup></Marker>);
        console.log(ml.cant[i])
      }

      return makers;
    }

    return (
      <div className="BMap">
        <h1 style={{textAlign: 'center'}}>MAP PAGE</h1>
        
        <div>
          <Map style={{ display: 'block',marginLeft: 'auto',marginRight: 'auto',height: '500px', width: '700px' }} center={[-34.304573, -64.76381]} zoom={3} maxZoom={17}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <MarkerClusterGroup maxClusterRadius={120}>
              {makeMarkers()}
            </MarkerClusterGroup>
          </Map>
        </div>
      </div>
    );
  }
}

export default (BMap);
