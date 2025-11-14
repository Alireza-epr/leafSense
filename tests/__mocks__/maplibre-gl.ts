const maplibregl = {
  Map: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    getCanvas: jest.fn(() => document.createElement('canvas')),
    addControl: jest.fn(),
  })),
  NavigationControl: jest.fn(),
  LngLat: jest.fn(),
};

export default maplibregl;
