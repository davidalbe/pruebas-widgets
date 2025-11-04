export const mapConfig = {
  mapStyle: '/styles/estilo-mapa.json',
  initialViewState: {
    longitude: 12.78728,
    latitude: 49.342414,
    zoom: 3.5,
  },
  interactionOptions: {
    dragPan: false,
    dragRotate: false,
    scrollZoom: false,
    doubleClickZoom: false,
    touchZoomRotate: false,
    keyboard: false,
    boxZoom: false,
    minZoom: 3.5,
    maxZoom: 3.5,
  },
  legend: {
    title: 'Score país',
    items: [
      { score: -3, label: '−3', color: '#8b0000' },
      { score: -2, label: '−2', color: '#b22222' },
      { score: -1, label: '−1', color: '#d2691e' },
      { score: 0, label: '0', color: '#e6e6e6' },
      { score: 1, label: '+1', color: '#7fbf7f' },
      { score: 2, label: '+2', color: '#2e8b57' },
      { score: 3, label: '+3', color: '#006400' },
    ],
  },
  fillLayer: {
    opacity: 0.9,
    antialias: true,
    colorStops: [
      { score: -3, color: '#8b0000' },
      { score: -2, color: '#b22222' },
      { score: -1, color: '#d2691e' },
      { score: 0, color: '#e6e6e6' },
      { score: 1, color: '#7fbf7f' },
      { score: 2, color: '#2e8b57' },
      { score: 3, color: '#006400' },
    ],
    beforeLayerId: null,
  },
  outlineLayer: {
    color: 'rgba(0,0,0,0.25)',
    width: 0.5,
    beforeLayerId: null,
  },
  randomScoreRange: {
    min: -3,
    max: 3,
  },
  cities: [
    { id: 1, name: 'Madrid', lat: 40.4168, lng: -3.7038, info: 'Capital de España' },
    { id: 2, name: 'Barcelona', lat: 41.3874, lng: 2.1686, info: 'Ciudad Condal' },
  ],
  geoJsonSources: ['/data/europe.geojson'],
};

export default mapConfig;
