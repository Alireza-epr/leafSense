## Performance Metrics

| Metric | Before | After |
|------|--------|-------|
| LCP | ~2.1s | ~0.8s |
| FCP | ~0.7s | ~0.7s |
| CLS | 0.01 | 0.01 |
| TBT | 20ms | 0ms |

### Notes
- Code-split MapLibre and chart components
- Debounced STAC fetch and NDVI computation
- Cached NDVI results and STAC features
