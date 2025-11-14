import React from 'react';
import { render, screen } from '@testing-library/react';
import Map from "../src/components/Map"

test('Map renders without crashing', () => {
  render(<Map />);

  const mapElement = screen.getByTestId('map-container');
  expect(mapElement).toBeDefined()
});