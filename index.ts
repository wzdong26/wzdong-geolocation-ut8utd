// Import stylesheets
import './style.css';

import { geolocation, GeolocatorType } from './src/utils/geolocation';

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById('app');
appDiv.innerHTML = `<h1>Geolocaton API</h1>`;

const buttonTypeList = {
  [GeolocatorType.H5]: 'H5 geolocation',
  [GeolocatorType.GD]: '高德 geolocation',
  [GeolocatorType.BD]: '百度 geolocation',
  [GeolocatorType.TX]: '腾讯 geolocation',
  9999: 'geolocation',
};

const createLocationBtn = (geolocatorType, geolocatorName) => {
  const buttonDom = document.createElement('button');
  buttonDom.innerText = geolocatorName;
  appDiv.appendChild(buttonDom);
  buttonDom.addEventListener('click', () => {
    geolocation({}, geolocatorType).then((res) => {
      console.log(res);
    });
  });
};

Object.entries(buttonTypeList).forEach(([key, value]) => {
  console.log(key, value);
  createLocationBtn(key, value);
});
