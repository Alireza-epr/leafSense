# UX Notes – Earth Light Curve

## Interactions
- **ROI draw:** Click on the polygon tool to start drawing an ROI; drag vertices to modify, or optionally enter coordinates manually.  
- **Keyboard shortcuts:** D = start drawing ROI, Esc = cancel drawing.  
- **Loading states:** Show a spinner while fetching data from the STAC API.

## Accessibility (a11y)
- **Focus order – Home page:** Sidebar items → ROI tools → Date → Cloud sliders.  
- **Focus order – NDVI Chart page:** Chart panel → Export options → Sidebar.  
- **ARIA roles:** Buttons, sliders, charts, and interactive elements labeled appropriately for screen readers.  
- **Escape routes:** Esc cancels ROI drawing.  
- **Visible focus:** Active elements are clearly highlighted for keyboard navigation.
