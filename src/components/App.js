// Dependencies
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Components
import Header from './Global/Header'
import Content from './Global/Content'
import Footer from './Global/Footer'

// Data
import items from '../data/menu';

class App extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired
  };

  render() {
    const { children } = this.props;
    
    return (
      <div className="App">
        <Header title="Calipmetrics Grupo 3" items={items} />
        <Content body={children} />
        <Footer copyright="&copy; Calipso Software S.A. 2019" />
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
          integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
          crossorigin="anonymous"
        />
      </div>
    );
  }
}

export default App;
