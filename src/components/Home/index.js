// Dependencies
import React, { Component } from 'react';
import photo from './MELI.png'

class Home extends Component {

  render() {
    return (
      <div className="Home">
        <h1 style={{textAlign: 'center'}} >HOME PAGE</h1>
        <a href="https://auth.mercadolibre.com/authorization?client_id=6722315906287226&response_type=code&state=5ca75bd30" >Loguearse con Mercadolibre</a>
        <img src={photo} alt="Fede Luna" style={{ display: 'block',marginLeft: 'auto',marginRight: 'auto',height: '50%', width: '50%' }}></img>
      </div>
    );
  }
}

export default Home;