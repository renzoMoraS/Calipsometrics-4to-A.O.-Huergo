// Dependencies
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// Components
import App from './components/App';
import BMap from './components/BMap';
//import CatTime from './components/CatTime';
import LoguedIn from './components/LoguedIn';
import Home from './components/Home';
import Page404 from './components/Page404';
import valoraciones from './components/Valoraciones';

const AppRoutes = () =>
    <App>
        <Switch>
            <Route exact path="/logued_in" component={LoguedIn} />
            <Route exact path="/" component={Home} />
            <Route exact path="/bmap" component={BMap} />
            <Route exact path="/valoraciones" component={valoraciones} />
            <Route component={Page404} />
        </Switch>
    </App>;


//<Route exact path="/cattime" component={CatTime} />

export default AppRoutes;