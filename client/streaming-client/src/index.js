import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import Home from "./Home"
import Room from "./Room"

/**
 * This file bootstraps the React app and defines the main routing structure.
 * 
 * Key Components:
 * - Uses `<Provider>` to supply the Redux store globally.
 * - Uses `<Router>` with nested `<Routes>` to manage navigation between Home and Room wrapped by App.
 */

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="room/:roomId" element={<Room />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
